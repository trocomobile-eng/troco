import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  CategoryBadge,
  CategorySelect,
  LoadingSpinner,
  EmptyState,
  TopBar,
  ItemPlaceholder,
} from "../components/UI";
import BottomNav from "../components/BottomNav";

const imageUrl = (url) => {
  if (!url) return "";
  return url.startsWith("/uploads") ? `http://localhost:3001${url}` : url;
};

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    preferred_categories: [],
    blocked_categories: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadProfile = () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);

    Promise.all([api.getMyItems(token), api.me(token)])
      .then(([items, me]) => {
        setMyItems(Array.isArray(items) ? items : []);
        setProfile(me);

        setForm({
          bio: me?.bio || "",
          preferred_categories: me?.preferred_categories || [],
          blocked_categories: me?.blocked_categories || [],
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, [token, navigate]);

  const activeItems = myItems.filter((i) => i.status === "active");

  const saveProfile = async () => {
    setSaving(true);
    const updated = await api.updateProfile(form, token);
    if (!updated?.error) setProfile(updated);
    setSaving(false);
    setEditing(false);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("avatar", file);

    setUploadingAvatar(true);
    const result = await api.uploadAvatar(fd, token);

    if (!result?.error) {
      setProfile((p) => ({
        ...p,
        avatar_url: result.avatar_url,
      }));
    }

    setUploadingAvatar(false);
  };

  const deleteItem = async (id) => {
    if (!confirm("Supprimer cet objet ?")) return;
    await api.deleteItem(id, token);
    setMyItems((items) => items.filter((i) => i.id !== id));
  };

  return (
    <div className="page max-w-lg mx-auto">
      <TopBar
        title="Mon profil"
        action={
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-troco-muted px-3 py-1"
          >
            Déconnexion
          </button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-5 py-5 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-4 mb-4">
              <label className="relative cursor-pointer">
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-troco-sand flex items-center justify-center shadow-sm">
                  {profile?.avatar_url ? (
                    <img
                      src={imageUrl(profile.avatar_url)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white bg-troco-green w-full h-full flex items-center justify-center text-3xl font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-1 -right-1 bg-troco-green text-white w-8 h-8 rounded-full flex items-center justify-center text-sm shadow">
                  {uploadingAvatar ? "…" : "📷"}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatar}
                />
              </label>

              <div className="min-w-0">
                <h2 className="font-display text-xl text-troco-dark truncate">
                  {profile?.username || user?.username}
                </h2>
                <p className="text-troco-muted text-sm truncate">
                  {profile?.email || user?.email}
                </p>
                <p className="text-xs text-troco-muted mt-1">
                  Appuie sur la photo pour la changer
                </p>
              </div>
            </div>

            {!editing ? (
              <>
                {profile?.bio ? (
                  <p className="text-sm text-troco-dark mb-3">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-troco-muted mb-3">
                    Ajoute une courte bio pour rassurer les autres utilisateurs.
                  </p>
                )}

                {profile?.preferred_categories?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-troco-muted mb-1">Préférences</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.preferred_categories.map((c) => (
                        <CategoryBadge key={c} category={c} />
                      ))}
                    </div>
                  </div>
                )}

                {profile?.blocked_categories?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-troco-muted mb-1">
                      Non souhaité
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {profile.blocked_categories.map((c) => (
                        <CategoryBadge key={c} category={c} />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="btn-secondary w-full mt-4 text-sm py-2"
                  onClick={() => setEditing(true)}
                >
                  ✏️ Modifier mon profil
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <textarea
                  className="input resize-none text-sm"
                  rows={2}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  placeholder="Quelques mots sur vous..."
                />

                <div>
                  <p className="text-xs text-troco-muted mb-2">
                    Catégories préférées
                  </p>
                  <CategorySelect
                    multiple
                    value={form.preferred_categories}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, preferred_categories: v }))
                    }
                  />
                </div>

                <div>
                  <p className="text-xs text-troco-muted mb-2">
                    Catégories non souhaitées
                  </p>
                  <CategorySelect
                    multiple
                    value={form.blocked_categories}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, blocked_categories: v }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    className="btn-primary flex-1 text-sm py-2"
                    onClick={saveProfile}
                    disabled={saving}
                  >
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                  <button
                    className="btn-secondary flex-1 text-sm py-2"
                    onClick={() => setEditing(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-troco-dark">
                Mes objets ({activeItems.length})
              </h3>

              <button
                className="text-troco-green text-sm font-medium"
                onClick={() => navigate("/add")}
              >
                + Ajouter
              </button>
            </div>

            {activeItems.length === 0 ? (
              <EmptyState
                icon="📦"
                title="Aucun objet publié"
                subtitle="Publiez votre premier objet !"
                action={
                  <button
                    className="btn-primary"
                    onClick={() => navigate("/add")}
                  >
                    Publier un objet
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden bg-troco-sand flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/items/${item.id}`)}
                    >
                      {item.image_url ? (
                        <img
                          src={imageUrl(item.image_url)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ItemPlaceholder className="w-full h-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-troco-dark text-sm truncate cursor-pointer"
                        onClick={() => navigate(`/items/${item.id}`)}
                      >
                        {item.title}
                      </p>

                      <div className="mt-1">
                        <CategoryBadge category={item.category} />
                      </div>
                    </div>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 text-sm px-2 py-1 flex-shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}