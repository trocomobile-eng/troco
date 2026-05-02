import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { TopBar, CategorySelect } from "../components/UI";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

const ARRONDISSEMENTS = [
 "Paris 1", "Paris 2", "Paris 3", "Paris 4", "Paris 5",
 "Paris 6", "Paris 7", "Paris 8", "Paris 9", "Paris 10",
 "Paris 11", "Paris 12", "Paris 13", "Paris 14", "Paris 15",
 "Paris 16", "Paris 17", "Paris 18", "Paris 19", "Paris 20",
 "Autre",
];

export default function AddItemPage() {
 const navigate = useNavigate();
 const { token } = useAuth();

 const [form, setForm] = useState({
 title: "",
 description: "",
 category: "",
 image_url: "",
 open_to_all: true,
 wanted_categories: [],
 location_area: "",
 location_details: "",
 });

 const [imageFile, setImageFile] = useState(null);
 const [preview, setPreview] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const set = (key) => (value) => {
 setForm((current) => ({
 ...current,
 [key]: value?.target ? value.target.value : value,
 }));
 };

 const handleImage = (e) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setImageFile(file);
 setPreview(URL.createObjectURL(file));
 set("image_url")("");
 };

 const handleSubmit = async () => {
 if (!token) return setError("Vous devez être connecté.");

 if (!form.title || !form.description || !form.category || !form.location_area) {
 return setError("Titre, description, catégorie et arrondissement sont requis.");
 }

 if (form.location_area === "Autre" && !form.location_details.trim()) {
 return setError("Merci de préciser la localisation.");
 }

 setLoading(true);
 setError("");

 try {
 const fd = new FormData();
 fd.append("title", form.title);
 fd.append("description", form.description);
 fd.append("category", form.category);
 fd.append("open_to_all", String(form.open_to_all));
 fd.append("wanted_categories", JSON.stringify(form.wanted_categories));
 fd.append("location_area", form.location_area);
 fd.append("location_details", form.location_details);

 if (imageFile) fd.append("image", imageFile);
 else if (form.image_url) fd.append("image_url", form.image_url);

 const result = await api.createItem(fd, token);
 if (result?.error) throw new Error(result.error);

 navigate("/profile");
 } catch (e) {
 setError(e.message || "Erreur lors de la publication.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="page max-w-lg mx-auto">
 <TopBar title="Publier" back={() => navigate(-1)} />

 <div className="px-5 py-5 pb-28 space-y-4">
 <div>
 <h1 className="text-2xl font-black text-troco-dark">
 Nouvel objet
 </h1>
 <p className="text-sm text-troco-muted mt-1">
 Ajoute une photo, une description et ton arrondissement.
 </p>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
 {error}
 </div>
 )}

 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4">
 {preview ? (
 <div className="relative rounded-2xl overflow-hidden h-64 bg-troco-sand">
 <img
 src={preview}
 alt="preview"
 className="w-full h-full object-contain"
 />
 <button
 type="button"
 className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full text-sm"
 onClick={() => {
 setPreview("");
 setImageFile(null);
 }}
 >
 ✕
 </button>
 </div>
 ) : (
 <label className="flex flex-col items-center justify-center h-44 bg-troco-sand/50 border-2 border-dashed border-troco-sand rounded-2xl cursor-pointer active:scale-[0.98] transition">
 <span className="text-3xl mb-2"> </span>
 <span className="text-sm font-black text-troco-dark">
 Importer une photo
 </span>
 <span className="text-xs text-troco-muted mt-1">
 JPG, PNG — 5 Mo max
 </span>
 <input
 type="file"
 accept="image/*"
 className="hidden"
 onChange={handleImage}
 />
 </label>
 )}
 </div>

 <input
 className="input"
 placeholder="Titre de l’objet"
 value={form.title}
 onChange={set("title")}
 />

 <textarea
 className="input resize-none"
 rows={3}
 placeholder="Description : état, marque, détails..."
 value={form.description}
 onChange={set("description")}
 />

 <CategorySelect value={form.category} onChange={set("category")} />

 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4">
 <label className="block text-sm font-black text-troco-dark mb-2">
 Dans quel arrondissement ?
 </label>

 <select
 className="input"
 value={form.location_area}
 onChange={set("location_area")}
 >
 <option value="">Choisir un arrondissement</option>
 {ARRONDISSEMENTS.map((a) => (
 <option key={a} value={a}>
 {a}
 </option>
 ))}
 </select>

 {form.location_area === "Autre" && (
 <input
 className="input mt-3"
 placeholder="Précise la ville ou le quartier"
 value={form.location_details}
 onChange={set("location_details")}
 />
 )}
 </div>

 <button
 type="button"
 className="btn-primary w-full text-base"
 onClick={handleSubmit}
 disabled={loading}
 >
 {loading ? "Publication..." : "Publier mon objet"}
 </button>
 </div>

 <BottomNav />
 </div>
 );
}