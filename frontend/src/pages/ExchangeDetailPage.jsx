import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import BottomNav from "../components/BottomNav";

function readableStatus(exchange) {
  if (exchange.status === "accepted") return "Échange accepté";
  if (exchange.status === "declined") return "Échange refusé";
  if (exchange.status === "cancelled") return "Échange annulé";
  if (exchange.counterStatus === "pending") return "Modification en attente";
  if (exchange.counterStatus === "declined") return "Modification refusée";
  return "En attente de réponse";
}

async function loadItemsByIds(ids = []) {
  const cleanIds = ids.filter(Boolean).map(String);

  const results = await Promise.all(
    cleanIds.map(async (itemId) => {
      const snap = await getDoc(doc(db, "items", itemId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    })
  );

  return results.filter(Boolean);
}

function ItemMini({ item }) {
  return (
    <div className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3">
      <div className="w-20 h-20 rounded-2xl bg-[#f4f1ec] overflow-hidden flex-shrink-0">
        {item?.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            Pas d’image
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate">
          {item?.title || "Sans titre"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {item?.category || "Sans catégorie"}
        </p>
      </div>
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
  const [error, setError] = useState("");

  const loadExchange = async () => {
    setLoading(true);
    setError("");

    try {
      const exchangeSnap = await getDoc(doc(db, "exchanges", id));

      if (!exchangeSnap.exists()) {
        setExchange(null);
        setError("Échange introuvable.");
        return;
      }

      const ex = { id: exchangeSnap.id, ...exchangeSnap.data() };
      setExchange(ex);

      if (ex.requestedItemId) {
        const requestedSnap = await getDoc(doc(db, "items", String(ex.requestedItemId)));
        setRequestedItem(
          requestedSnap.exists()
            ? { id: requestedSnap.id, ...requestedSnap.data() }
            : null
        );
      }

      setOfferedItems(await loadItemsByIds(ex.offeredItemIds || []));
      setCounterItems(await loadItemsByIds(ex.counterRequestedItemIds || []));
    } catch (e) {
      console.error("Erreur chargement échange :", e);
      setError(e.message || "Erreur lors du chargement de l’échange.");
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
  }, [id, user, authLoading]);

  const updateStatus = async (status) => {
    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } finally {
      setSaving(false);
    }
  };

  const acceptCounter = async () => {
    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        status: "accepted",
        counterStatus: "accepted",
        offeredItemIds: exchange.counterRequestedItemIds || [],
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } finally {
      setSaving(false);
    }
  };

  const declineCounter = async () => {
    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        counterStatus: "declined",
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } finally {
      setSaving(false);
    }
  };

  const acceptSlot = async (slot) => {
    setSaving(true);

    try {
      await updateDoc(doc(db, "exchanges", exchange.id), {
        availabilityStatus: "confirmed",
        confirmedSlot: slot,
        updatedAt: serverTimestamp(),
      });

      await loadExchange();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] p-5">
        Chargement de l’échange...
      </div>
    );
  }

  if (error || !exchange) {
    return (
      <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] p-5">
        <p className="text-red-600">{error || "Échange introuvable."}</p>
        <button className="btn-primary mt-4" onClick={() => navigate("/exchanges")}>
          Retour aux échanges
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
        <button onClick={() => navigate("/exchanges")} className="text-sm text-slate-500 mb-4">
          ← Mes échanges
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900">
          Détail de l’échange
        </h1>

        <div className="mt-3 bg-white rounded-3xl shadow-sm p-4">
          <p className="text-xs uppercase font-bold text-slate-400">Statut</p>
          <p className="font-bold text-slate-900 mt-1">{readableStatus(exchange)}</p>
          <p className="text-sm text-slate-500 mt-1">
            {isSender ? "Tu as proposé cet échange." : "On t’a proposé cet échange."}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          <p className="text-xs uppercase font-bold text-slate-400">
            Objet demandé
          </p>
          <ItemMini item={requestedItem} />
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
          <p className="text-xs uppercase font-bold text-slate-400">
            Offre initiale
          </p>

          {offeredItems.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun objet proposé.</p>
          ) : (
            offeredItems.map((item) => <ItemMini key={item.id} item={item} />)
          )}
        </div>

        {exchange.message && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-xs uppercase font-bold text-slate-400 mb-2">Message</p>
            <p className="text-sm text-slate-700">“{exchange.message}”</p>
          </div>
        )}

        {hasCounterPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 space-y-3">
            <p className="font-bold text-blue-800">Modification proposée</p>
            <p className="text-sm text-blue-700">
              {isSender
                ? "L’autre personne préfère recevoir ces objets à la place."
                : "Tu as demandé une modification. En attente de réponse."}
            </p>

            {counterItems.map((item) => <ItemMini key={item.id} item={item} />)}

            {isSender && (
              <>
                <button className="btn-primary w-full" disabled={saving} onClick={acceptCounter}>
                  Accepter la modification
                </button>

                <button className="btn-secondary w-full" disabled={saving} onClick={declineCounter}>
                  Refuser la modification
                </button>
              </>
            )}
          </div>
        )}

        {hasCounterDeclined && isReceiver && isPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 space-y-3">
            <p className="font-bold text-yellow-800">Modification refusée</p>
            <p className="text-sm text-yellow-800">
              L’autre personne n’a pas accepté ta modification. Tu peux quand même accepter l’offre initiale ou refuser.
            </p>

            <button className="btn-primary w-full" disabled={saving} onClick={() => updateStatus("accepted")}>
              Accepter quand même l’offre initiale
            </button>

            <button className="w-full rounded-xl py-3 font-semibold bg-red-50 text-red-600" disabled={saving} onClick={() => updateStatus("declined")}>
              Refuser l’échange
            </button>
          </div>
        )}

        {!hasCounterPending && !hasCounterDeclined && isReceiver && isPending && (
          <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
            <button className="btn-primary w-full" disabled={saving} onClick={() => updateStatus("accepted")}>
              Accepter l’échange
            </button>

            <button
              className="btn-secondary w-full"
              disabled={saving}
              onClick={() =>
                navigate(`/propose/${exchange.requestedItemId}?mode=counter&from=${exchange.id}`)
              }
            >
              Demander une modification
            </button>

            <button className="w-full rounded-xl py-3 font-semibold bg-red-50 text-red-600" disabled={saving} onClick={() => updateStatus("declined")}>
              Refuser
            </button>
          </div>
        )}

        {isSender && isPending && !hasCounterPending && (
          <div className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
            <p className="text-sm text-slate-500">
              En attente de réponse de l’autre personne.
            </p>
            <button className="btn-secondary w-full" disabled={saving} onClick={() => updateStatus("cancelled")}>
              Annuler ma proposition
            </button>
          </div>
        )}

        {exchange.status === "accepted" && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-4 space-y-4">
            <p className="font-bold text-green-800">Échange accepté</p>

            {!exchange.availabilityStatus && (
              <button className="btn-primary w-full" onClick={() => navigate(`/availability/${exchange.id}`)}>
                Proposer des disponibilités
              </button>
            )}

            {exchange.availabilityStatus === "pending" && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-800">Créneaux proposés :</p>

                {(exchange.availabilityProposals || []).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => acceptSlot(slot)}
                    className="w-full text-left bg-white border border-green-200 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            {exchange.availabilityStatus === "confirmed" && (
              <div className="bg-white rounded-2xl p-4">
                <p className="font-bold text-green-800">Rendez-vous confirmé</p>
                <p className="text-sm text-green-700">{exchange.confirmedSlot}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}