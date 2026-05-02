import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
 LoadingSpinner,
 EmptyState,
 StatusBadge,
 TopBar,
} from "../components/UI";
import BottomNav from "../components/BottomNav";

function formatDate(date) {
 if (!date) return "";

 return new Date(date.replace(" ", "T") + "Z").toLocaleString("fr-FR", {
 timeZone: "Europe/Paris",
 day: "2-digit",
 month: "2-digit",
 hour: "2-digit",
 minute: "2-digit",
 });
}

export default function ExchangesPage() {
 const [exchanges, setExchanges] = useState([]);
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState("pending");

 const { user, token } = useAuth();
 const navigate = useNavigate();

 useEffect(() => {
 if (!token) return;

 const load = () => {
 api
 .getExchanges(token)
 .then((data) => setExchanges(Array.isArray(data) ? data : []))
 .finally(() => setLoading(false));
 };

 setLoading(true);
 load();

 const interval = setInterval(load, 4000);
 window.addEventListener("focus", load);

 return () => {
 clearInterval(interval);
 window.removeEventListener("focus", load);
 };
 }, [token]);

 const tabs = [
 { key: "pending", label: "En attente" },
 { key: "accepted", label: "Acceptés" },
 { key: "declined", label: "Refusés" },
 { key: "cancelled", label: "Annulés" },
 ];

 const counts = {
 pending: exchanges.filter((e) => e.status === "pending").length,
 accepted: exchanges.filter((e) => e.status === "accepted").length,
 declined: exchanges.filter((e) => e.status === "declined").length,
 cancelled: exchanges.filter((e) => e.status === "cancelled").length,
 };

 const filtered = exchanges.filter((ex) => ex.status === tab);

 const actionCount = exchanges.filter((ex) => {
 const isProposer = Number(ex.proposer_id) === Number(user?.id);
 const isReceiver = Number(ex.receiver_id) === Number(user?.id);

 return (
 (isReceiver && ex.status === "pending" && !ex.counter_status) ||
 (isProposer && ex.counter_status === "pending") ||
 (isReceiver && ex.counter_status === "declined" && ex.status === "pending")
 );
 }).length;

 if (loading) {
 return (
 <div className="page max-w-lg mx-auto">
 <TopBar title="Mes échanges" />
 <LoadingSpinner />
 <BottomNav />
 </div>
 );
 }

 return (
 <div className="page max-w-lg mx-auto">
 <TopBar title={`Mes échanges${actionCount ? ` (${actionCount})` : ""}`} />

 <div className="px-5 py-4 pb-28">
 <div className="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-5 px-5">
 {tabs.map((t) => (
 <button
 key={t.key}
 type="button"
 onClick={() => setTab(t.key)}
 className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
 tab === t.key
 ? "bg-troco-green text-white shadow-sm"
 : "bg-white text-troco-dark border border-troco-sand"
 }`}
 >
 {t.label} ({counts[t.key]})
 </button>
 ))}
 </div>

 {filtered.length === 0 ? (
 <EmptyState
 icon=" "
 title="Aucun échange ici"
 subtitle="Change d’onglet ou explore les objets disponibles."
 action={
 <button className="btn-primary" onClick={() => navigate("/feed")}>
 Explorer les objets
 </button>
 }
 />
 ) : (
 <div className="space-y-3">
 {filtered.map((ex) => {
 const isProposer = Number(ex.proposer_id) === Number(user?.id);
 const isReceiver = Number(ex.receiver_id) === Number(user?.id);

 const otherUser = isProposer ? ex.receiver_name : ex.proposer_name;
 const hasCounter = ex.counter_status === "pending";
 const hasDeclinedCounter = ex.counter_status === "declined";

 const isActionRequired =
 (isReceiver && ex.status === "pending" && !ex.counter_status) ||
 (isProposer && hasCounter) ||
 (isReceiver && hasDeclinedCounter && ex.status === "pending");

 let title = ex.requested_item_title || "Échange";
 let subtitle = isProposer
 ? `Envoyé à ${otherUser || "Utilisateur"}`
 : `Reçu de ${otherUser || "Utilisateur"}`;
 let badge = "";

 if (hasCounter && isProposer) {
 title = `${otherUser || "L’autre personne"} souhaite négocier`;
 subtitle = "Réponse attendue de votre part";
 badge = "Action requise";
 }

 if (hasCounter && isReceiver) {
 title = "Négociation envoyée";
 subtitle = `En attente de réponse de ${otherUser || "l’autre personne"}`;
 badge = "En attente";
 }

 if (hasDeclinedCounter && isReceiver) {
 title = "Négociation refusée";
 subtitle = "Acceptez l’offre initiale ou refusez l’échange";
 badge = "Action requise";
 }

 if (hasDeclinedCounter && isProposer) {
 title = "Négociation refusée";
 subtitle = "Vous avez refusé la négociation";
 badge = "Refusée";
 }

 return (
 <div
 key={ex.id}
 role="button"
 tabIndex={0}
 onClick={() => navigate(`/exchanges/${ex.id}`)}
 className={`cursor-pointer rounded-[1.75rem] border p-4 transition active:scale-[0.98] shadow-sm ${
 isActionRequired
 ? "bg-troco-green/5 border-troco-green/40"
 : "bg-white border-gray-100"
 }`}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1">
 {isActionRequired && (
 <span className="w-2 h-2 rounded-full bg-red-500" />
 )}

 <p className="font-bold text-troco-dark text-sm truncate">
 {title}
 </p>
 </div>

 <p className="text-xs text-troco-muted">{subtitle}</p>

 <p className="text-xs text-troco-muted mt-1">
 {formatDate(ex.updated_at || ex.created_at)}
 </p>
 </div>

 <StatusBadge status={ex.status} />
 </div>

 {hasCounter && Array.isArray(ex.counterItems) && ex.counterItems.length > 0 && (
 <div className="mt-3 bg-troco-sand/60 rounded-2xl p-3">
 <p className="text-[11px] uppercase font-bold text-troco-muted mb-2">
 Objets demandés
 </p>

 <div className="flex flex-wrap gap-2">
 {ex.counterItems.map((item) => (
 <span
 key={item.id}
 className="bg-white rounded-full px-3 py-1 text-xs font-semibold text-troco-dark border border-gray-100"
 >
 {item.title}
 </span>
 ))}
 </div>
 </div>
 )}

 {badge && (
 <span
 className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${
 isActionRequired
 ? "bg-red-100 text-red-700"
 : "bg-yellow-100 text-yellow-800"
 }`}
 >
 {badge}
 </span>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 <BottomNav />
 </div>
 );
}