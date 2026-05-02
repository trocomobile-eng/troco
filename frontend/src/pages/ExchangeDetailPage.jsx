import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import BottomNav from "../components/BottomNav";

function ItemBlock({ title, items }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-4">
      <p className="text-xs uppercase font-bold text-slate-400 mb-3">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Aucun objet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#f4f1ec] flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Pas d’image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {item.title || "Sans titre"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {item.category || "Sans catégorie"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExchangeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [exchange, setExchange] = useState(null);
  const [requestedItem, setRequestedItem] = useState(null);
  const [offeredItems, setOfferedItems] = useState([]);
  const [counterItems, setCounterItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadExchange = async () => {
    setLoading(true);

    try {
      const exchangeSnap = await getDoc(doc(db, "exchanges", id));

      if (!exchangeSnap.exists()) {
        setExchange(null);
        return;
      }

      const ex = {
        id: exchangeSnap.id,
        ...exchangeSnap.data(),
      };

      setExchange(ex);

      if (ex.requestedItemId) {
        const requestedSnap = await getDoc(doc(db, "items", ex.requestedItemId));

        if (requestedSnap.exists()) {
          setRequestedItem({
            id: requestedSnap.id,
            ...requestedSnap.data(),
          });
        }
      }

      if (Array.isArray(ex.offeredItemIds) && ex.offeredItemIds.length > 0) {
        const q = query(
          collection(db, "items"),
          where("__name__", "in", ex.offeredItemIds.slice(0, 10))
        );

        const snapshot = await getDocs(q);

        setOfferedItems(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } else {
        setOfferedItems([]);
      }

      if (
        Array.isArray(ex.counterRequestedItemIds) &&
        ex.counterRequestedItemIds.length > 0
      ) {
        const q = query(
          collection(db, "items"),
          where("__name__", "in", ex.counterRequestedItemIds.slice(0, 10))
        );

        const snapshot = await getDocs(q);

        setCounterItems(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } else {
        setCounterItems([]);
      }
    } catch (error) {
      console.error("Erreur détail échange :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    loadExchange();
  }, [id, user, authLoading, navigate]);

  const updateStatus = async (status) => {
    if (!exchange) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      setExchange((current) => ({
        ...current,
        status,
      }));
    } catch (error) {
      console.error("Erreur mise à jour échange :", error);
    } finally {
      setSaving(false);
    }
  };

  const acceptCounter = async () => {
    if (!exchange) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "accepted",
        counterStatus: "accepted",
        offeredItemIds: exchange.counterRequestedItemIds || [],
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } catch (error) {
      console.error("Erreur acceptation négociation :", error);
    } finally {
      setSaving(false);
    }
  };

  const declineCounter = async () => {
    if (!exchange) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        counterStatus: "declined",
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } catch (error) {
      console.error("Erreur refus négociation :", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] p-5">
        Chargement...
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] p-5">
        <p>Échange introuvable.</p>
        <button className="btn-primary mt-4" onClick={() => navigate("/exchanges")}>
          Retour
        </button>
      </div>
    );
  }

  const isSender = exchange.senderId === user?.uid;
  const isReceiver = exchange.receiverId === user?.uid;
  const isPending = exchange.status === "pending";
  const hasCounterPending = exchange.counterStatus === "pending";
  const hasCounterDeclined = exchange.counterStatus === "declined";

  return (
    <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] pb-24">
      <div className="px-5 pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 mb-4"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900">
          Détail de l’échange
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Statut : {exchange.status}
        </p>
      </div>

      <div className="px-5 space-y-4">
        <ItemBlock
          title="Objet demandé"
          items={requestedItem ? [requestedItem] : []}
        />

        <ItemBlock
          title="Offre initiale"
          items={offeredItems}
        />

        {exchange.message && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-xs uppercase font-bold text-slate-400 mb-2">
              Message
            </p>
            <p className="text-sm text-slate-700">“{exchange.message}”</p>
          </div>
        )}

        {hasCounterPending && (
          <div className="bg-troco-green/5 border border-troco-green/30 rounded-3xl p-4 space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-troco-green mb-2">
                Négociation en cours
              </p>

              <p className="text-sm text-slate-600">
                {isSender
                  ? "L’autre personne préfère recevoir ces objets à la place."
                  : "Ta demande de négociation est en attente de réponse."}
              </p>
            </div>

            <ItemBlock
              title="Nouvelle demande"
              items={counterItems}
            />

            {exchange.counterMessage && (
              <div className="bg-white rounded-2xl p-3">
                <p className="text-sm text-slate-700">
                  “{exchange.counterMessage}”
                </p>
              </div>
            )}

            {isSender && (
              <div className="space-y-2">
                <button
                  className="btn-primary w-full"
                  disabled={saving}
                  onClick={acceptCounter}
                >
                  Accepter la négociation
                </button>

                <button
                  className="btn-secondary w-full"
                  disabled={saving}
                  onClick={declineCounter}
                >
                  Refuser la négociation
                </button>
              </div>
            )}

            {isReceiver && (
              <div className="bg-yellow-50 text-yellow-800 rounded-2xl p-3 text-sm font-semibold">
                En attente de réponse de l’autre utilisateur.
              </div>
            )}
          </div>
        )}

        {hasCounterDeclined && isReceiver && isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 space-y-3">
            <p className="font-bold text-yellow-800">
              Négociation refusée
            </p>

            <p className="text-sm text-yellow-800">
              L’autre personne n’a pas accepté ta négociation. Tu peux quand même
              accepter l’échange initial, ou annuler/refuser l’échange.
            </p>

            <button
              className="btn-primary w-full"
              disabled={saving}
              onClick={() => updateStatus("accepted")}
            >
              Accepter l’offre initiale
            </button>

            <button
              className="w-full rounded-xl py-3 font-semibold bg-red-50 text-red-600"
              disabled={saving}
              onClick={() => updateStatus("declined")}
            >
              Annuler / refuser l’échange
            </button>
          </div>
        )}

        {!hasCounterPending && !hasCounterDeclined && isReceiver && isPending && (
          <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
            <button
              className="btn-primary w-full"
              disabled={saving}
              onClick={() => updateStatus("accepted")}
            >
              Accepter l’échange
            </button>

            <button
              className="btn-secondary w-full"
              disabled={saving}
              onClick={() =>
                navigate(`/propose/${exchange.requestedItemId}?mode=counter&from=${exchange.id}`)
              }
            >
              Négocier
            </button>

            <button
              className="w-full rounded-xl py-3 font-semibold bg-red-50 text-red-600"
              disabled={saving}
              onClick={() => updateStatus("declined")}
            >
              Refuser
            </button>
          </div>
        )}

        {!hasCounterPending && isSender && isPending && (
          <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
            <p className="text-sm text-slate-500">
              En attente de réponse de l’autre utilisateur.
            </p>

            <button
              className="btn-secondary w-full"
              disabled={saving}
              onClick={() => updateStatus("cancelled")}
            >
              Annuler la proposition
            </button>
          </div>
        )}

        {exchange.status === "accepted" && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-4">
            <p className="font-bold text-green-800">
              Échange accepté
            </p>
            <p className="text-sm text-green-700 mt-1">
              Vous pouvez maintenant organiser le rendez-vous.
            </p>
          </div>
        )}

        {(exchange.status === "declined" || exchange.status === "cancelled") && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-4">
            <p className="font-bold text-red-700">
              Échange terminé
            </p>
            <p className="text-sm text-red-600 mt-1">
              Cette proposition n’est plus active.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}