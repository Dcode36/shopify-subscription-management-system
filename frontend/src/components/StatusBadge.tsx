import type { ContractStatus } from '../graphql/types.js';

const styles: Record<ContractStatus, string> = {
  ACTIVE: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  PAUSED: 'bg-amber-500/15 text-amber-900 ring-amber-500/25',
  CANCELLED: 'bg-slate-500/15 text-slate-700 ring-slate-500/20',
  FAILED: 'bg-rose-500/15 text-rose-800 ring-rose-500/25',
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${styles[status]}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
