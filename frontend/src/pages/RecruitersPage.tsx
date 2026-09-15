import { useEffect, useState, type FormEvent } from 'react';
import { api, type RecruiterAccount } from '../api/client';
import { useAppSelector } from '../store/hooks';
import { fetchTenants } from '../store/tenantSlice';
import { useAppDispatch } from '../store/hooks';

export function RecruitersPage() {
  const dispatch = useAppDispatch();
  const tenants = useAppSelector((s) => s.tenants.items);
  const [items, setItems] = useState<RecruiterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadRecruiters() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRecruiters();
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recruiters');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    dispatch(fetchTenants());
    loadRecruiters();
  }, [dispatch]);

  useEffect(() => {
    if (!tenantId && tenants[0]) setTenantId(tenants[0].id);
  }, [tenants, tenantId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createRecruiter({ name, username, password, tenantId });
      setName('');
      setUsername('');
      setPassword('');
      await loadRecruiters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recruiter');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Recruiters</h1>
        <p className="mt-1 text-sm text-muted">Manage recruiter accounts and tenant assignments.</p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Create recruiter</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Username
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Tenant
            <select
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-sea"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-line bg-mist/50 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Tenant</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-muted">
                  No recruiter accounts yet.
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.username}</td>
                  <td className="px-4 py-3">{r.role}</td>
                  <td className="px-4 py-3 text-muted">
                    {tenants.find((t) => t.id === r.tenantId)?.name ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
