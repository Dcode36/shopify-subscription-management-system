export function NetworkError({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900 shadow-sm"
      role="alert"
    >
      <p className="font-semibold">Something went wrong</p>
      <p className="mt-1 text-sm text-rose-800/90">{message}</p>
    </div>
  );
}
