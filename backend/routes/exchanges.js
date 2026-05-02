const express = require("express");
const db = require("../db/init");
const { auth } = require("../middleware/auth");

const router = express.Router();

function ensureColumn(table, column, definition) {
 const cols = db.prepare(`PRAGMA table_info(${table})`).all();
 if (!cols.some((c) => c.name === column)) {
 db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
 }
}

ensureColumn("exchanges", "counter_item_ids", "TEXT DEFAULT '[]'");
ensureColumn("exchanges", "counter_status", "TEXT DEFAULT ''");
ensureColumn("exchanges", "counter_message", "TEXT DEFAULT ''");
ensureColumn("exchanges", "updated_at", "DATETIME");
ensureColumn("exchanges", "availability_proposals", "TEXT DEFAULT '[]'");
ensureColumn("exchanges", "availability_status", "TEXT DEFAULT ''");
ensureColumn("exchanges", "confirmed_slot", "TEXT DEFAULT ''");

function parseIds(value) {
 try {
 return JSON.parse(value || "[]");
 } catch {
 return [];
 }
}

function getItemsByIds(ids) {
 const cleanIds = ids.map(Number).filter(Boolean);
 if (!cleanIds.length) return [];

 const placeholders = cleanIds.map(() => "?").join(",");

 return db
 .prepare(
 `SELECT id, title, category, image_url
 FROM items
 WHERE id IN (${placeholders})`
 )
 .all(...cleanIds);
}

function hydrateExchange(ex) {
 const offeredIds = parseIds(ex.offered_item_ids);
 const counterIds = parseIds(ex.counter_item_ids);

 return {
 ...ex,
 offered_item_ids: offeredIds,
 counter_item_ids: counterIds,
 offeredItems: getItemsByIds(offeredIds),
 counterItems: getItemsByIds(counterIds),
 };
}

