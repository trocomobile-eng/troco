import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/feed");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-troco-cream flex flex-col">
      {/* Hero */}
      <div className="bg-troco-green text-white px-8 pt-16 pb-12 rounded-b-[3rem]">
        <div className="text-5xl mb-3">🔄</div>
        <h1 className="font-display text-4xl mb-2">Troco</h1>
        <p className="text-troco-lime/90 text-sm font-body">
          Échangez, ne payez pas.
        </p>
      </div>

      <div className="flex-1 px-6 pt-8 pb-6">
        <h2 className="font-display text-2xl text-troco-dark mb-6">
          Connexion
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="input"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center text-troco-muted text-sm mt-6">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-troco-green font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
