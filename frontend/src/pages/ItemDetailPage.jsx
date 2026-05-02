import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { TopBar, LoadingSpinner, EmptyState, CategoryBadge } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";

export default function ItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [otherItems, setOtherItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMine = item?.ownerId === user?.uid;

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "items", id));

        if (!snap.exists()) {
          setItem(null);
          return;
        }

        const data = {
          id: snap.id,
          ...snap.data(),
        };

        setItem(data);

        if (data.ownerId) {
          const q = query(
            collection(db, "items"),
            where("ownerId", "==", data.ownerId),
            where("status", "==", "active")
          );

          const snapshot = await getDocs(q);

          const items = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((i) => i.id !== data.id);

          setOtherItems(items);
        }
      } catch (error) {
        console.error("Erreur chargement objet :", error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (!item) {
    return <EmptyState icon="📦" title="Objet introuvable" />;
  }

  return (
    <div className="page max-w-lg mx-auto">
      <TopBar back={() => navigate(-1)} />

      <div className="px-5 pb-24 space-y-5">
        <div className="rounded-3xl overflow-hidden bg-troco-sand shadow-soft">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-72 object-cover"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400">
              Pas d’image
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 space-y-3">
          <CategoryBadge category={item.category} />

          <h1 className="text-xl font-bold text-troco-dark">
            {item.title || "Sans titre"}
          </h1>

          <p className="text-sm text-troco-muted leading-relaxed">
            {item.description || "Aucune description."}
          </p>

          <p className="text-xs text-troco-muted">
            📍 {item.locationArea || item.locationDetails || "Paris"}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-soft border border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-troco-green text-white flex items-center justify-center font-bold">
            {item.ownerEmail?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <p className="font-semibold text-troco-dark">
              {item.ownerName || item.ownerEmail || "Utilisateur Troco"}
            </p>
            <p className="text-xs text-troco-muted">Propriétaire de l’objet</p>
          </div>
        </div>

        {!isMine && (
          <button
            onClick={() => navigate(`/propose/${item.id}`)}
            className="btn-primary w-full"
          >
            Proposer un échange
          </button>
        )}

        {otherItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-troco-muted uppercase">
              Autres objets de cet utilisateur
            </h2>

            <div className="space-y-2">
              {otherItems.slice(0, 3).map((i) => (
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