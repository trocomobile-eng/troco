import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed");
    } catch (e) {
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/feed");
    } catch (e) {
      setError("Connexion Google impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-2xl mx-auto px-4 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.38),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.34),transparent_36%),linear-gradient(180deg,#eefcff,#f4fff8)] flex flex-col">
      <div className="px-6 pt-14 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/75 border border-white px-4 py-2 shadow-sm">
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
            TROCO
          </span>
          <span className="text-xs font-bold text-slate-500">
            objets à échanger
          </span>
        </div>

        <h1 className="text-4xl font-black text-slate-900 mt-8 leading-tight">
          Donne une seconde vie à tes objets.
        </h1>

        <p className="text-slate-600 text-base mt-3 leading-relaxed">
          Échange localement, simplement, sans argent.
        </p>
      </div>

      <div className="flex-1 px-5 pb-8">
        <div className="bg-white/75 backdrop-blur-xl border border-white rounded-[2rem] shadow-sm p-5">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Connexion
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            className="w-full bg-white border border-sky-100 rounded-2xl py-3 font-black text-slate-700 shadow-sm active:scale-[0.98] transition"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-sky-100 flex-1" />
            <span className="text-xs font-bold text-slate-400">ou</span>
            <div className="h-px bg-sky-100 flex-1" />
          </div>

          <div className="space-y-3">
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
            className="btn-primary w-full mt-5"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          <p className="text-center text-slate-500 text-sm mt-5">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-emerald-600 font-black">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}