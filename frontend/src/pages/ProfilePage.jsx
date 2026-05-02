import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import BottomNav from "../components/BottomNav";

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(firebaseUser);

      try {
        const q = query(
          collection(db, "items"),
          where("ownerId", "==", firebaseUser.uid)
        );

        const snapshot = await getDocs(q);

        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMyItems(items);
      } catch (error) {
        console.error("Erreur chargement profil :", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="page max-w-lg mx-auto min-h-screen bg-[#f7f5f1] pb-24">
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mon profil</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tes objets publiés sur Troco.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 bg-white rounded-full px-4 py-2 shadow-sm"
        >
          Déconnexion
        </button>
      </div>

      <div className="px-5">
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-troco-green text-white flex items-center justify-center text-2xl font-bold mb-3">
            {user?.email?.[0]?.toUpperCase() || "?"}
          </div>

          <p className="font-semibold text-slate-900">
            {user?.displayName || "Utilisateur Troco"}
          </p>

          <p className="text-sm text-slate-500 truncate">{user?.email}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">
            Mes objets ({myItems.length})
          </h2>

          <button
            onClick={() => navigate("/add")}
            className="text-sm font-semibold text-troco-green"
          >
            + Ajouter
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : myItems.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-semibold text-slate-900">Aucun objet publié</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Publie ton premier objet pour commencer à échanger.
            </p>

            <button onClick={() => navigate("/add")} className="btn-primary w-full">
              Publier un objet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/items/${item.id}`)}
                className="bg-white rounded-3xl shadow-sm p-3 flex gap-3 cursor-pointer active:scale-[0.98] transition"
              >
                <div className="w-20 h-20 rounded-2xl bg-[#f4f1ec] overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Pas d’image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {item.title || "Sans titre"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {item.category || "Sans catégorie"}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 truncate">
                    {item.locationArea || item.locationDetails || "Paris"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}