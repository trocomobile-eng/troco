

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "troco.db"));

db.exec(`
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT UNIQUE NOT NULL,
password TEXT NOT NULL,
username TEXT NOT NULL,
avatar_url TEXT DEFAULT '',
bio TEXT DEFAULT '',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
title TEXT NOT NULL,
description TEXT NOT NULL,
category TEXT NOT NULL,
image_url TEXT DEFAULT '',
status TEXT DEFAULT 'active',
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exchanges (
id INTEGER PRIMARY KEY AUTOINCREMENT,
proposer_id INTEGER NOT NULL,
receiver_id INTEGER NOT NULL,
offered_item_ids TEXT NOT NULL,
requested_item_id INTEGER NOT NULL,
message TEXT DEFAULT '',
status TEXT DEFAULT 'pending',

/* 🔥 RENDEZ-VOUS */
availability_proposals TEXT DEFAULT '[]',
availability_status TEXT DEFAULT '',
confirmed_slot TEXT DEFAULT '',

created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;