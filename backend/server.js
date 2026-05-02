const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Routes imports
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const exchangeRoutes = require("./routes/exchanges");

// Debug routes
console.log("AUTH:", typeof authRoutes);
console.log("ITEMS:", typeof itemRoutes);
console.log("EXCHANGES:", typeof exchangeRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/exchanges", exchangeRoutes);

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", app: "Troco" });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🔄 Troco API running on http://localhost:${PORT}\n`);
});