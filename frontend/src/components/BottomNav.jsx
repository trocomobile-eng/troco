import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = [
    { label: "Explorer", icon: "⌂", path: "/feed" },
    { label: "Messages", icon: "◌", path: "/exchanges" },
    { label: "Publier", icon: "+", path: "/add" },
    { label: "Profil", icon: "◍", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-white shadow-lg rounded-2xl px-2 py-2 flex gap-1">
        {tabs.map((tab) => {
          const active = pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center min-w-[68px] px-2 py-1.5 rounded-xl text-[11px] font-bold transition ${
                active
                  ? "text-white bg-gradient-to-r from-sky-500 to-emerald-500"
                  : "text-slate-500"
              }`}
            >
              <span className="text-base leading-none mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}	