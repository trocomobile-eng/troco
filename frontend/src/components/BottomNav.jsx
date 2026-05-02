import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

const links = [
 { to: "/feed", label: "Accueil", icon: " " },
 { to: "/exchanges", label: "Échanges", icon: " " },
 { to: "/add", label: "Publier", icon: "+" },
 { to: "/profile", label: "Profil", icon: " " },
];

export default function BottomNav() {
 const { user, token } = useAuth();
 const [actionCount, setActionCount] = useState(0);

 useEffect(() => {
 if (!token || !user?.id) return;

 const loadNotifications = async () => {
 const data = await api.getExchanges(token);
 if (!Array.isArray(data)) return;

 const count = data.filter((ex) => {
 const isProposer = Number(ex.proposer_id) === Number(user.id);
 const isReceiver = Number(ex.receiver_id) === Number(user.id);

 const newExchangeToAnswer =
 isReceiver && ex.status === "pending" && !ex.counter_status;

 const counterToAnswer =
 isProposer && ex.counter_status === "pending";

 const declinedCounterToAnswer =
 isReceiver && ex.counter_status === "declined" && ex.status === "pending";

 return newExchangeToAnswer || counterToAnswer || declinedCounterToAnswer;
 }).length;

 setActionCount(count);
 };

 loadNotifications();
 const interval = setInterval(loadNotifications, 4000);

 return () => clearInterval(interval);
 }, [token, user?.id]);

 return (
 <div className="fixed bottom-0 left-0 right-0 z-40">
 <div className="max-w-lg mx-auto bg-white/95 backdrop-blur-xl border-t border-troco-sand rounded-t-3xl shadow-soft px-5 py-3">
 <div className="flex items-center justify-between">
 {links.map((link) => (
 <NavLink
 key={link.to}
 to={link.to}
 className={({ isActive }) =>
 `relative flex flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
 isActive ? "text-troco-cyan" : "text-slate-500"
 }`
 }
 >
 {link.label === "Publier" ? (
 <div className="w-12 h-12 -mt-7 rounded-full bg-troco-gradient text-white flex items-center justify-center text-3xl shadow-glow border-4 border-white active:scale-95 transition">
 +
 </div>
 ) : (
 <div className="relative">
 <span className="text-base">{link.icon}</span>

 {link.to === "/exchanges" && actionCount > 0 && (
 <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
 {actionCount}
 </span>
 )}
 </div>
 )}

 <span>{link.label}</span>
 </NavLink>
 ))}
 </div>
 </div>
 </div>
 );
}