import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TopBar, LoadingSpinner, EmptyState, CategoryBadge } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";
import { CATEGORIES } from "../api";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [otherItems, setOtherItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
  });

  const isMine = item?.ownerId === user?.uid;
  const images = item?.images?.length ? item.images : item?.imageUrl ? [item.imageUrl] : [];

  const load = async () => {
    setLoading(true);

    try {
      const snap = await getDoc(doc(db, "items", id));

      if (!snap.exists()) {
        setItem(null);
        return;
      }

      const data = { id: snap.id, ...snap.data() };
      setItem(data);

      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
      });

      if (data.ownerId) {
        const q = query(
          collection(db, "items"),
          where("ownerId", "==", data.ownerId),
          where("status", "==", "active")
        );

        const snapshot = await getDocs(q);

        const items = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((i) => i.id !== data.id);

        setOtherItems(items);
      }
    } catch (error) {
      console.error("Erreur chargement objet :", error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveChanges = async () => {
    if (!isMine) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "items", id), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        updatedAt: serverTimestamp(),
      });

      setEditing(false);
      await load();
    } catch (error) {
      console.error("Erreur modification :", error);
      alert("Erreur lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isMine) return;

    setSaving(true);

    try {
      const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
      const imageRef = ref(storage, `items/${user.uid}/${Date.now()}-${cleanName}`);

      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);

      const nextImages = [...images, url];

      await updateDoc(doc(db, "items", id), {
        imageUrl: item.imageUrl || url,
        images: nextImages,
        updatedAt: serverTimestamp(),
      });

      await load();
    } catch (error) {
      console.error("Erreur ajout photo :", error);
      alert("Erreur lors de l’ajout de photo.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!isMine) return;
    if (!confirm("Supprimer cet objet ?")) return;

    setSaving(true);

    try {
      await deleteDoc(doc(db, "items", id));
      navigate("/profile");
    } catch (error) {
      console.error("Erreur suppression :", error);
      alert("Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!item) {
    return <EmptyState icon="📦" title="Objet introuvable" />;
  }

  return (
    <div className="page max-w-lg mx-auto min-h-screen bg-gradient-to-b from-sky-100 via-white to-emerald-50">
      <TopBar back={() => navigate(-1)} title={isMine ? "Mon objet" : "Objet"} />

      <div className="px-5 pb-24 space-y-5">
        <div className="rounded-[2rem] overflow-hidden bg-white/80 shadow-sm border border-white">
          {images.length > 0 ? (
            <div className="flex overflow-x-auto snap-x">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={item.title}
                  className="w-full h-72 object-cover flex-shrink-0 snap-center"
                />
              ))}
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              Pas d’image
            </div>
          )}
        </div>

        {isMine && (
          <div className="bg-white/90 rounded-3xl p-4 shadow-sm border border-white space-y-3">
            <p className="text-xs uppercase font-black text-slate-400">Gestion de mon objet</p>

            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary w-full" onClick={() => setEditing((v) => !v)}>
                {editing ? "Annuler" : "Modifier"}
              </button>

              <label className="btn-secondary w-full text-center cursor-pointer">
                Ajouter photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
              </label>
            </div>

            <button
              className="w-full rounded-xl py-3 font-semibold bg-red-50 text-red-600"
              onClick={deleteItem}
              disabled={saving}
            >
              Supprimer l’objet
            </button>
          </div>
        )}

        <div className="bg-white/90 rounded-3xl p-5 shadow-sm border border-white space-y-3">
          {editing ? (
            <>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Titre"
              />

              <textarea
                className="input resize-none"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
              />

              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">Catégorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <button className="btn-primary w-full" onClick={saveChanges} disabled={saving}>
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </>
          ) : (
            <>
              <CategoryBadge category={item.category} />

              <h1 className="text-xl font-black text-slate-900">
                {item.title || "Sans titre"}
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description || "Aucune description."}
              </p>

              <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-3 py-1.5">
                <span className="text-xs">📍</span>
                <p className="text-xs font-bold text-slate-600">
                  {item.locationArea || item.locationDetails || "Paris"}
                </p>
              </div>
            </>
          )}
        </div>

        {!isMine && (
          <>
            <div className="bg-white/90 rounded-3xl p-4 shadow-sm border border-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white flex items-center justify-center font-black">
                {item.ownerEmail?.[0]?.toUpperCase() || "U"}
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {item.ownerName || item.ownerEmail || "Utilisateur Troco"}
                </p>
                <p className="text-xs text-slate-500">Propriétaire de l’objet</p>
              </div>
            </div>

            <button onClick={() => navigate(`/propose/${item.id}`)} className="btn-primary w-full">
              Proposer un échange
            </button>
          </>
        )}

        {!isMine && otherItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-slate-500 uppercase">
              Autres objets de cet utilisateur
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {otherItems.slice(0, 4).map((i) => (
                <ItemCard key={i.id} item={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}