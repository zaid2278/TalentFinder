import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPage, type Column } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createTenant, fetchTenants } from '../store/tenantSlice';
import type { Tenant } from '../api/client';

export function TenantListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, total, page, status } = useAppSelector((s) => s.tenants);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchTenants({ search, page: 1 }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, search]);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === '-name') return b.name.localeCompare(a.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return copy;
  }, [items, sort]);

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Tenant Name', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'id',
      header: 'Tenant ID',
      render: (r) => <span className="font-mono text-xs text-muted">{r.id.slice(0, 8)}…</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className="rounded-md bg-sea/10 px-2 py-0.5 text-xs font-semibold text-sea-deep">
          {r.status}
        </span>
      ),
    },
  ];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await dispatch(createTenant(name.trim())).unwrap();
      setShowForm(false);
      setName('');
      navigate('/candidates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ListPage
        title="Tenants"
        showTenantDropdown={false}
        primaryActionLabel="Create Tenant"
        onPrimaryAction={() => setShowForm(true)}
        summaryCards={[
          { label: 'Total tenants', value: total },
          { label: 'Active', value: total },
        ]}
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        sortOptions={[
          { value: '-createdAt', label: 'Newest' },
          { value: 'name', label: 'Name A–Z' },
          { value: '-name', label: 'Name Z–A' },
        ]}
        onSortChange={setSort}
        columns={columns}
        rows={sorted}
        loading={status === 'loading'}
        total={total}
        page={page}
        onPageChange={(p) => dispatch(fetchTenants({ search, page: p }))}
        emptyMessage="No tenants yet. Create one to get started."
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <h2 className="font-display text-2xl">Create Tenant</h2>
            <p className="mt-1 text-sm text-muted">Name a sourcing channel (e.g. LinkedIn).</p>
            <label className="mt-5 block text-sm font-medium">
              Tenant Name *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
                placeholder="LinkedIn"
              />
            </label>
            {error && <p className="mt-3 text-sm text-coral">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}