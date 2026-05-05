export function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {['a', 'b', 'c', 'd'].map((k) => (
        <div
          key={k}
          className="h-40 animate-pulse rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-100/80"
        />
      ))}
    </div>
  );
}
