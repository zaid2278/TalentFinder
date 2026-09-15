import { NavLink, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTenants } from '../store/tenantSlice';

const nav = [
  { to: '/tenants', label: 'Tenant' },
  { to: '/candidates', label: 'Candidate' },
  { to: '/job-orders', label: 'Job Order' },
  { to: '/submissions', label: 'Submission' },
];

export function AppShell() {
  const dispatch = useAppDispatch();
  const selectedTenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const tenants = useAppSelector((s) => s.tenants.items);
  const selectedName = tenants.find((t) => t.id === selectedTenantId)?.name;

  useEffect(() => {
    dispatch(fetchTenants());
  }, [dispatch]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-ink text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-ink-soft">
        <div className="px-6 py-7">
          <p className="font-display text-2xl tracking-tight">TalentFinder</p>
          <p className="mt-1 text-sm text-white/55">Recruiter Portal</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-sea text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {selectedName && (
          <div className="mt-auto hidden px-6 pb-6 lg:block">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40">Active tenant</p>
            <p className="mt-1 text-sm font-medium text-sea">{selectedName}</p>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/80 bg-paper/80 px-4 py-3 backdrop-blur-md sm:px-8">
          <div>
            <p className="font-display text-xl text-ink sm:text-2xl">TalentFinder</p>
            <p className="text-xs text-muted sm:text-sm">Match talent to open roles, by tenant</p>
          </div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
            aria-label="User avatar"
          >
            RF
          </div>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}