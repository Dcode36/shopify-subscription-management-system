import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { useCustomer } from '../auth/useCustomer.js';
import { EmptyState } from '../components/EmptyState.js';
import { LoadingGrid } from '../components/LoadingGrid.js';
import { NetworkError } from '../components/NetworkError.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { SUBSCRIPTION_LIST } from '../graphql/operations.js';
import type { SubscriptionListData, SubscriptionListNode } from '../graphql/types.js';
import { formatDate, formatMoney } from '../lib/format.js';

export function SubscriptionListPage() {
  const { customerId } = useCustomer();
  const { data, loading, error, refetch } = useQuery<SubscriptionListData>(SUBSCRIPTION_LIST, {
    variables: { customerId: customerId ?? undefined },
    skip: !customerId,
  });

  if (!customerId) {
    return null;
  }

  if (loading && !data) {
    return <LoadingGrid />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <NetworkError message={error.message} />
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const edges = data?.subscriptionContracts.edges ?? [];
  if (edges.length === 0) {
    return (
      <EmptyState
        title="No subscriptions yet"
        body="When this customer has active or past subscriptions, they will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your subscriptions</h1>
          <p className="text-sm text-slate-600">
            Customer <span className="font-mono text-slate-800">{customerId}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="self-start rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800"
        >
          Refresh
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {edges.map(({ node }: { node: SubscriptionListNode }) => (
          <li key={node.id}>
            <Link
              to={`/subscriptions/${node.id}`}
              className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm ring-1 ring-transparent transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md hover:ring-teal-500/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">#{node.id}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Next bill · {formatDate(node.nextBillingDate)}
                  </p>
                </div>
                <StatusBadge status={node.status} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{node.billingFrequencyDescription}</p>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {node.lineItems.slice(0, 2).map((line) => (
                  <li key={line.id} className="flex justify-between gap-2 text-sm">
                    <span className="truncate text-slate-800">
                      {line.title}
                      {line.quantity > 1 ? ` ×${String(line.quantity)}` : ''}
                    </span>
                    <span className="shrink-0 font-medium text-slate-700">
                      {formatMoney(line.currentPrice.amount, line.currentPrice.currencyCode)}
                    </span>
                  </li>
                ))}
                {node.lineItems.length > 2 ? (
                  <li className="text-xs text-slate-500">+ more items in details</li>
                ) : null}
              </ul>
              <span className="mt-4 text-sm font-semibold text-teal-700 group-hover:text-teal-600">
                View details →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
