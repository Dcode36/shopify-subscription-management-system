import { useMutation, useQuery } from '@apollo/client/react';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCustomer } from '../auth/useCustomer.js';
import { EmptyState } from '../components/EmptyState.js';
import { NetworkError } from '../components/NetworkError.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  CANCEL_SUBSCRIPTION,
  PAUSE_SUBSCRIPTION,
  RESUME_SUBSCRIPTION,
  SKIP_NEXT_DELIVERY,
  SUBSCRIPTION_DETAIL,
  SUBSCRIPTION_LIST,
} from '../graphql/operations.js';
import type {
  MutationPayload,
  NotFoundPayload,
  SkipNextDeliveryMutationPayload,
  SubscriptionDetailData,
} from '../graphql/types.js';
import { formatDate, formatMoney } from '../lib/format.js';

function isNotFound(
  r: SubscriptionDetailData['subscriptionContract'],
): r is NotFoundPayload {
  return r.__typename === 'NotFoundError';
}

function collectMutationErrors(payload: MutationPayload | undefined): string[] {
  if (!payload?.success && payload?.userErrors?.length) {
    return payload.userErrors.map((e) => e.message);
  }
  return [];
}

export function SubscriptionDetailPage() {
  const { id: contractId = '' } = useParams();
  const { customerId } = useCustomer();
  const listVars = { customerId: customerId ?? undefined };
  const refetchSpec = [
    { query: SUBSCRIPTION_DETAIL, variables: { id: contractId } },
    { query: SUBSCRIPTION_LIST, variables: listVars },
  ] as const;

  const { data, loading, error, refetch } = useQuery<SubscriptionDetailData>(SUBSCRIPTION_DETAIL, {
    variables: { id: contractId },
    skip: contractId.length === 0,
  });

  const [pauseMut, { loading: pausing }] = useMutation(PAUSE_SUBSCRIPTION, {
    refetchQueries: [...refetchSpec],
  });
  const [resumeMut, { loading: resuming }] = useMutation(RESUME_SUBSCRIPTION, {
    refetchQueries: [...refetchSpec],
  });
  const [skipMut, { loading: skipping }] = useMutation(SKIP_NEXT_DELIVERY, {
    refetchQueries: [...refetchSpec],
  });
  const [cancelMut, { loading: cancelling }] = useMutation(CANCEL_SUBSCRIPTION, {
    refetchQueries: [...refetchSpec],
  });

  const pauseDialogRef = useRef<HTMLDialogElement>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const [resumeAtLocal, setResumeAtLocal] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelAck, setCancelAck] = useState(false);
  const [skipNotice, setSkipNotice] = useState<{
    previous: string | null;
    next: string;
  } | null>(null);

  if (contractId.length === 0) {
    return <EmptyState title="Missing subscription" body="No id in the URL." />;
  }

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <NetworkError message={error.message} />
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  const result = data?.subscriptionContract;
  if (!result) {
    return <EmptyState title="No data" body="Try refreshing this page." />;
  }

  if (isNotFound(result)) {
    return (
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex text-sm font-medium text-teal-700 hover:text-teal-600"
        >
          ← Back to list
        </Link>
        <EmptyState title="Not found" body={result.message} />
      </div>
    );
  }

  const c = result;
  const busy = pausing || resuming || skipping || cancelling;

  const openPause = () => {
    setActionError(null);
    setResumeAtLocal('');
    pauseDialogRef.current?.showModal();
  };

  const openCancel = () => {
    setActionError(null);
    setCancelReason('');
    setCancelAck(false);
    cancelDialogRef.current?.showModal();
  };

  const closePause = () => pauseDialogRef.current?.close();
  const closeCancel = () => cancelDialogRef.current?.close();

  const onPauseConfirm = async () => {
    setActionError(null);
    let resumeDate: string | undefined;
    if (resumeAtLocal.trim().length > 0) {
      const d = new Date(resumeAtLocal);
      if (Number.isNaN(d.getTime())) {
        setActionError('Resume date is not valid.');
        return;
      }
      resumeDate = d.toISOString();
    }
    const res = await pauseMut({
      variables: { input: { contractId: c.id, resumeDate } },
    });
    const payload = res.data as { pauseSubscription?: MutationPayload } | null | undefined;
    const errs = collectMutationErrors(payload?.pauseSubscription);
    if (errs.length > 0) {
      setActionError(errs.join(' '));
      return;
    }
    closePause();
  };

  const onResume = async () => {
    setActionError(null);
    const res = await resumeMut({ variables: { input: { contractId: c.id } } });
    const payload = res.data as { resumeSubscription?: MutationPayload } | null | undefined;
    const errs = collectMutationErrors(payload?.resumeSubscription);
    if (errs.length > 0) setActionError(errs.join(' '));
  };

  const onSkip = async () => {
    setActionError(null);
    setSkipNotice(null);
    const previousNext = c.nextBillingDate;
    const res = await skipMut({ variables: { input: { contractId: c.id } } });
    const payload = res.data as
      | { skipNextDelivery?: SkipNextDeliveryMutationPayload }
      | null
      | undefined;
    const p = payload?.skipNextDelivery;
    const errs = collectMutationErrors(p);
    if (errs.length > 0) {
      setActionError(errs.join(' '));
      return;
    }
    const newBilling = p?.contract?.nextBillingDate;
    if (p?.success && typeof newBilling === 'string') {
      setSkipNotice({ previous: previousNext, next: newBilling });
    }
    await refetch();
  };

  const onCancelConfirm = async () => {
    setActionError(null);
    if (!cancelAck) {
      setActionError('Please confirm you want to cancel this subscription.');
      return;
    }
    const res = await cancelMut({
      variables: {
        input: {
          contractId: c.id,
          reason: cancelReason.trim().length > 0 ? cancelReason.trim() : undefined,
        },
      },
    });
    const payload = res.data as { cancelSubscription?: MutationPayload } | null | undefined;
    const errs = collectMutationErrors(payload?.cancelSubscription);
    if (errs.length > 0) {
      setActionError(errs.join(' '));
      return;
    }
    closeCancel();
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex text-sm font-medium text-teal-700 hover:text-teal-600"
        >
          ← All subscriptions
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-400">#{c.id}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Subscription</h1>
            <div className="mt-3 max-w-md rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50/80 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                Next billing date
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {formatDate(c.nextBillingDate)}
              </p>
              <p className="mt-1 text-xs text-teal-900/80">{c.billingFrequencyDescription}</p>
            </div>
          </div>
          <StatusBadge status={c.status} />
        </div>
      </div>

      {skipNotice ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4 text-teal-950 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="text-sm">
            <p className="font-semibold">Next delivery skipped</p>
            <p className="mt-1 text-teal-900/90">
              Next charge is now{' '}
              <time className="font-semibold" dateTime={skipNotice.next}>
                {formatDate(skipNotice.next)}
              </time>
              {skipNotice.previous ? (
                <>
                  {' '}
                  <span className="text-teal-800/90">
                    (was <span className="line-through">{formatDate(skipNotice.previous)}</span>)
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSkipNotice(null)}
            className="shrink-0 self-end rounded-lg px-2 py-1 text-sm font-medium text-teal-800 underline-offset-2 hover:underline sm:self-center"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Line items
            </h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {c.lineItems.map((line) => (
                <li key={line.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{line.title}</p>
                    {line.variantTitle ? (
                      <p className="text-sm text-slate-500">{line.variantTitle}</p>
                    ) : null}
                    <p className="text-xs text-slate-500">Qty {String(line.quantity)}</p>
                  </div>
                  <p className="font-semibold text-slate-800">
                    {formatMoney(line.currentPrice.amount, line.currentPrice.currencyCode)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Shipping address
            </h2>
            {c.shippingAddress ? (
              <address className="mt-4 not-italic text-sm leading-relaxed text-slate-700">
                {c.shippingAddress.formatted.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No address on file.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Billing</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="text-slate-500">Next billing</dt>
                <dd className="text-right text-base font-bold tabular-nums text-slate-900">
                  {formatDate(c.nextBillingDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Frequency</dt>
                <dd className="text-right font-medium text-slate-800">{c.billingFrequencyDescription}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-right text-slate-800">{formatDate(c.createdAt)}</dd>
              </div>
              {c.pausedUntil ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Resume</dt>
                  <dd className="text-right text-slate-800">{formatDate(c.pausedUntil)}</dd>
                </div>
              ) : null}
              {c.cancellationReason ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-slate-500">Cancellation note</dt>
                  <dd className="text-slate-800">{c.cancellationReason}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h2>
            <div className="mt-4 flex flex-col gap-2">
              {c.status === 'ACTIVE' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={openPause}
                  className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow hover:bg-amber-400 disabled:opacity-50"
                >
                  Pause subscription
                </button>
              ) : null}
              {c.status === 'PAUSED' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onResume()}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
                >
                  {resuming ? 'Resuming…' : 'Resume subscription'}
                </button>
              ) : null}
              {c.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onSkip()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-teal-300 disabled:opacity-50"
                >
                  {skipping ? 'Skipping…' : 'Skip next delivery'}
                </button>
              ) : null}
              {c.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={openCancel}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
                >
                  Cancel subscription
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <dialog
        ref={pauseDialogRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl backdrop:bg-slate-900/40"
        onClose={() => setActionError(null)}
      >
        <form
          method="dialog"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void onPauseConfirm();
          }}
        >
          <h3 className="text-lg font-bold text-slate-900">Pause subscription</h3>
          <p className="text-sm text-slate-600">
            Optionally pick a date when deliveries should resume. Leave blank to pause without a
            scheduled resume.
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Resume around (local time)
            <input
              type="datetime-local"
              value={resumeAtLocal}
              onChange={(e) => setResumeAtLocal(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={closePause}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={pausing}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pausing ? 'Pausing…' : 'Confirm pause'}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={cancelDialogRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl backdrop:bg-slate-900/40"
        onClose={() => setActionError(null)}
      >
        <h3 className="text-lg font-bold text-slate-900">Cancel subscription</h3>
        <p className="mt-2 text-sm text-slate-600">
          This stops future billing. You can add an optional reason for your records.
        </p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Reason (optional)
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner"
          />
        </label>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={cancelAck}
            onChange={(e) => setCancelAck(e.target.checked)}
            className="mt-1 size-4 rounded border-slate-300"
          />
          <span>I understand this subscription will be cancelled.</span>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={closeCancel}
          >
            Back
          </button>
          <button
            type="button"
            disabled={cancelling}
            onClick={() => void onCancelConfirm()}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {cancelling ? 'Cancelling…' : 'Confirm cancel'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
