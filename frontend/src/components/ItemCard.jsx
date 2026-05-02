import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isMine = item.ownerId === user?.uid;

  const imageSrc = item.imageUrl || item.image_url || null;

  const location =
    item.locationArea ||
    item.location_area ||
    item.locationDetails ||
    item.location_details ||
    "Paris";

  const goToItem = () => {
    navigate(`/items/${item.id}`);
  };

  return (
    <div
      onClick={goToItem}
      className="bg-white rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition cursor-pointer"
    >
      <div className="relative aspect-[4/3] bg-[#f4f1ec] overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Pas d’image
          </div>
        )}

        {!isMine && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/propose/${item.id}`);
            }}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold text-troco-green shadow"
          >
            Échanger
          </button>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-[15px] font-semibold text-slate-900 truncate">
          {item.title || "Sans titre"}
        </h3>

        <p className="text-[12px] text-slate-400 mt-1">
          {location}
        </p>
      </div>
    </div>
  );
}