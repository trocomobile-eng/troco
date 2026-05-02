import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, imageUrl } from "../api";
import { TopBar, LoadingSpinner, EmptyState, CategoryBadge } from "../components/UI";
import { useAuth } from "../context/AuthContext";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";

export default function ItemDetailPage() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { user, token } = useAuth();

 const [item, setItem] = useState(null);
 const [otherItems, setOtherItems] = useState([]);
 const [loading, setLoading] = useState(true);

 const isMine =
 Number(item?.owner_id || item?.user_id) === Number(user?.id);

 useEffect(() => {
 async function load() {
 try {
 const data = await api.getItem(id);
 setItem(data);

 // charger autres objets du même user
 if (data?.owner_id) {
 const stock = await api.getUserItems(data.owner_id, token);
 const filtered = (stock || []).filter(
 (i) => Number(i.id) !== Number(data.id)
 );
 setOtherItems(filtered);
 }
 } catch {
 setItem(null);
 } finally {
 setLoading(false);
 }
 }

 load();
 }, [id, token]);

 if (loading) return <LoadingSpinner />;

 if (!item) {
 return (
 <EmptyState icon=" " title="Objet introuvable" />
 );
 }

 return (
 <div className="page max-w-lg mx-auto">
 <TopBar back={() => navigate(-1)} />

 <div className="px-5 pb-24 space-y-5">
 {/* IMAGE */}
 <div className="rounded-3xl overflow-hidden bg-troco-sand shadow-soft">
 {item.image_url ? (
 <img
 src={imageUrl(item.image_url)}
 className="w-full h-72 object-cover"
 />
 ) : (
 <div className="h-72 flex items-center justify-center text-5xl">
 
 </div>
 )}
 </div>

 {/* INFOS */}
 <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100 space-y-3">
 <CategoryBadge category={item.category} />

 <h1 className="text-xl font-bold text-troco-dark">
 {item.title}
 </h1>

 <p className="text-sm text-troco-muted leading-relaxed">
 {item.description}
 </p>
 </div>

 {/* USER */}
 <div
 onClick={() => navigate(`/user/${item.owner_id}`)}
 className="bg-white rounded-3xl p-4 shadow-soft border border-gray-100 flex items-center gap-3 cursor-pointer active:scale-[0.98]"
 >
 <div className="w-12 h-12 rounded-2xl bg-troco-green text-white flex items-center justify-center font-bold">
 {item.username?.[0]?.toUpperCase() || "U"}
 </div>

 <div>
 <p className="font-semibold text-troco-dark">
 {item.username}
 </p>
 <p className="text-xs text-troco-muted">
 Voir son profil
 </p>
 </div>
 </div>

 {/* CTA */}
 {!isMine && (
 <button
 onClick={() => navigate(`/propose/${item.id}`)}
 className="btn-primary w-full"
 >
 Proposer un échange
 </button>
 )}

 {/* AUTRES OBJETS */}
 {otherItems.length > 0 && (
 <div className="space-y-3">
 <h2 className="text-sm font-bold text-troco-muted uppercase">
 Autres objets de cet utilisateur
 </h2>

 <div className="space-y-2">
 {otherItems.slice(0, 3).map((i) => (
 <ItemCard key={i.id} item={i} />
 ))}
 </div>
 </div>
 )}
 </div>

 <BottomNav />
 </div>
 );
}