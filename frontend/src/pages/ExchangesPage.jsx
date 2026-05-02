import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";
import TrocoPageHeader from "../components/TrocoPageHeader";

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    emoji: "⏳",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  accepted: {
    label: "Accepté",
    emoji: "✅",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  refused: {
    label: "Refusé",
    emoji: "❌",
    color: "bg-rose-50 text-rose-700 border-rose-100",
  },
  counter: {
    label: "Contre-proposition",
    emoji: "🔁",
    color: "bg-sky-50 text-sky-700 border-sky-100",
  },
};

export default function ExchangesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    async function loadExchanges() {
      try {
        const q = query(
          collection(db, "exchanges"),
          where("participants", "array-contains", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExchanges(list);
      } catch (error) {
        console.error("Erreur chargement échanges :", error);
      } finally {
        setLoading(false);
      }
    }

    loadExchanges();
  }, [user, authLoading, navigate]);

  const filteredExchanges =
    filter === "all"
      ? exchanges
      : exchanges.filter((exchange) => exchange.status === filter);

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.30),transparent_35%),linear-gradient(180deg,#eefcff,#f4fff8)]">
      <TrocoPageHeader
        title="Échanges"
        subtitle="Suis tes propositions, réponses et trocs en cours."
      />

      <div className="px-5">
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2rem] p-4 shadow-sm mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide font-black text-emerald-600">
                Tableau de bord
              </p>
              <h1 className="text-2xl font-black text-slate-900">
                Tes trocs
              </h1>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg">
              🔁
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat label="Total" value={exchanges.length} />
            <Stat
              label="En attente"
              value={exchanges.filter((e) => e.status === "pending").length}
            />
            <Stat
              label="Acceptés"
              value={exchanges.filter((e) => e.status === "accepted").length}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
            ✨ Tout
          </FilterButton>

          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          >
            ⏳ En attente
          </FilterButton>

          <FilterButton
            active={filter === "accepted"}
            onClick={() => setFilter("accepted")}
          >
            ✅ Acceptés
          </FilterButton>

          <FilterButton
            active={filter === "counter"}
            onClick={() => setFilter("counter")}
          >
            🔁 Modifiés
          </FilterButton>
        </div>

        {loading || authLoading ? (
          <div className="mt-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full border-4 border-sky-200 border-t-emerald-500 animate-spin" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Chargement des échanges...
            </p>
          </div>
        ) : filteredExchanges.length === 0 ? (
          <div className="mt-8 bg-white/70 border border-white rounded-[2rem] p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-black text-slate-900">
              Aucun échange pour l’instant
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Quand tu proposeras un troc ou qu’un utilisateur répondra, tout
              apparaîtra ici.
            </p>

            <button
              onClick={() => navigate("/feed")}
              className="mt-5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-black px-5 py-3 shadow-lg active:scale-[0.97] transition"
            >
              Explorer les objets
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExchanges.map((exchange) => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                userId={user.uid}
                onClick={() => navigate(`/exchanges/${exchange.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/80 border border-white p-3 text-center shadow-sm">
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-bold text-slate-400 uppercase">
        {label}
      </p>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition active:scale-[0.97] ${
        active
          ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white shadow-md"
          : "bg-white/80 text-slate-600 border border-white"
      }`}
    >
      {children}
    </button>
  );
}

function ExchangeCard({ exchange, userId, onClick }) {
  const status = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;

  const isSender =
    exchange.senderId === userId ||
    exchange.fromUserId === userId ||
    exchange.proposerId === userId;

  const title =
    exchange.itemTitle ||
    exchange.requestedItemTitle ||
    exchange.targetItemTitle ||
    "Objet proposé";

  const offeredTitle =
    exchange.offeredItemTitle ||
    exchange.myItemTitle ||
    exchange.proposedItemTitle ||
    "Objet en échange";

  const image =
    exchange.itemImageUrl ||
    exchange.requestedItemImageUrl ||
    exchange.targetItemImageUrl ||
    exchange.imageUrl ||
    "";

  const offeredImage =
    exchange.offeredItemImageUrl ||
    exchange.myItemImageUrl ||
    exchange.proposedItemImageUrl ||
    "";

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-[2rem] bg-white/75 backdrop-blur-xl border border-white/80 p-4 shadow-sm active:scale-[0.98] hover:shadow-xl hover:-translate-y-1 transition duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${status.color}`}
          >
            {status.emoji} {status.label}
          </span>

          <p className="mt-3 text-xs uppercase font-black tracking-wide text-slate-400">
            {isSender ? "Proposition envoyée" : "Proposition reçue"}
          </p>

          <h3 className="mt-1 text-lg font-black text-slate-900 leading-tight">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            contre{" "}
            <span className="font-bold text-emerald-700">{offeredTitle}</span>
          </p>
        </div>

        <div className="flex -space-x-3 shrink-0">
          <MiniImage src={image} emoji="🎁" />
          <MiniImage src={offeredImage} emoji="🔁" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-400">
          {exchange.createdAt?.toDate
            ? exchange.createdAt.toDate().toLocaleDateString("fr-FR")
            : "Date récente"}
        </p>

        <span className="text-sm font-black text-emerald-700 group-hover:translate-x-1 transition">
          Voir →
        </span>
      </div>
    </button>
  );
}

function MiniImage({ src, emoji }) {
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 border-2 border-white overflow-hidden flex items-center justify-center text-xl shadow-sm">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        emoji
      )}
    </div>
  );
}