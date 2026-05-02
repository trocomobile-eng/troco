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

const STATUS = {
  pending: {
    label: "En attente",
    emoji: "⏳",
    style: "bg-amber-50 text-amber-700 border-amber-100",
  },
  accepted: {
    label: "Accepté",
    emoji: "✅",
    style: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  declined: {
    label: "Refusé",
    emoji: "❌",
    style: "bg-rose-50 text-rose-700 border-rose-100",
  },
  cancelled: {
    label: "Annulé",
    emoji: "🚫",
    style: "bg-slate-50 text-slate-600 border-slate-100",
  },
};

function getStatus(exchange) {
  if (exchange.counterStatus === "pending") {
    return {
      label: "Modification en attente",
      emoji: "🔁",
      style: "bg-sky-50 text-sky-700 border-sky-100",
    };
  }

  if (exchange.counterStatus === "declined") {
    return {
      label: "Modification refusée",
      emoji: "↩️",
      style: "bg-orange-50 text-orange-700 border-orange-100",
    };
  }

  return STATUS[exchange.status] || STATUS.pending;
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

function ItemCardMini({ item, label }) {
  return (
    <div className="rounded-[1.7rem] bg-white/80 border border-white shadow-sm p-3">
      {label && (
        <p className="text-[11px] uppercase font-black tracking-wide text-emerald-600 mb-2">
          {label}
        </p>
      )}

      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 overflow-hidden flex-shrink-0 border border-white">
          {item?.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">
              📦
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 truncate">
            {item?.title || "Objet introuvable"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {item?.category || "Sans catégorie"}
          </p>

          {item?.arrondissement && (
            <p className="text-xs font-bold text-emerald-700 mt-2">
              📍 {item.arrondissement}
            </p>
          )}
        </div>
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
        setError("Échange introuvable.");
        return;
      }

      const ex = { id: exchangeSnap.id, ...exchangeSnap.data() };
      setExchange(ex);

      if (ex.requestedItemId) {
        const requestedSnap = await getDoc(
          doc(db, "items", String(ex.requestedItemId))
        );

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
      setError(e.message || "Erreur lors du chargement.");
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

      await loadExchange();
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
    } finally {
      setSaving(false);
    }
  };

  const acceptSlot = async (slot) => {
    if (!exchange) return;

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

  if (loading || authLoading) {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gradient-to-b from-sky-100 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full border-4 border-sky-200 border-t-emerald-500 animate-spin" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Chargement de l’échange...
          </p>
        </div>
      </div>
    );
  }

  if (error || !exchange) {
    return (
      <div className="max-w-lg mx-auto min-h-screen bg-gradient-to-b from-sky-100 to-emerald-50 p-5">
        <button
          onClick={() => navigate("/exchanges")}
          className="text-sm font-bold text-slate-500"
        >
          ← Retour
        </button>

        <div className="mt-8 bg-white/80 rounded-[2rem] p-7 text-center shadow-sm">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-black text-slate-900">
            Impossible de charger cet échange
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {error || "Échange introuvable."}
          </p>
        </div>
      </div>
    );
  }

  const status = getStatus(exchange);

  const isSender = exchange.senderId === user?.uid;
  const isReceiver = exchange.receiverId === user?.uid;
  const isPending = exchange.status === "pending";
  const hasCounterPending = exchange.counterStatus === "pending";
  const hasCounterDeclined = exchange.counterStatus === "declined";

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.30),transparent_35%),linear-gradient(180deg,#eefcff,#f4fff8)]">
      <div className="px-5 pt-5 pb-4">
        <button
          onClick={() => navigate("/exchanges")}
          className="mb-4 text-sm font-bold text-slate-500"
        >
          ← Mes échanges
        </button>

        <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/80 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide font-black text-emerald-600">
                Détail du troc
              </p>

              <h1 className="text-3xl font-black text-slate-900 leading-tight mt-1">
                {isSender ? "Ta proposition" : "Proposition reçue"}
              </h1>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg">
              🔁
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black mt-5 ${status.style}`}
          >
            <span>{status.emoji}</span>
            <span>{status.label}</span>
          </div>

          <p className="text-sm text-slate-500 mt-4 leading-relaxed">
            {isSender
              ? "Tu as proposé ce troc. Tu peux suivre ici la réponse de l’autre personne."
              : "Quelqu’un te propose un troc. Tu peux accepter, refuser ou demander une modification."}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <ItemCardMini item={requestedItem} label="Objet demandé" />

          <div className="rounded-[1.7rem] bg-white/70 border border-white shadow-sm p-3">
            <p className="text-[11px] uppercase font-black tracking-wide text-sky-600 mb-2">
              Offre proposée
            </p>

            {offeredItems.length === 0 ? (
              <p className="text-sm text-slate-500 p-2">
                Aucun objet proposé.
              </p>
            ) : (
              <div className="space-y-3">
                {offeredItems.map((item) => (
                  <ItemCardMini key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>

        {exchange.message && (
          <div className="rounded-[1.7rem] bg-white/75 border border-white p-4 shadow-sm">
            <p className="text-[11px] uppercase font-black tracking-wide text-slate-400 mb-2">
              Message
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              “{exchange.message}”
            </p>
          </div>
        )}

        {hasCounterPending && (
          <div className="rounded-[2rem] bg-sky-50/90 border border-sky-100 p-4 space-y-3 shadow-sm">
            <div>
              <p className="font-black text-sky-800">
                🔁 Modification proposée
              </p>
              <p className="text-sm text-sky-700 mt-1 leading-relaxed">
                {isSender
                  ? "L’autre personne préfère recevoir ces objets à la place."
                  : "Tu as demandé une modification. En attente de réponse."}
              </p>
            </div>

            {counterItems.map((item) => (
              <ItemCardMini key={item.id} item={item} />
            ))}

            {isSender && (
              <div className="space-y-2">
                <button
                  className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black py-3 shadow-lg active:scale-[0.97] transition"
                  disabled={saving}
                  onClick={acceptCounter}
                >
                  Accepter la modification
                </button>

                <button
                  className="w-full rounded-full bg-white/80 text-slate-700 font-black py-3 border border-sky-100 active:scale-[0.97] transition"
                  disabled={saving}
                  onClick={declineCounter}
                >
                  Refuser la modification
                </button>
              </div>
            )}
          </div>
        )}

        {hasCounterDeclined && isReceiver && isPending && (
          <div className="rounded-[2rem] bg-orange-50 border border-orange-100 p-4 space-y-3">
            <p className="font-black text-orange-800">
              Modification refusée
            </p>

            <p className="text-sm text-orange-700 leading-relaxed">
              L’autre personne n’a pas accepté ta modification. Tu peux quand
              même accepter l’offre initiale ou refuser.
            </p>

            <button
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black py-3 shadow-lg active:scale-[0.97] transition"
              disabled={saving}
              onClick={() => updateStatus("accepted")}
            >
              Accepter l’offre initiale
            </button>

            <button
              className="w-full rounded-full bg-rose-50 text-rose-600 font-black py-3 active:scale-[0.97] transition"
              disabled={saving}
              onClick={() => updateStatus("declined")}
            >
              Refuser l’échange
            </button>
          </div>
        )}

        {!hasCounterPending && !hasCounterDeclined && isReceiver && isPending && (
          <div className="rounded-[2rem] bg-white/75 border border-white p-4 space-y-3 shadow-sm">
            <button
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black py-3 shadow-lg active:scale-[0.97] transition"
              disabled={saving}
              onClick={() => updateStatus("accepted")}
            >
              Accepter le troc
            </button>

            <button
              className="w-full rounded-full bg-white text-slate-700 font-black py-3 border border-sky-100 active:scale-[0.97] transition"
              disabled={saving}
              onClick={() =>
                navigate(
                  `/propose/${exchange.requestedItemId}?mode=counter&from=${exchange.id}`
                )
              }
            >
              Demander une modification
            </button>

            <button
              className="w-full rounded-full bg-rose-50 text-rose-600 font-black py-3 active:scale-[0.97] transition"
              disabled={saving}
              onClick={() => updateStatus("declined")}
            >
              Refuser
            </button>
          </div>
        )}

        {isSender && isPending && !hasCounterPending && (
          <div className="rounded-[2rem] bg-white/75 border border-white p-4 space-y-3 shadow-sm">
            <p className="text-sm text-slate-500 leading-relaxed">
              En attente de réponse de l’autre personne.
            </p>

            <button
              className="w-full rounded-full bg-white text-slate-700 font-black py-3 border border-sky-100 active:scale-[0.97] transition"
              disabled={saving}
              onClick={() => updateStatus("cancelled")}
            >
              Annuler ma proposition
            </button>
          </div>
        )}

        {exchange.status === "accepted" && (
          <div className="rounded-[2rem] bg-emerald-50 border border-emerald-100 p-4 space-y-4 shadow-sm">
            <div>
              <p className="font-black text-emerald-800">
                ✅ Échange accepté
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                Il ne reste plus qu’à choisir un créneau.
              </p>
            </div>

            {!exchange.availabilityStatus && (
              <button
                className="w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black py-3 shadow-lg active:scale-[0.97] transition"
                onClick={() => navigate(`/availability/${exchange.id}`)}
              >
                Proposer des disponibilités
              </button>
            )}

            {exchange.availabilityStatus === "pending" && (
              <div className="space-y-3">
                <p className="text-sm font-black text-slate-800">
                  Créneaux proposés
                </p>

                {(exchange.availabilityProposals || []).map((slot) => (
                  <button
                    key={slot}
                    onClick={() => acceptSlot(slot)}
                    className="w-full text-left bg-white border border-emerald-100 rounded-2xl px-4 py-3 text-sm font-black text-emerald-800"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}

            {exchange.availabilityStatus === "confirmed" && (
              <div className="bg-white/80 rounded-2xl p-4">
                <p className="font-black text-emerald-800">
                  Rendez-vous confirmé
                </p>
                <p className="text-sm text-emerald-700">
                  {exchange.confirmedSlot}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}