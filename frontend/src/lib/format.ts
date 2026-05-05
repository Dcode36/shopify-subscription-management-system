export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatMoney(amount: string, currencyCode: string): string {
  const n = Number.parseFloat(amount);
  if (!Number.isFinite(n)) return `${amount} ${currencyCode}`;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
  }).format(n);
}
