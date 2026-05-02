// ===== CONSTANTES =====

export const CATEGORIES = [
  "Électronique",
  "Vêtements",
  "Maison",
  "Musique",
  "Livres",
  "Sport",
  "Jeux",
  "Autre",
];

export const CATEGORY_MAP = {
  Électronique: "📱",
  Vêtements: "👕",
  Maison: "🏠",
  Musique: "🎸",
  Livres: "📚",
  Sport: "⚽",
  Jeux: "🎮",
  Autre: "📦",
};

// ===== BASE URL =====

const BASE_URL = "http://localhost:3001/api";

// ===== HELPER =====

const request = async (url, method = "GET", body = null, token = null) => {
  const res = await fetch(BASE_URL + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: body ? JSON.stringify(body) : null,
  });

  return res.json();
};

// ===== API =====

export const api = {
  // 🔐 AUTH
  signup: (data) => request("/auth/signup", "POST", data),
  login: (data) => request("/auth/login", "POST", data),
  getMe: (token) => request("/auth/me", "GET", null, token),
  updateProfile: (data, token) =>
    request("/auth/profile", "PUT", data, token),

  // 📦 ITEMS
  getItems: (category = "") =>
    request(`/items${category ? `?category=${category}` : ""}`),

  getMyItems: (token) => request("/items/mine", "GET", null, token),

  createItem: (data, token) =>
    request("/items", "POST", data, token),

  deleteItem: (id, token) =>
    request(`/items/${id}`, "DELETE", null, token),

  // 🔁 EXCHANGES
  getExchanges: (token) =>
    request("/exchanges", "GET", null, token),

  getExchange: (id, token) =>
    request(`/exchanges/${id}`, "GET", null, token),

  proposeExchange: (data, token) =>
    request("/exchanges", "POST", data, token),

  updateExchangeStatus: (id, status, token) =>
    request(`/exchanges/${id}/status`, "PATCH", { status }, token),

  sendMessage: (id, content, token) =>
    request(`/exchanges/${id}/messages`, "POST", { content }, token),
};