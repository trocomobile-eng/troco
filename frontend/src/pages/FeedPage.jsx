import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";
import { CATEGORIES } from "../api";

export default function FeedPage() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadItems() {
      const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

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
    <div className="min-h-screen bg-[#f7f5f1] pb-24">
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-extrabold text-slate-900">Découvrir</h1>
        <p className="text-sm text-slate-500 mt-1">
          Trouve un échange près de chez toi.
        </p>
      </div>

      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              category === "" ? "bg-troco-green text-white" : "bg-white border"
            }`}
          >
            Tout
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                category === cat ? "bg-troco-green text-white" : "bg-white border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
}