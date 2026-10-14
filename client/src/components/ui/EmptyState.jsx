export default function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white p-8 text-center">
      <h2 className="font-display text-xl font-bold text-brand-800">{title}</h2>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
