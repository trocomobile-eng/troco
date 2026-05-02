import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, imageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import { TopBar, LoadingSpinner, EmptyState } from "../components/UI";
import ItemCard from "../components/ItemCard";
import BottomNav from "../components/BottomNav";

export default function UserItemsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate("/login");
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const stock = await api.getUserItems(id, token);

        if (stock?.error) throw new Error(stock.error);

        setItems(Array.isArray(stock) ? stock : []);
      } catch (e) {
        setError(e.message || "Erreur de chargement");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, token, authLoading, navigate]);

  const firstItem = items[0];

  const profile = firstItem
    ? {
        username: firstItem.username || "Utilisateur",
        avatar_url: firstItem.owner_avatar_url || "",
        items_count: items.length,
      }
    : null;

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
                        src={imageUrl(profile.avatar_url)}
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