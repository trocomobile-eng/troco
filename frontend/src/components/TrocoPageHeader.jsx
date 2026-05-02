export default function TrocoPageHeader({ title, subtitle, action }) {
  return (
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-white px-3 py-1.5 shadow-sm">
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
              TROCO
            </span>
            <span className="text-xs font-bold text-slate-500">
              objets à échanger
            </span>
          </div>

          {title && (
            <h1 className="mt-3 text-xl font-black text-slate-900">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>
    </div>
  );
}