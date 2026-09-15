import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTenants } from '../store/tenantSlice';
import { logout } from '../store/authSlice';

const baseNav = [
  { to: '/tenants', label: 'Tenant' },
  { to: '/candidates', label: 'Candidate' },
  { to: '/job-orders', label: 'Job Order' },
  { to: '/submissions', label: 'Submission' },
];

function UserAvatarMenu() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const initials =
    user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '??';
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    let removeListeners: (() => void) | undefined;

    // Same deferred outside-click / Escape pattern as RowMenu in ListPage
    const timer = window.setTimeout(() => {
      const onPointerDown = (e: PointerEvent) => {
        const target = e.target as Node;
        if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
        setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };

      document.addEventListener('pointerdown', onPointerDown, true);
      document.addEventListener('keydown', onKey);

      removeListeners = () => {
        document.removeEventListener('pointerdown', onPointerDown, true);
        document.removeEventListener('keydown', onKey);
      };
    }, 0);

    return () => {
      window.clearTimeout(timer);
      removeListeners?.();
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {initials}
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[176px] rounded-xl border border-line bg-white py-1 shadow-[0_12px_32px_rgba(12,31,46,0.18)]"
        >
          <p className="px-3.5 py-2.5 text-sm font-medium text-ink" role="presentation">
            {user?.name ?? 'User'}
          </p>
          <p className="px-3.5 pb-2 text-xs text-muted" role="presentation">
            {user?.role ?? ''}
          </p>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm font-medium text-ink hover:bg-mist"
            onClick={() => {
              dispatch(logout());
              navigate('/login', { replace: true });
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((s) => s.auth.user?.role);
  const selectedTenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const tenants = useAppSelector((s) => s.tenants.items);
  const selectedName = tenants.find((t) => t.id === selectedTenantId)?.name;
  const nav =
    role === 'ADMIN'
      ? [...baseNav.slice(0, 1), { to: '/recruiters', label: 'Recruiters' }, ...baseNav.slice(1)]
      : baseNav;

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
          <UserAvatarMenu />
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
