import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const Item = ({ label, icon, path }) => {
    const active = pathname === path;

    return (
      <button
        onClick={() => navigate(path)}
        className="flex flex-col items-center flex-1 py-2"
      >
        <div
          className={`text-xl ${
            active ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {icon}
        </div>

        <span
          className={`text-[11px] font-semibold ${
            active ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-sm">
      <div className="max-w-lg mx-auto flex">

        <Item label="Explorer" icon="🔍" path="/feed" />

        <Item label="Messages" icon="💬" path="/exchanges" />

        <Item label="Publier" icon="➕" path="/add" />

        <Item label="Profil" icon="👤" path="/profile" />

      </div>
    </div>
  );
}