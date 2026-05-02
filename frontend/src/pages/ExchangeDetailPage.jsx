import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, imageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import {
 TopBar,
 LoadingSpinner,
 StatusBadge,
 CategoryBadge,
 ItemPlaceholder,
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

function parseSlots(value) {
 try {
 return JSON.parse(value || "[]");
 } catch {
 return [];
 }
}

function MiniItem({ item, label, faded = false }) {
 const navigate = useNavigate();
 const img = imageUrl(item?.image_url);

 return (
 <div
 onClick={() => item?.id && navigate(`/items/${item.id}`)}
 className={`flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm cursor-pointer active:scale-[0.98] ${
 faded ? "opacity-60" : ""
 }`}
 >
 <div className="w-16 h-16 rounded-xl overflow-hidden bg-troco-sand flex-shrink-0">
 {img ? (
 <img
 src={img}
 alt={item?.title || "Objet"}
 className="w-full h-full object-cover"
 />
 ) : (
 <ItemPlaceholder className="w-full h-full" />
 )}
 </div>

 <div className="min-w-0">
 {label && (
 <p className="text-[10px] uppercase font-bold text-troco-muted mb-1">
 {label}
 </p>
 )}

 <p className="font-black text-sm text-troco-dark truncate">
 {item?.title || "Objet"}
 </p>

 {item?.category && (
 <div className="mt-1">
 <CategoryBadge category={item.category} />
 </div>
 )}
 </div>
 </div>
 );
}

export default function ExchangeDetailPage() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user, token } = useAuth();

 const [exchange, setExchange] = useState(null);
 const [loading, setLoading] = useState(true);

 const load = () => {
 if (!token) return;

 setLoading(true);

 api.getExchange(id, token).then((data) => {
 setExchange(data);
 setLoading(false);
 });
 };

 useEffect(() => {
 load();
 }, [id, token]);

 if (loading) {
 return (
 <div className="page max-w-lg mx-auto">
 <TopBar back={() => navigate(-1)} title="Échange" />
 <LoadingSpinner />
 <BottomNav />
 </div>
 );
 }

 if (!exchange || exchange.error) {
 return (
 <div className="page max-w-lg mx-auto">
 <TopBar back={() => navigate(-1)} title="Échange" />
 <div className="px-5 py-6 text-sm text-red-500">
 Échange introuvable.
 </div>
 <BottomNav />
 </div>
 );
 }

 const isProposer = Number(exchange.proposer_id) === Number(user?.id);
 const isReceiver = Number(exchange.receiver_id) === Number(user?.id);

 const hasCounter = exchange.counter_status === "pending";
 const hasDeclined = exchange.counter_status === "declined";

 const otherUser = isProposer
 ? exchange.receiver_name
 : exchange.proposer_name;

 const requestedItem = {
 id: exchange.requested_item_id,
 title: exchange.requested_item_title,
 image_url: exchange.requested_item_image,
 category: exchange.requested_item_category,
 };

 const offeredItems = exchange.offeredItems || [];
 const counterItems = exchange.counterItems || [];
 const availabilitySlots = parseSlots(exchange.availability_proposals);

 const accept = async () => {
 await api.updateExchangeStatus(id, "accepted", token);
 load();
 };

 const decline = async () => {
 await api.updateExchangeStatus(id, "declined", token);
 navigate("/exchanges", { replace: true });
 };

 const cancel = async () => {
 await api.updateExchangeStatus(id, "cancelled", token);
 navigate("/exchanges", { replace: true });
 };

 const acceptCounter = async () => {
 await api.respondCounterProposal(id, "accepted", token);
 load();
 };

 const declineCounter = async () => {
 await api.respondCounterProposal(id, "declined", token);
 navigate("/exchanges", { replace: true });
 };

 const acceptSlot = async (slot) => {
 const res = await api.respondAvailability(
 exchange.id,
 {
 response: "accepted",
 selectedSlot: slot,
 },
 token
 );

 if (res?.error) return alert(res.error);
 load();
 };

 return (
 <div className="page max-w-lg mx-auto">
 <TopBar
 back={() => navigate(-1)}
 title="Échange"
 action={<StatusBadge status={exchange.status} />}
 />

 <div className="px-5 py-5 pb-28 space-y-5">
 <div className="bg-white rounded-[2rem] p-5 border border-gray-100 shadow-sm">
 <p className="text-xs text-troco-muted">
 {isProposer ? "Échange avec" : "Demande reçue de"}
 </p>

 <h2 className="font-black text-xl text-troco-dark mt-1">
 {otherUser || "Utilisateur"}
 </h2>

 <p className="text-xs text-troco-muted mt-1">
 {formatDate(exchange.updated_at || exchange.created_at)}
 </p>
 </div>

 {hasCounter && (
 <div className="bg-troco-green/5 border border-troco-green/40 rounded-[2rem] p-5 space-y-4 shadow-sm">
 <div>
 <p className="text-xs uppercase font-black text-troco-green mb-1">
 Négociation
 </p>

 <h3 className="text-lg font-black text-troco-dark leading-snug">
 {isProposer
 ? `${otherUser} souhaite négocier`
 : "Ta demande de négociation est envoyée"}
 </h3>

 <p className="text-sm text-troco-muted mt-2 leading-relaxed">
 {isProposer
 ? `${otherUser} souhaite recevoir les objets ci-dessous. Tu peux accepter cette nouvelle demande ou la refuser.`
 : `En attente de réponse de ${otherUser}.`}
 </p>
 </div>

 <div className="bg-white/70 rounded-3xl p-3 space-y-3">
 <p className="text-[11px] uppercase font-black text-troco-muted">
 Nouvelle demande
 </p>

 {counterItems.map((item) => (
 <MiniItem key={item.id} item={item} />
 ))}
 </div>

 {offeredItems.length > 0 && (
 <div className="bg-white/50 rounded-3xl p-3 space-y-3">
 <p className="text-[11px] uppercase font-black text-troco-muted">
 Offre initiale
 </p>

 {offeredItems.map((item) => (
 <MiniItem key={item.id} item={item} faded />
 ))}
 </div>
 )}

 {exchange.counter_message && (
 <p className="text-sm bg-white p-3 rounded-2xl text-troco-dark">
 “{exchange.counter_message}”
 </p>
 )}

 {isProposer ? (
 <div className="space-y-2">
 <button onClick={acceptCounter} className="btn-primary w-full">
 Accepter la nouvelle demande
 </button>

 <button
 onClick={declineCounter}
 className="btn-secondary w-full"
 >
 Refuser
 </button>
 </div>
 ) : (
 <div className="bg-yellow-50 text-yellow-800 rounded-2xl p-3 text-sm font-semibold">
 En attente de réponse
 </div>
 )}
 </div>
 )}

 {hasDeclined && !isProposer && (
 <div className="bg-yellow-50 border border-yellow-200 rounded-[2rem] p-5 space-y-3">
 <p className="font-black text-yellow-800">
 Négociation refusée
 </p>

 <p className="text-sm text-troco-muted">
 {otherUser} a refusé ta demande. Tu peux accepter l’offre
 initiale ou refuser l’échange.
 </p>

 <div className="space-y-2">
 <button onClick={accept} className="btn-primary w-full">
 Accepter l’offre initiale
 </button>

 <button onClick={decline} className="btn-secondary w-full">
 Refuser l’échange
 </button>
 </div>
 </div>
 )}

 <div className="space-y-3">
 <p className="text-xs uppercase font-black text-troco-muted">
 Objet demandé
 </p>

 <MiniItem item={requestedItem} />
 </div>

 <div className="space-y-3">
 <p className="text-xs uppercase font-black text-troco-muted">
 Objets proposés
 </p>

 {offeredItems.map((item) => (
 <MiniItem key={item.id} item={item} />
 ))}
 </div>

 {exchange.status === "accepted" && (
 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 space-y-4">
 <div>
 <p className="text-xs uppercase font-black text-troco-green mb-1">
 Rendez-vous
 </p>

 <h3 className="text-lg font-black text-slate-900">
 Organiser l’échange
 </h3>

 <p className="text-sm text-slate-500 mt-1">
 L’échange est accepté. Il reste à choisir un créneau.
 </p>
 </div>

 {!exchange.availability_status && (
 <button
 className="btn-primary w-full"
 onClick={() => navigate(`/availability/${exchange.id}`)}
 >
 Proposer des disponibilités
 </button>
 )}

 {exchange.availability_status === "pending" && (
 <div className="space-y-3">
 <p className="text-sm font-bold text-slate-800">
 Créneaux proposés :
 </p>

 {availabilitySlots.map((slot) => (
 <button
 key={slot}
 type="button"
 onClick={() => acceptSlot(slot)}
 className="w-full text-left bg-troco-sand/50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 active:scale-[0.98]"
 >
 {slot}
 </button>
 ))}

 <button
 className="btn-secondary w-full"
 onClick={() => navigate(`/availability/${exchange.id}`)}
 >
 Proposer d’autres créneaux
 </button>
 </div>
 )}

 {exchange.availability_status === "confirmed" && (
 <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
 <p className="font-black text-green-800">
 Rendez-vous confirmé
 </p>

 <p className="text-sm text-green-700 mt-1">
 {exchange.confirmed_slot}
 </p>
 </div>
 )}
 </div>
 )}

 {!hasCounter &&
 !hasDeclined &&
 exchange.status === "pending" && (
 <div className="space-y-2">
 {isReceiver && (
 <>
 <button onClick={accept} className="btn-primary w-full">
 Accepter
 </button>

 <button
 onClick={() =>
 navigate(
 `/propose/${exchange.requested_item_id}?mode=counter&from=${exchange.id}`
 )
 }
 className="btn-secondary w-full"
 >
 Négocier
 </button>

 <button onClick={decline} className="btn-secondary w-full">
 Refuser
 </button>
 </>
 )}

 {isProposer && (
 <button onClick={cancel} className="btn-secondary w-full">
 Annuler
 </button>
 )}
 </div>
 )}
 </div>

 <BottomNav />
 </div>
 );
}