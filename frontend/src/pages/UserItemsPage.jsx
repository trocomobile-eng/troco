import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { TopBar, LoadingSpinner, EmptyState } from "../components/UI";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";

export default function UserItemsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const userRef = doc(db, "users", id);
        const userSnap = await getDoc(userRef);

        let userProfile = null;

        if (userSnap.exists()) {
          userProfile = {
            id: userSnap.id,
            ...userSnap.data(),
          };
        }

        const itemsQuery = query(
          collection(db, "items"),
          where("ownerId", "==", id)
        );

        const snapshot = await getDocs(itemsQuery);

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setItems(list);

        setProfile({
          username:
            userProfile?.username ||
            userProfile?.displayName ||
            list[0]?.username ||
            "Utilisateur",
          avatar_url:
            userProfile?.avatar_url ||
            userProfile?.avatarUrl ||
            userProfile?.photoURL ||
            list[0]?.owner_avatar_url ||
            "",
          items_count: list.length,
        });
      } catch (e) {
        console.error("Erreur profil utilisateur :", e);
        setError(e.message || "Erreur de chargement");
        setItems([]);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, user, authLoading, navigate]);

  return (
    <div className="page max-w-lg mx-auto">
      <TopBar title="Profil utilisateur" back={() => navigate(-1)} />

      <div className="px-5 py-5 space-y-5">
        {loading || authLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="Impossible de charger ce profil"
            subtitle={error}
          />
        ) : (
          <>
            {profile && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden bg-troco-green text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.username?.[0]?.toUpperCase() || "?"
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-xl font-bold text-troco-dark truncate">
                      {profile.username}
                    </h1>

                    <p className="text-sm text-troco-muted">
                      {profile.items_count} objet
                      {profile.items_count > 1 ? "s" : ""} actif
                      {profile.items_count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState
                icon="📦"
                title="Aucun objet"
                subtitle="Cet utilisateur n’a rien à proposer."
              />
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}