
const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db/init");
const { auth } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
destination: path.join(__dirname, "../../uploads"),
filename: (_, file, cb) =>
cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function formatItem(item) {
return {
...item,
wanted_categories: JSON.parse(item.wanted_categories || "[]"),
open_to_all: Boolean(item.open_to_all),
};
}

router.get("/", (req, res) => {
const { category, exclude_user } = req.query;

let query = `
SELECT items.*, users.username, users.id as owner_id, users.avatar_url as owner_avatar_url
FROM items
JOIN users ON items.user_id = users.id
WHERE items.status = 'active'
`;

const params = [];

if (category) {
query += " AND items.category = ?";
params.push(category);
}

if (exclude_user) {
query += " AND items.user_id != ?";
params.push(exclude_user);
}

query += " ORDER BY items.created_at DESC";

const items = db.prepare(query).all(...params);
res.json(items.map(formatItem));
});

router.get("/mine", auth, (req, res) => {
const items = db
.prepare("SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC")
.all(req.user.id);

res.json(items.map(formatItem));
});

router.get("/user/:userId/profile", auth, (req, res) => {
const user = db
.prepare(
`SELECT id, username, avatar_url, bio,
(
SELECT COUNT(*) FROM items
WHERE items.user_id = users.id AND items.status = 'active'
) as items_count
FROM users
WHERE id = ?`
)
.get(req.params.userId);

if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

res.json(user);
});

router.get("/user/:userId", auth, (req, res) => {
const items = db
.prepare(
`SELECT items.*, users.username, users.id as owner_id, users.avatar_url as owner_avatar_url
FROM items
JOIN users ON items.user_id = users.id
WHERE items.user_id = ? AND items.status = 'active'
ORDER BY items.created_at DESC`
)
.all(Number(req.params.userId));

res.json(items.map(formatItem));
});

router.get("/:id", (req, res) => {
const item = db
.prepare(
`SELECT items.*,
users.username,
users.id as owner_id,
users.bio as owner_bio,
users.avatar_url as owner_avatar_url,
(
SELECT COUNT(*)
FROM items i2
WHERE i2.user_id = users.id AND i2.status = 'active'
) as owner_items_count
FROM items
JOIN users ON items.user_id = users.id
WHERE items.id = ?`
)
.get(req.params.id);

if (!item) return res.status(404).json({ error: "Objet introuvable" });

res.json(formatItem(item));
});

router.post("/", auth, upload.single("image"), (req, res) => {
const {
title,
description,
category,
open_to_all,
wanted_categories,
image_url,
location_area,
location_details,
} = req.body;

if (!title || !description || !category || !location_area) {
return res.status(400).json({
error: "Titre, description, catégorie et arrondissement sont requis.",
});
}

if (location_area === "Autre" && !location_details?.trim()) {
return res.status(400).json({
error: "Merci de préciser la localisation si vous choisissez Autre.",
});
}

const imageUrl = req.file ? `/uploads/${req.file.filename}` : image_url || "";

const result = db
.prepare(
`INSERT INTO items
(user_id, title, description, category, image_url, open_to_all, wanted_categories, location_area, location_details)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
)
.run(
req.user.id,
title,
description,
category,
imageUrl,
open_to_all === "true" || open_to_all === true ? 1 : 0,
JSON.stringify(
typeof wanted_categories === "string"
? JSON.parse(wanted_categories)
: wanted_categories || []
),
location_area,
location_details || ""
);

res.json({ id: result.lastInsertRowid, success: true });
});

router.delete("/:id", auth, (req, res) => {
const item = db
.prepare("SELECT * FROM items WHERE id = ? AND user_id = ?")
.get(req.params.id, req.user.id);

if (!item) return res.status(403).json({ error: "Non autorisé" });

db.prepare("UPDATE items SET status = 'deleted' WHERE id = ?").run(
req.params.id
);

res.json({ success: true });
});

module.exports = router;