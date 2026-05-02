import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", username: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (form.password.length < 6) {
      setError("Mot de passe : 6 caractères minimum");
      return;
    }
    setLoading(true);
    try {
      await signup(form.email, form.password, form.username);
      navigate("/feed");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-troco-cream flex flex-col">
      <div className="bg-troco-green text-white px-8 pt-16 pb-12 rounded-b-[3rem]">
        <div className="text-5xl mb-3">🌱</div>
        <h1 className="font-display text-4xl mb-2">Rejoindre Troco</h1>
        <p className="text-troco-lime/90 text-sm">Gratuit. Toujours.</p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-6">
        <h2 className="font-display text-2xl text-troco-dark mb-6">
          Créer un compte
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input
            className="input"
            placeholder="Pseudo"
            value={form.username}
            onChange={set("username")}
            autoComplete="username"
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={set("email")}
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder="Mot de passe (6+ caractères)"
            value={form.password}
            onChange={set("password")}
            autoComplete="new-password"
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={loading || !form.email || !form.password || !form.username}
        >
          {loading ? "Création..." : "Créer mon compte"}
        </button>

        <p className="text-center text-troco-muted text-sm mt-6">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-troco-green font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
