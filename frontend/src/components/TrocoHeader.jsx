export default function TrocoHeader({ title, subtitle }) {
  return (
    <div className="sticky top-0 z-20 bg-white/85 backdrop-blur-xl border-b border-emerald-100">
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Troco"
          className="w-11 h-11 object-contain rounded-2xl"
        />

        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}