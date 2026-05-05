import { useQuery } from '@apollo/client/react';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useCustomer } from '../auth/useCustomer.js';
import { NetworkError } from '../components/NetworkError.js';
import { CUSTOMER_OPTIONS } from '../graphql/operations.js';
import type { CustomerOptionsData } from '../graphql/types.js';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, customerId } = useCustomer();
  const { data, loading, error } = useQuery<CustomerOptionsData>(CUSTOMER_OPTIONS);
  const [selectedId, setSelectedId] = useState('');

  if (customerId) {
    return <Navigate to="/" replace />;
  }

  const options = data?.customerOptions ?? [];
  const selectValue = selectedId || options[0]?.id || '';

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = selectValue;
    if (id.length === 0) return;
    login(id);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-xl font-bold text-white shadow-lg shadow-teal-500/30">
            V
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Choose a demo customer to view subscriptions.</p>
        </div>

        {error ? (
          <NetworkError message={error.message} />
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="customer" className="block text-sm font-medium text-slate-700">
                Customer
              </label>
              <select
                id="customer"
                value={selectValue}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || options.length === 0}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 shadow-inner focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60"
              >
                {loading ? (
                  <option value="">Loading customers…</option>
                ) : (
                  options.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} ({c.id})
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || selectValue.length === 0}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
