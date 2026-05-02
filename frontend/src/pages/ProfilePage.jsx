import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth, storage } from "../firebase";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import BottomNav from "../components/BottomNav";
import TrocoPageHeader from "../components/TrocoPageHeader";
import { CATEGORIES } from "../constants/categories";


const ARRONDISSEMENTS = [
  "Paris 1", "Paris 2", "Paris 3", "Paris 4", "Paris 5",
  "Paris 6", "Paris 7", "Paris 8", "Paris 9", "Paris 10",
  "Paris 11", "Paris 12", "Paris 13", "Paris 14", "Paris 15",
  "Paris 16", "Paris 17", "Paris 18", "Paris 19", "Paris 20",
  "Autre",
];

export default function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    arrondissement: "",
    preferences: [],
    avatarUrl: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(firebaseUser);

      try {
        const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (profileSnap.exists()) {
          const data = profileSnap.data();

          setProfile({
            displayName: data.displayName || firebaseUser.displayName || "",
            bio: data.bio || "",
            arrondissement: data.arrondissement || "",
            preferences: data.preferences || [],
            avatarUrl: data.avatarUrl || firebaseUser.photoURL || "",
          });
        } else {
          setProfile({
            displayName: firebaseUser.displayName || "",
            bio: "",
            arrondissement: "",
            preferences: [],
            avatarUrl: firebaseUser.photoURL || "",
          });
        }

        const q = query(
          collection(db, "items"),
          where("ownerId", "==", firebaseUser.uid)
        );

        const snapshot = await getDocs(q);

        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        items.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });

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

  const togglePreference = (cat) => {
    setProfile((current) => {
      const exists = current.preferences.includes(cat);

      return {
        ...current,
        preferences: exists
          ? current.preferences.filter((c) => c !== cat)
          : [...current.preferences, cat],
      };
    });
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);

    try {
      const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
      const avatarRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}-${cleanName}`
      );

      await uploadBytes(avatarRef, file);
      const avatarUrl = await getDownloadURL(avatarRef);

      setProfile((current) => ({
        ...current,
        avatarUrl,
      }));
    } catch (error) {
      console.error("Erreur avatar :", error);
      alert("Erreur lors de l’upload de la photo.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: profile.displayName.trim(),
          bio: profile.bio.trim(),
          arrondissement: profile.arrondissement,
          preferences: profile.preferences,
          avatarUrl: profile.avatarUrl,
          email: user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await updateProfile(user, {
        displayName: profile.displayName.trim() || "Utilisateur Troco",
        photoURL: profile.avatarUrl || null,
      });

      setEditing(false);
    } catch (error) {
      console.error("Erreur sauvegarde profil :", error);
      alert("Erreur lors de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.35),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.30),transparent_35%),linear-gradient(180deg,#eefcff,#f4fff8)]">
      <TrocoPageHeader
        title="Profil"
        subtitle="Ton espace, tes objets, tes préférences."
        action={
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-slate-600 bg-white/80 rounded-full px-4 py-2 shadow-sm border border-white"
          >
            Déconnexion
          </button>
        }
      />

      <div className="px-5">
        <div className="bg-white/65 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/80 p-5 mb-6">
          <div className="flex items-start gap-4">
            <label className="relative cursor-pointer">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-sky-500 to-emerald-500 overflow-hidden flex items-center justify-center text-white text-2xl font-black shadow-sm">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.email?.[0]?.toUpperCase() || "?"
                )}
              </div>

              {editing && (
                <>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-sm">
                    📷
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatar}
                  />
                </>
              )}
            </label>

            <div className="flex-1 min-w-0">
              {!editing ? (
                <>
                  <p className="font-black text-xl text-slate-900 truncate">
                    {profile.displayName ||
                      user?.displayName ||
                      "Utilisateur Troco"}
                  </p>

                  <p className="text-sm text-slate-500 truncate">
                    {user?.email}
                  </p>

                  {profile.arrondissement && (
                    <p className="text-sm text-emerald-700 font-black mt-2">
                      📍 {profile.arrondissement}
                    </p>
                  )}

                  {profile.bio ? (
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                      Ajoute une courte description pour rassurer les autres utilisateurs.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Nom affiché"
                    value={profile.displayName}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        displayName: e.target.value,
                      }))
                    }
                  />

                  <select
                    className="input"
                    value={profile.arrondissement}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        arrondissement: e.target.value,
                      }))
                    }
                  >
                    <option value="">Ton arrondissement</option>
                    {ARRONDISSEMENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-4 space-y-4">
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Décris-toi en quelques mots..."
                value={profile.bio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
              />

              <div>
                <p className="text-xs uppercase font-black text-slate-400 mb-2">
                  Préférences
                </p>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = profile.preferences.includes(cat);

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => togglePreference(cat)}
                        className={`px-3 py-2 rounded-full text-xs font-bold border ${
                          active
                            ? "bg-gradient-to-r from-sky-500 to-emerald-500 text-white border-transparent"
                            : "bg-white/80 text-slate-600 border-sky-100"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          )}

          {!editing && (
            <div className="mt-4">
              {profile.preferences?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.preferences.map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-100 text-xs font-bold text-emerald-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => setEditing(true)}
                className="w-full rounded-full bg-white/80 border border-sky-100 py-3 text-sm font-black text-slate-700 shadow-sm"
              >
                Modifier mon profil
              </button>
            </div>
          )}
        </div>

        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs uppercase font-black text-emerald-600 tracking-wide">
              Mes objets
            </p>
            <h2 className="text-2xl font-black text-slate-900">
              Bibliothèque
            </h2>
            <p className="text-sm text-slate-500">
              {myItems.length} objet{myItems.length > 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => navigate("/add")}
            className="text-sm font-black text-white bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full px-4 py-2 shadow-sm"
          >
            + Ajouter
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Chargement...</p>
        ) : myItems.length === 0 ? (
          <div className="bg-white/70 rounded-3xl shadow-sm p-6 text-center border border-white">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-black text-slate-900">Aucun objet publié</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Publie ton premier objet pour commencer à échanger.
            </p>

            <button
              onClick={() => navigate("/add")}
              className="btn-primary w-full"
            >
              Publier un objet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {myItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/items/${item.id}`)}
                className="group bg-white/70 backdrop-blur rounded-2xl overflow-hidden shadow-sm border border-white cursor-pointer active:scale-[0.97] transition"
              >
                <div className="aspect-square bg-gradient-to-br from-sky-50 to-emerald-50 overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      —
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <p className="font-black text-[12px] text-slate-900 truncate">
                    {item.title || "Sans titre"}
                  </p>

                  <p className="text-[10px] text-emerald-700 font-bold truncate mt-0.5">
                    {item.category || "Objet"}
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