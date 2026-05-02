const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "troco_secret_dev";

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = header.replace("Bearer ", "");

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalide" });
  }
}

module.exports = { auth, JWT_SECRET };