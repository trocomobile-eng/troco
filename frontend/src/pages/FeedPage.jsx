import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";
import { CATEGORIES } from "../api";

const CATEGORY_ICONS = {
  Électronique: "⚡",
  Vêtements: "👕",
  Maison: "🏠",
  Musique: "🎸",
};

export default function FeedPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadItems() {
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

      setItems(list);
    }

    loadItems();
  }, [category, user]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100  to-emerald-50 pb-24">

      {/* HEADER COMPACT */}
     <div className="px-5 pt-5 pb-3">
     <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-white px-3 py-1.5 shadow-sm">
      <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
      TROCO
     </span>
     <span className="text-xs font-semibold text-slate-500">
      objets à échanger
     </span>
  </div>

  <h1 className="mt-3 text-1xl font-black tracking-tight text-slate-900 leading-tight">
    À échanger près de toi
  </h1>
</div>

      {/* CATÉGORIES */}
      <div className="px-5 mt-2">
        <div className="flex gap-2 overflow-x-auto pb-3">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              category === ""
                ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
                : "bg-white/80 text-slate-700 border border-sky-100"
            }`}
          >
            ✨ Tout
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                category === cat
                  ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white"
                  : "bg-white/80 text-slate-700 border border-sky-100"
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div className="px-4 mt-2 grid grid-cols-2 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}