router.post("/", auth, (req, res) => {
 const { offered_item_ids, requested_item_id, message } = req.body;

 if (!offered_item_ids?.length || !requested_item_id) {
 return res.status(400).json({ error: "Données manquantes" });
 }

 const requestedItem = db
 .prepare("SELECT * FROM items WHERE id = ? AND status = 'active'")
 .get(requested_item_id);

 if (!requestedItem) {
 return res.status(404).json({ error: "Objet demandé introuvable" });
 }

 const ids = offered_item_ids.map(Number);

 const result = db
 .prepare(
 `INSERT INTO exchanges
 (proposer_id, receiver_id, offered_item_ids, requested_item_id, message, status, updated_at)
 VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
 )
 .run(
 req.user.id,
 requestedItem.user_id,
 JSON.stringify(ids),
 requested_item_id,
 message || ""
 );

 res.json({ id: result.lastInsertRowid, success: true });
});

router.get("/", auth, (req, res) => {
 const exchanges = db
 .prepare(
 `SELECT e.*,
 u1.username as proposer_name,
 u2.username as receiver_name,
 i.title as requested_item_title,
 i.image_url as requested_item_image,
 i.category as requested_item_category
 FROM exchanges e
 JOIN users u1 ON e.proposer_id = u1.id
 JOIN users u2 ON e.receiver_id = u2.id
 JOIN items i ON e.requested_item_id = i.id
 WHERE e.proposer_id = ? OR e.receiver_id = ?
 ORDER BY datetime(COALESCE(e.updated_at, e.created_at)) DESC`
 )
 .all(req.user.id, req.user.id);

 res.json(exchanges.map(hydrateExchange));
});

router.get("/:id", auth, (req, res) => {
 const exchange = db
 .prepare(
 `SELECT e.*,
 u1.username as proposer_name,
 u2.username as receiver_name,
 i.title as requested_item_title,
 i.image_url as requested_item_image,
 i.category as requested_item_category
 FROM exchanges e
 JOIN users u1 ON e.proposer_id = u1.id
 JOIN users u2 ON e.receiver_id = u2.id
 JOIN items i ON e.requested_item_id = i.id
 WHERE e.id = ?
 AND (e.proposer_id = ? OR e.receiver_id = ?)`
 )
 .get(req.params.id, req.user.id, req.user.id);

 if (!exchange) {
 return res.status(404).json({ error: "Échange introuvable" });
 }

 res.json(hydrateExchange(exchange));
});

router.patch("/:id/status", auth, (req, res) => {
 const { status } = req.body;

 if (!["accepted", "declined", "cancelled"].includes(status)) {
 return res.status(400).json({ error: "Statut invalide" });
 }

 const exchange = db
 .prepare("SELECT * FROM exchanges WHERE id = ?")
 .get(req.params.id);

 if (!exchange) {
 return res.status(404).json({ error: "Échange introuvable" });
 }

 if (status === "accepted") {
 const offeredIds = parseIds(exchange.offered_item_ids);
 const allIds = [...offeredIds, exchange.requested_item_id];

 if (allIds.length) {
 const placeholders = allIds.map(() => "?").join(",");
 db.prepare(
 `UPDATE items SET status = 'exchanged'
 WHERE id IN (${placeholders})`
 ).run(...allIds);
 }
 }

 db.prepare(
 `UPDATE exchanges
 SET status = ?,
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(status, req.params.id);

 res.json({ success: true });
});

router.post("/:id/counter", auth, (req, res) => {
 const { requested_item_ids, message } = req.body;

 if (!requested_item_ids?.length) {
 return res.status(400).json({ error: "Aucun objet sélectionné" });
 }

 db.prepare(
 `UPDATE exchanges
 SET counter_item_ids = ?,
 counter_status = 'pending',
 counter_message = ?,
 status = 'pending',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(
 JSON.stringify(requested_item_ids.map(Number)),
 message || "Je souhaite négocier.",
 req.params.id
 );

 res.json({ success: true });
});

router.post("/:id/counter-response", auth, (req, res) => {
 const { response } = req.body;

 if (!["accepted", "declined"].includes(response)) {
 return res.status(400).json({ error: "Réponse invalide" });
 }

 const exchange = db
 .prepare("SELECT * FROM exchanges WHERE id = ?")
 .get(req.params.id);

 if (!exchange) {
 return res.status(404).json({ error: "Échange introuvable" });
 }

 if (response === "accepted") {
 db.prepare(
 `UPDATE exchanges
 SET offered_item_ids = counter_item_ids,
 counter_status = 'accepted',
 status = 'accepted',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(req.params.id);

 const counterIds = parseIds(exchange.counter_item_ids);
 const allIds = [...counterIds, exchange.requested_item_id];

 if (allIds.length) {
 const placeholders = allIds.map(() => "?").join(",");
 db.prepare(
 `UPDATE items SET status = 'exchanged'
 WHERE id IN (${placeholders})`
 ).run(...allIds);
 }

 return res.json({ success: true });
 }

 db.prepare(
 `UPDATE exchanges
 SET counter_status = 'declined',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(req.params.id);

 res.json({ success: true });
});

router.post("/:id/availability", auth, (req, res) => {
 const { slots } = req.body;

 if (!Array.isArray(slots) || slots.length === 0) {
 return res.status(400).json({ error: "Aucun créneau sélectionné" });
 }

 db.prepare(
 `UPDATE exchanges
 SET availability_proposals = ?,
 availability_status = 'pending',
 confirmed_slot = '',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(JSON.stringify(slots), req.params.id);

 res.json({ success: true });
});

router.post("/:id/availability/respond", auth, (req, res) => {
 const { response, selectedSlot, newSlots } = req.body;

 if (response === "accepted") {
 if (!selectedSlot) {
 return res.status(400).json({ error: "Aucun créneau choisi" });
 }

 db.prepare(
 `UPDATE exchanges
 SET confirmed_slot = ?,
 availability_status = 'confirmed',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(selectedSlot, req.params.id);

 return res.json({ success: true });
 }

 if (response === "counter") {
 if (!Array.isArray(newSlots) || newSlots.length === 0) {
 return res.status(400).json({ error: "Aucun créneau proposé" });
 }

 db.prepare(
 `UPDATE exchanges
 SET availability_proposals = ?,
 availability_status = 'pending',
 confirmed_slot = '',
 updated_at = CURRENT_TIMESTAMP
 WHERE id = ?`
 ).run(JSON.stringify(newSlots), req.params.id);

 return res.json({ success: true });
 }

 res.status(400).json({ error: "Réponse invalide" });
});

module.exports = router;