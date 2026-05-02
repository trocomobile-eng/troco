import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import BottomNav from "../components/BottomNav";

export default function ProposeExchangePage() {
  const { itemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const mode = searchParams.get("mode");
  const fromExchangeId = searchParams.get("from");
  const isCounter = mode === "counter" && fromExchangeId;

  const [requestedItem, setRequestedItem] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState(
    isCounter ? "Je suis intéressé, mais je préférerais plutôt..." : ""
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (isCounter) {
          const exchangeSnap = await getDoc(doc(db, "exchanges", fromExchangeId));

          if (!exchangeSnap.exists()) {
            setError("Échange introuvable.");
            return;
          }

          const ex = {
            id: exchangeSnap.id,
            ...exchangeSnap.data(),
          };

          setExchange(ex);

          if (ex.counterStatus === "pending") {
            setError("Une négociation est déjà en attente de réponse.");
            return;
          }

          const requestedSnap = await getDoc(doc(db, "items", ex.requestedItemId));

          if (requestedSnap.exists()) {
            setRequestedItem({
              id: requestedSnap.id,
              ...requestedSnap.data(),
            });
          }

          const q = query(
            collection(db, "items"),
            where("ownerId", "==", ex.senderId),
            where("status", "==", "active")
          );

          const snapshot = await getDocs(q);

          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setItems(list);
        } else {
          const itemSnap = await getDoc(doc(db, "items", itemId));

          if (!itemSnap.exists()) {
            setError("Objet introuvable.");
            return;
          }

          const item = {
            id: itemSnap.id,
            ...itemSnap.data(),
          };

          setRequestedItem(item);

          const q = query(
            collection(db, "items"),
            where("ownerId", "==", user.uid),
            where("status", "==", "active")
          );

          const snapshot = await getDocs(q);

          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setItems(list);
        }
      } catch (e) {
        console.error(e);
        setError("Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [authLoading, user, navigate, itemId, isCounter, fromExchangeId]);

  const toggleItem = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((x) => x !== id);
      }

      if (current.length >= 2) return current;

      return [...current, id];
    });
  };

  const submit = async () => {
    if (!user) return setError("Vous devez être connecté.");
    if (selectedIds.length === 0) return setError("Choisis au moins un objet.");

    setSending(true);
    setError("");

    try {
      if (isCounter) {
        await updateDoc(doc(db, "exchanges", fromExchangeId), {
          counterStatus: "pending",
          counterRequestedItemIds: selectedIds,
          counterMessage: message.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        if (!requestedItem?.ownerId) {
          throw new Error("Impossible d’identifier le propriétaire de l’objet.");
        }

        await addDoc(collection(db, "exchanges"), {
          senderId: user.uid,
          receiverId: requestedItem.ownerId,
          participants: [user.uid, requestedItem.ownerId],

          requestedItemId: requestedItem.id,
          requestedItemTitle: requestedItem.title || "Objet demandé",

          offeredItemIds: selectedIds,

          status: "pending",
          message: message.trim(),

          counterStatus: null,
          counterRequestedItemIds: [],
          counterMessage: "",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      navigate("/exchanges", { replace: true });
    } catch (e) {
      console.error(e);
      setError(e.message || "Erreur lors de l’envoi.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] p-5">
        Chargement...
      </div>
    );
  }

  return (
    <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] pb-24">
      <div className="px-5 pt-5 pb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 mb-4">
          ← Retour
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900">
          {isCounter ? "Négocier" : "Proposer un échange"}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          {isCounter
            ? "Choisis jusqu’à 2 objets dans la bibliothèque de l’autre personne."
            : "Choisis jusqu’à 2 objets de ta bibliothèque."}
        </p>
      </div>

      <div className="px-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {requestedItem && (
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-xs uppercase font-bold text-slate-400 mb-2">
              Objet demandé
            </p>

            {requestedItem.imageUrl && (
              <img
                src={requestedItem.imageUrl}
                alt={requestedItem.title}
                className="w-full h-44 object-cover rounded-2xl mb-3"
              />
            )}

            <p className="font-bold text-slate-900">{requestedItem.title}</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-semibold text-slate-900">
              Aucun objet disponible
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Impossible de faire une proposition pour l’instant.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              const wasInitiallyOffered =
                exchange?.offeredItemIds?.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`relative overflow-hidden rounded-3xl bg-white shadow-sm border text-left ${
                    selected
                      ? "border-troco-green ring-2 ring-troco-green/30"
                      : "border-gray-100"
                  }`}
                >
                  <div className="h-36 bg-[#f4f1ec]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        Pas d’image
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="font-bold text-sm text-slate-900 line-clamp-2">
                      {item.title || "Sans titre"}
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      {item.category || "Sans catégorie"}
                    </p>
                  </div>

                  {wasInitiallyOffered && (
                    <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 rounded-full px-2 py-1 text-[10px] font-bold">
                      Offre initiale
                    </div>
                  )}

                  {selected && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-troco-green text-white flex items-center justify-center text-sm font-bold">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm p-4">
          <label className="text-xs uppercase font-bold text-slate-400">
            Message
          </label>

          <textarea
            className="input resize-none mt-2"
            rows={3}
            placeholder="Ajoute un message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          className="btn-primary w-full"
          disabled={sending || selectedIds.length === 0}
          onClick={submit}
        >
          {sending
            ? "Envoi..."
            : isCounter
            ? "Envoyer la négociation"
            : "Envoyer la proposition"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}