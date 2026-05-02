import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, CategorySelect } from "../components/UI";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ARRONDISSEMENTS = [
  "Paris 1", "Paris 2", "Paris 3", "Paris 4", "Paris 5",
  "Paris 6", "Paris 7", "Paris 8", "Paris 9", "Paris 10",
  "Paris 11", "Paris 12", "Paris 13", "Paris 14", "Paris 15",
  "Paris 16", "Paris 17", "Paris 18", "Paris 19", "Paris 20",
  "Autre",
];

export default function AddItemPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location_area: "",
    location_details: "",
  });

  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfileLocation() {
      if (authLoading) return;

      if (!user?.uid) {
        setProfileLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const arrondissement = snap.exists() ? snap.data().arrondissement || "" : "";

        setForm((current) => ({
          ...current,
          location_area: arrondissement,
        }));

        if (!arrondissement) {
          setShowLocationEdit(true);
        }
      } catch (error) {
        console.error("Erreur profil :", error);
        setShowLocationEdit(true);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfileLocation();
  }, [user, authLoading]);

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
  };

  const handleSubmit = async () => {
    setError("");

    if (authLoading || profileLoading) {
      return setError("Chargement du profil, réessaie dans une seconde.");
    }

    if (!user?.uid) {
      return setError("Vous devez être connecté pour publier un objet.");
    }

    if (!form.title || !form.description || !form.category || !form.location_area) {
      return setError("Titre, description, catégorie et localisation sont requis.");
    }

    if (form.location_area === "Autre" && !form.location_details.trim()) {
      return setError("Merci de préciser la localisation.");
    }

    setLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const cleanName = imageFile.name.replace(/\s+/g, "-").toLowerCase();
        const imageRef = ref(storage, `items/${user.uid}/${Date.now()}-${cleanName}`);

        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "items"), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        imageUrl,
        images: imageUrl ? [imageUrl] : [],
        ownerId: user.uid,
        ownerEmail: user.email || "",
        ownerName: user.displayName || "",
        locationArea: form.location_area,
        locationDetails: form.location_details.trim(),
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/profile");
    } catch (e) {
      console.error("Erreur publication :", e);
      setError(e.message || "Erreur lors de la publication.");
    } finally {
      setLoading(false);
    }
  };

  return (
       <div className="max-w-lg mx-auto min-h-screen pb-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.30),transparent_35%),linear-gradient(180deg,#eefcff,#f4fff8)]">

      <TopBar title="Publier" back={() => navigate(-1)} />

      <div className="px-5 py-5 pb-28 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Nouvel objet</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ajoute une photo, une description et publie depuis ton arrondissement.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-white/90 rounded-[2rem] border border-white shadow-sm p-4">
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden h-64 bg-sky-50">
              <img src={preview} alt="preview" className="w-full h-full object-contain" />
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
            <label className="flex flex-col items-center justify-center h-44 bg-sky-50 border-2 border-dashed border-sky-100 rounded-2xl cursor-pointer active:scale-[0.98] transition">
              <span className="text-3xl mb-2">📷</span>
              <span className="text-sm font-black text-slate-900">Importer une photo</span>
              <span className="text-xs text-slate-500 mt-1">JPG, PNG — 5 Mo max</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          )}
        </div>

        <input className="input" placeholder="Titre de l’objet" value={form.title} onChange={set("title")} />

        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Description : état, marque, détails..."
          value={form.description}
          onChange={set("description")}
        />

        <CategorySelect value={form.category} onChange={set("category")} />

        <div className="bg-white/90 rounded-[2rem] border border-white shadow-sm p-4">
          <p className="text-sm font-black text-slate-900">Localisation</p>

          {profileLoading ? (
            <p className="text-sm text-slate-500 mt-2">Chargement de ton arrondissement...</p>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-between gap-3 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
                <p className="text-sm font-bold text-slate-700">
                  📍 {form.location_area || "Aucune localisation définie"}
                  {form.location_details ? ` — ${form.location_details}` : ""}
                </p>

                <button
                  type="button"
                  className="text-xs font-black text-emerald-600"
                  onClick={() => setShowLocationEdit((v) => !v)}
                >
                  Modifier
                </button>
              </div>

              {showLocationEdit && (
                <div className="mt-3 space-y-3">
                  <select className="input" value={form.location_area} onChange={set("location_area")}>
                    <option value="">Choisir un arrondissement</option>
                    {ARRONDISSEMENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  {form.location_area === "Autre" && (
                    <input
                      className="input"
                      placeholder="Précise la ville ou le quartier"
                      value={form.location_details}
                      onChange={set("location_details")}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-primary w-full text-base"
          onClick={handleSubmit}
          disabled={loading || authLoading || profileLoading}
        >
          {loading ? "Publication..." : "Publier mon objet"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}