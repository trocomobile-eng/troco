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
 Électronique: " ",
 Vêtements: " ",
 Maison: " ",
 Musique: " ",
 Livres: " ",
 Sport: " ",
 Jeux: " ",
 Autre: " ",
};

const BASE_URL = "http://localhost:3001/api";

const request = async (url, method = "GET", body = null, token = null) => {
 const options = {
 method,
 headers: {
 Authorization: token ? `Bearer ${token}` : "",
 },
 };

 if (body instanceof FormData) {
 options.body = body;
 } else if (body) {
 options.headers["Content-Type"] = "application/json";
 options.body = JSON.stringify(body);
 }

 const res = await fetch(BASE_URL + url, options);
 const text = await res.text();

 let data;
 try {
 data = text ? JSON.parse(text) : {};
 } catch {
 console.error("Réponse non JSON reçue :", text);
 return { error: `Erreur serveur ${res.status}` };
 }

 if (!res.ok) return data?.error ? data : { error: "Erreur serveur" };

 return data;
};

export const api = {
 signup: (data) => request("/auth/signup", "POST", data),
 login: (data) => request("/auth/login", "POST", data),
 me: (token) => request("/auth/me", "GET", null, token),
 updateProfile: (data, token) =>
 request("/auth/profile", "PUT", data, token),
 uploadAvatar: (formData, token) =>
 request("/auth/avatar", "POST", formData, token),

 getItems: (category = "") =>
 request(`/items${category ? `?category=${category}` : ""}`),
 getItem: (id) => request(`/items/${id}`),
 getMyItems: (token) => request("/items/mine", "GET", null, token),
 getUserItems: (userId, token) =>
 request(`/items/user/${userId}`, "GET", null, token),
 getUserProfile: (userId, token) =>
 request(`/items/user/${userId}/profile`, "GET", null, token),
 createItem: (data, token) => request("/items", "POST", data, token),
 deleteItem: (id, token) =>
 request(`/items/${id}`, "DELETE", null, token),

 getExchanges: (token) => request("/exchanges", "GET", null, token),
 getExchange: (id, token) =>
 request(`/exchanges/${id}`, "GET", null, token),
 proposeExchange: (data, token) =>
 request("/exchanges", "POST", data, token),
 updateExchangeStatus: (id, status, token) =>
 request(`/exchanges/${id}/status`, "PATCH", { status }, token),
 sendCounterProposal: (exchangeId, data, token) =>
 request(`/exchanges/${exchangeId}/counter`, "POST", data, token),
 respondCounterProposal: (exchangeId, response, token) =>
 request(
 `/exchanges/${exchangeId}/counter-response`,
 "POST",
 { response },
 token
 ),

 sendAvailability: (id, slots, token) =>
 request(`/exchanges/${id}/availability`, "POST", { slots }, token),
 respondAvailability: (id, data, token) =>
 request(`/exchanges/${id}/availability/respond`, "POST", data, token),
};

export const imageUrl = (url) => {
 if (!url) return "";
 return url.startsWith("/uploads") ? `http://localhost:3001${url}` : url;
};