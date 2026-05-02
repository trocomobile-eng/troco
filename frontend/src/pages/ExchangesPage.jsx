import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import BottomNav from "../components/BottomNav";

export default function ExchangesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    async function loadExchanges() {
      setLoading(true);

      try {
        const q = query(
          collection(db, "exchanges"),
          where("participants", "array-contains", user.uid)
        );

        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExchanges(list);
      } catch (error) {
        console.error("Erreur échanges :", error);
      } finally {
        setLoading(false);
      }
    }

    loadExchanges();
  }, [user, authLoading, navigate]);

  return (
    <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] pb-24">
      <div className="px-5 pt-5 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Mes échanges
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tes propositions d’échange.
        </p>
      </div>

      <div className="px-5">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : exchanges.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">🔄</div>
            <p className="font-semibold text-slate-900">
              Aucun échange pour l’instant
            </p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Explore les objets et propose un échange.
            </p>
            <button
              className="btn-primary w-full"
              onClick={() => navigate("/feed")}
            >
              Explorer les objets
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exchanges.map((ex) => (
              <button
                key={ex.id}
                onClick={() => navigate(`/exchanges/${ex.id}`)}
                className="w-full text-left bg-white rounded-3xl shadow-sm p-4 active:scale-[0.98] transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Proposition d’échange
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {ex.requestedItemTitle || "Objet demandé"}
                    </p>
                  </div>

                  <span className="text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 px-3 py-1">
                    {ex.status || "pending"}
                  </span>
                </div>

                {ex.message && (
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    “{ex.message}”
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}