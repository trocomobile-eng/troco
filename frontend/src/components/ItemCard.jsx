import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isMine = item.ownerId === user?.uid;
  const image = item.imageUrl || item.image_url;
  const location =
    item.locationArea || item.location_area || item.locationDetails || "Paris";

  return (
    <div
      onClick={() => navigate(`/items/${item.id}`)}
      className="group bg-white/90 backdrop-blur rounded-[1.9rem] overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-white cursor-pointer active:scale-[0.98] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.12)]"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-sky-50 to-emerald-50 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={item.title || "Objet"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Pas d’image
          </div>
        )}

        {!isMine && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/propose/${item.id}`);
            }}
            className="absolute right-2 bottom-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-black text-emerald-600 shadow-sm border border-emerald-100 active:scale-95"
          >
            Échanger
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="font-black text-[14px] text-slate-900 truncate">
          {item.title || "Sans titre"}
        </p>

        <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-100 px-2.5 py-1">
          <span className="text-[10px]">📍</span>
          <p className="text-[11px] font-bold text-slate-600 truncate">
            {location}
          </p>
        </div>

        {item.category && (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              {item.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}