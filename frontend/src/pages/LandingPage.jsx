import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-[#25342f] bg-gradient-to-b from-sky-100 to-emerald-50">

      {/* HEADER */}
      <div className="text-center px-5 pt-16 pb-10">
        <img
          src="/logo.png"
          className="w-[320px] max-w-[85vw] mx-auto mb-6"
        />

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
          Donnez une seconde vie aux objets.
        </h1>

        <p className="max-w-xl mx-auto mt-6 text-lg text-slate-600 leading-relaxed">
          Troco est une application de troc nouvelle génération :
          proposez les objets que vous n’utilisez plus,
          découvrez ceux des autres et troquez simplement, sans argent.
        </p>

        <div className="mt-5 inline-block bg-white/80 px-4 py-2 rounded-full text-sm font-semibold text-slate-500">
          🚧 Projet en cours de développement
        </div>
      </div>

      {/* CARDS */}
      <div className="px-5 max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
        <Card emoji="✨" title="Simple" text="Publiez un objet et troquez facilement." />
        <Card emoji="📍" title="Local" text="Des échanges proches de vous." />
        <Card emoji="🌱" title="Durable" text="Réutilisez plutôt que racheter." />
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mt-10 px-5">
        <h2 className="text-center text-xl font-bold text-teal-600 mb-4">
          Questions fréquentes
        </h2>

        <Faq title="Est-ce que Troco est déjà disponible ?">
          Pas encore publiquement. Le projet est en cours de développement.
        </Faq>

        <Faq title="Est-ce que Troco utilise de l’argent ?">
          Non, Troco repose uniquement sur le troc.
        </Faq>

        <Faq title="Les échanges doivent-ils être équitables ?">
          L’important est que les deux personnes soient d’accord.
        </Faq>

        <Faq title="Où se font les échanges ?">
          En main propre, dans des lieux simples et rassurants.
        </Faq>
      </div>

      {/* CTA */}
      <div className="text-center mt-10 mb-16">
        <button
          onClick={() => navigate("/feed")}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow"
        >
          Voir le prototype
        </button>
      </div>
    </div>
  );
}

function Card({ emoji, title, text }) {
  return (
    <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-white text-center">
      <div className="text-2xl mb-2">{emoji}</div>
      <h3 className="font-bold text-teal-700">{title}</h3>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

function Faq({ title, children }) {
  return (
    <details className="border-t border-gray-200 py-3">
      <summary className="cursor-pointer font-semibold">
        {title}
      </summary>
      <p className="mt-2 text-slate-600">{children}</p>
    </details>
  );
}