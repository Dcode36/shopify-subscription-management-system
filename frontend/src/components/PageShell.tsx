import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useCustomer } from '../auth/useCustomer.js';

export function PageShell() {
  const { customerId, logout } = useCustomer();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 text-lg font-bold text-white shadow-lg shadow-teal-500/25">
              V
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700">
                Subscription hub
              </p>
              <p className="text-xs text-slate-500">Manage recurring orders</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {customerId ? (
              <span className="hidden font-mono text-xs text-slate-500 sm:inline">{customerId}</span>
            ) : null}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
