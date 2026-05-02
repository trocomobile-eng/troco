import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, imageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import {
 TopBar,
 LoadingSpinner,
 EmptyState,
 CategoryBadge,
 ItemPlaceholder,
} from "../components/UI";
import BottomNav from "../components/BottomNav";

export default function ProposeExchangePage() {
 const { itemId } = useParams();
 const navigate = useNavigate();
 const { token } = useAuth();
 const [searchParams] = useSearchParams();

 const mode = searchParams.get("mode");
 const fromExchangeId = searchParams.get("from");
 const isCounter = mode === "counter" && fromExchangeId;

 const [items, setItems] = useState([]);
 const [originalOfferedIds, setOriginalOfferedIds] = useState([]);
 const [selectedIds, setSelectedIds] = useState([]);
 const [message, setMessage] = useState(
 isCounter
 ? "Je suis intéressé, mais je préférerais cet objet / ces objets "
 : ""
 );
 const [loading, setLoading] = useState(true);
 const [sending, setSending] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 if (!token) {
 navigate("/login");
 return;
 }

 async function load() {
 setLoading(true);
 setError("");

 try {
 if (isCounter) {
 const exchange = await api.getExchange(fromExchangeId, token);
 if (exchange?.error) throw new Error(exchange.error);

 if (exchange.counter_status === "pending") {
 setError("Une négociation est déjà en attente de réponse.");
 setLoading(false);
 return;
 }

 const offeredIds = Array.isArray(exchange.offered_item_ids)
 ? exchange.offered_item_ids.map(Number)
 : [];

 setOriginalOfferedIds(offeredIds);

 const stock = await api.getUserItems(exchange.proposer_id, token);
 setItems(Array.isArray(stock) ? stock : []);
 } else {
 const myItems = await api.getMyItems(token);
 setItems(
 Array.isArray(myItems)
 ? myItems.filter((i) => i.status === "active")
 : []
 );
 }
 } catch (e) {
 setError(e.message || "Erreur de chargement");
 } finally {
 setLoading(false);
 }
 }

 load();
 }, [token, navigate, isCounter, fromExchangeId]);

 const toggleItem = (id) => {
 const numericId = Number(id);

 setSelectedIds((current) => {
 if (current.includes(numericId)) {
 return current.filter((x) => x !== numericId);
 }

 if (current.length >= 2) return current;

 return [...current, numericId];
 });
 };

 const submit = async () => {
 if (selectedIds.length === 0) {
 setError("Choisis au moins un objet.");
 return;
 }

 setSending(true);
 setError("");

 try {
 let res;

 if (isCounter) {
 res = await api.sendCounterProposal(
 fromExchangeId,
 {
 requested_item_ids: selectedIds,
 message,
 },
 token
 );
 } else {
 res = await api.proposeExchange(
 {
 offered_item_ids: selectedIds,
 requested_item_id: Number(itemId),
 message,
 },
 token
 );
 }

 if (res?.error) throw new Error(res.error);

 navigate("/exchanges", { replace: true });
 } catch (e) {
 setError(e.message || "Erreur lors de l’envoi.");
 } finally {
 setSending(false);
 }
 };

 return (
 <div className="page max-w-lg mx-auto">
 <TopBar
 title={isCounter ? "Négocier" : "Proposer"}
 back={() => navigate(-1)}
 />

 <div className="px-5 py-5 pb-36 space-y-5">
 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
 <p className="text-xs uppercase font-bold text-troco-green mb-2">
 {isCounter ? "Modification de l’échange" : "Nouvelle proposition"}
 </p>

 <h1 className="text-xl font-bold text-troco-dark">
 {isCounter
 ? "Quels objets veux-tu demander ?"
 : "Quels objets veux-tu proposer ?"}
 </h1>

 <p className="text-sm text-troco-muted mt-2 leading-relaxed">
 {isCounter
 ? "Sélectionne jusqu’à 2 objets dans la bibliothèque de l’autre personne."
 : "Sélectionne jusqu’à 2 objets de ta bibliothèque pour faire une proposition."}
 </p>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3">
 {error}
 </div>
 )}

 {loading ? (
 <LoadingSpinner />
 ) : items.length === 0 ? (
 <EmptyState
 icon=" "
 title="Aucun objet disponible"
 subtitle={
 isCounter
 ? "Cette personne n’a aucun autre objet actif."
 : "Publie d’abord un objet."
 }
 />
 ) : (
 <div className="grid grid-cols-2 gap-3">
 {items.map((item) => {
 const selected = selectedIds.includes(Number(item.id));
 const wasAlreadyOffered = originalOfferedIds.includes(
 Number(item.id)
 );
 const img = imageUrl(item.image_url);

 return (
 <button
 key={item.id}
 type="button"
 onClick={() => toggleItem(item.id)}
 className={`relative overflow-hidden rounded-[1.6rem] border text-left bg-white shadow-sm active:scale-[0.98] transition ${
 selected
 ? "border-troco-green ring-2 ring-troco-green/30"
 : "border-gray-100"
 }`}
 >
 <div className="h-36 bg-troco-sand overflow-hidden">
 {img ? (
 <img
 src={img}
 alt={item.title || "Objet"}
 className="w-full h-full object-cover"
 />
 ) : (
 <ItemPlaceholder className="w-full h-full" />
 )}
 </div>

 <div className="p-3 space-y-2">
 <div className="flex items-start justify-between gap-2">
 <p className="font-bold text-sm text-troco-dark leading-tight line-clamp-2">
 {item.title || "Sans titre"}
 </p>

 <span
 className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
 selected
 ? "bg-troco-green text-white"
 : "bg-gray-100 text-gray-300"
 }`}
 >
 {selected ? "✓" : ""}
 </span>
 </div>

 <CategoryBadge category={item.category} />
 </div>

 {wasAlreadyOffered && (
 <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 rounded-full px-2.5 py-1 text-[10px] font-bold">
 Offre actuelle
 </div>
 )}

 {selected && (
 <div className="absolute inset-0 bg-troco-green/5 pointer-events-none" />
 )}
 </button>
 );
 })}
 </div>
 )}

 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4">
 <label className="text-xs uppercase font-bold text-troco-muted">
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
 </div>

 <div className="fixed bottom-[76px] left-0 right-0 z-30">
 <div className="max-w-lg mx-auto px-5">
 <div className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-soft rounded-[2rem] p-3">
 <div className="flex items-center justify-between gap-3 mb-3">
 <div>
 <p className="text-xs text-troco-muted">Sélection</p>
 <p className="font-bold text-troco-dark text-sm">
 {selectedIds.length}/2 objet{selectedIds.length > 1 ? "s" : ""}
 </p>
 </div>

 {selectedIds.length > 0 && (
 <button
 className="text-xs text-troco-muted font-semibold"
 onClick={() => setSelectedIds([])}
 >
 Effacer
 </button>
 )}
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
 </div>
 </div>

 <BottomNav />
 </div>
 );
}