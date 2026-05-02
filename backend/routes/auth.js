const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const db = require("../db/init");
const { auth, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads"),
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url || "",
    bio: user.bio || "",
    preferred_categories: JSON.parse(user.preferred_categories || "[]"),
    blocked_categories: JSON.parse(user.blocked_categories || "[]"),
  };
}

router.post("/signup", (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare("INSERT INTO users (email, password, username) VALUES (?, ?, ?)")
      .run(email, hash, username);

    const user = {
      id: result.lastInsertRowid,
      username,
      email,
      avatar_url: "",
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (e) {
    if (e.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }

    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Identifiants incorrects" });
  }

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar_url: user.avatar_url || "",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: payload });
});

router.get("/me", auth, (req, res) => {
  const user = db
    .prepare(
      `SELECT id, email, username, avatar_url, bio, preferred_categories, blocked_categories
       FROM users
       WHERE id = ?`
    )
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }

  res.json(formatUser(user));
});

router.put("/profile", auth, (req, res) => {
  const { bio, preferred_categories, blocked_categories } = req.body;

  db.prepare(
    `UPDATE users
     SET bio = ?, preferred_categories = ?, blocked_categories = ?
     WHERE id = ?`
  ).run(
    bio || "",
    JSON.stringify(preferred_categories || []),
    JSON.stringify(blocked_categories || []),
    req.user.id
  );

  const user = db
    .prepare(
      `SELECT id, email, username, avatar_url, bio, preferred_categories, blocked_categories
       FROM users
       WHERE id = ?`
    )
    .get(req.user.id);

  res.json(formatUser(user));
});

router.post("/avatar", auth, upload.single("avatar"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Image manquante" });
  }

  const avatarUrl = `/uploads/${req.file.filename}`;

  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(
    avatarUrl,
    req.user.id
  );

  res.json({ success: true, avatar_url: avatarUrl });
});

module.exports = router;