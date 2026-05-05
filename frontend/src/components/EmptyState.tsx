export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-8 py-16 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>
    </div>
  );
}
