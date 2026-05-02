import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

function formatDate(date) {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);

  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusUI(exchange) {
  if (exchange.status === "accepted") {
    return { label: "Accepté", color: "bg-green-100 text-green-700" };
  }

  if (exchange.status === "declined") {
    return { label: "Refusé", color: "bg-red-100 text-red-700" };
  }

  if (exchange.status === "cancelled") {
    return { label: "Annulé", color: "bg-red-100 text-red-700" };
  }

  if (exchange.counterStatus === "pending") {
    return { label: "Négociation", color: "bg-blue-100 text-blue-700" };
  }

  if (exchange.counterStatus === "declined") {
    return {
      label: "Modification refusée",
      color: "bg-yellow-100 text-yellow-700",
    };
  }

  return { label: "En attente", color: "bg-yellow-100 text-yellow-700" };
}

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

        list.sort((a, b) => {
          const dateA =
            a.updatedAt?.toDate?.() ||
            a.createdAt?.toDate?.() ||
            new Date(0);

          const dateB =
            b.updatedAt?.toDate?.() ||
            b.createdAt?.toDate?.() ||
            new Date(0);

          return dateB - dateA;
        });

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
          Suis l’évolution de tes propositions.
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
              Explorer
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exchanges.map((ex) => {
              const isSender = ex.senderId === user.uid;
              const status = statusUI(ex);

              return (
                <button
                  key={ex.id}
                  onClick={() => navigate(`/exchanges/${ex.id}`)}
                  className="w-full text-left bg-white rounded-3xl shadow-sm p-4 active:scale-[0.98] transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        {isSender
                          ? "Tu as proposé un échange"
                          : "On t’a proposé un échange"}
                      </p>

                      <p className="text-sm text-slate-500 mt-1 truncate">
                        {ex.requestedItemTitle || "Objet demandé"}
                      </p>

                      {ex.counterStatus === "pending" && (
                        <p className="text-xs text-blue-600 mt-1 font-semibold">
                          Modification en cours
                        </p>
                      )}

                      {ex.counterStatus === "declined" && (
                        <p className="text-xs text-yellow-700 mt-1 font-semibold">
                          L’autre personne a refusé la modification
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-2">
                        Dernière activité :{" "}
                        {formatDate(ex.updatedAt || ex.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}