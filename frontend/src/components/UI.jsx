

import { CATEGORY_MAP, CATEGORIES } from "../constants/categories";
export function TopBar({ title = "Troco", back, action, centered = false }) {
if (centered) {
return (
<div className="px-5 pt-5 pb-2 bg-white">
<div className="flex items-center justify-center">
<img
src="/logo.png"
alt="Troco"
className="h-20 w-auto object-contain"
/>
</div>

<p className="text-center text-sm font-medium text-slate-500 mt-1">
Échange intelligent
</p>
</div>
);
}

return (
<div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
<div className="px-5 py-4 flex items-center justify-between">
<div className="flex items-center gap-3 min-w-0">
{back && (
<button
type="button"
onClick={back}
className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition text-xl"
>
←
</button>
)}

<h1 className="text-slate-900 font-black text-2xl tracking-tight truncate">
{title}
</h1>
</div>

{action}
</div>
</div>
);
}

export function CategoryBadge({ category, size = "sm" }) {
const emoji = CATEGORY_MAP[category] || "📦";

return (
<span
className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 font-bold ${
size === "lg" ? "text-sm px-4 py-2" : "text-xs px-2.5 py-1"
}`}
>
<span>{emoji}</span>
<span>{category || "Autre"}</span>
</span>
);
}

export function StatusBadge({ status }) {
const styles = {
pending: "bg-yellow-100 text-yellow-800",
accepted: "bg-green-100 text-green-800",
declined: "bg-slate-100 text-slate-600",
cancelled: "bg-red-100 text-red-700",
};

const labels = {
pending: "En attente",
accepted: "Accepté",
declined: "Refusé",
cancelled: "Annulé",
};

return (
<span
className={`rounded-full px-3 py-1 text-xs font-black ${
styles[status] || "bg-slate-100 text-slate-600"
}`}
>
{labels[status] || status}
</span>
);
}

export function LoadingSpinner() {
return (
<div className="flex justify-center py-16">
<div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-troco-green animate-spin" />
</div>
);
}

export function EmptyState({ icon = "📦", title, subtitle, action }) {
return (
<div className="text-center py-16 px-6">
<div className="text-4xl mb-4">{icon}</div>
<h2 className="text-xl font-black text-slate-900">{title}</h2>
{subtitle && (
<p className="text-sm text-slate-500 mt-2 mb-5">{subtitle}</p>
)}
{action}
</div>
);
}

export function ItemPlaceholder({ className = "" }) {
return (
<div
className={`bg-gradient-to-br from-[#f4f1ea] to-white flex items-center justify-center ${className}`}
>
<span className="text-3xl">📦</span>
</div>
);
}

export function CategorySelect({ value, onChange, multiple = false }) {
if (multiple) {
return (
<div className="flex flex-wrap gap-2">
{CATEGORIES.map((cat) => {
const selected = Array.isArray(value) && value.includes(cat);

return (
<button
key={cat}
type="button"
onClick={() => {
if (selected) onChange(value.filter((c) => c !== cat));
else onChange([...(value || []), cat]);
}}
className={`rounded-full border px-4 py-2 text-sm font-bold ${
selected
? "bg-troco-green text-white border-transparent"
: "bg-white text-slate-800 border-gray-200"
}`}
>
{CATEGORY_MAP[cat]} {cat}
</button>
);
})}
</div>
);
}

return (
<select
className="input"
value={value}
onChange={(e) => onChange(e.target.value)}
>
<option value="">Catégorie</option>
{CATEGORIES.map((cat) => (
<option key={cat} value={cat}>
{CATEGORY_MAP[cat]} {cat}
</option>
))}
</select>
);
}