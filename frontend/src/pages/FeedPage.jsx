import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { CATEGORIES } from "../api";

const CATEGORY_ICONS = {
  Électronique: "⚡",
  Vêtements: "👕",
  Maison: "🏠",
  Musique: "🎸",
  Livres: "📚",
  Sport: "🏀",
  Jeux: "🎲",
  Autre: "✨",
};

export default function FeedPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      setLoading(true);

      try {
        const snapshot = await getDocs(query(collection(db, "items")));

        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (user?.uid) {
          list = list.filter((item) => item.ownerId !== user.uid);
        }

        if (category) {
          list = list.filter((item) => item.category === category);
        }

        list.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

        setItems(list);
      } catch (error) {
        console.error("Erreur chargement objets :", error);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [category, user]);

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.30),transparent_35%),linear-gradient(180deg,#eefcff,#f4fff8)]">
      <TrocoPageHeader
        title="Échanger près de toi"
        subtitle="Découvre les objets disponibles autour de toi."
      />

      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto pb-4">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap border shadow-sm active:scale-95 transition ${
              category === ""
                ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-transparent"
                : "bg-white/80 text-slate-700 border-white"
            }`}
          >
            ✨ Tout
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-black whitespace-nowrap border shadow-sm active:scale-95 transition ${
                category === cat
                  ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-transparent"
                  : "bg-white/80 text-slate-700 border-white"
              }`}
            >
              {CATEGORY_ICONS[cat] || "✨"} {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/70 rounded-3xl overflow-hidden border border-white shadow-sm animate-pulse"
              >
                <div className="aspect-[4/3] bg-sky-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-sky-100 rounded-full" />
                  <div className="h-3 w-1/2 bg-emerald-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white/70 rounded-3xl p-8 text-center border border-white shadow-sm">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-black text-slate-900">Aucun objet trouvé</p>
            <p className="text-sm text-slate-500 mt-1">
              Essaie une autre catégorie.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}