import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedTenant } from '../store/tenantSlice';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type SummaryCard = {
  label: string;
  value: string | number;
};

type ListPageProps<T extends { id: string }> = {
  title: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  showTenantDropdown?: boolean;
  summaryCards?: SummaryCard[];
  search: string;
  onSearchChange: (value: string) => void;
  sort: string;
  sortOptions: Array<{ value: string; label: string }>;
  onSortChange: (value: string) => void;
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  emptyMessage?: string;
};

function RowMenu<T extends { id: string }>({
  row,
  onView,
  onEdit,
  onDelete,
}: {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!onView && !onEdit && !onDelete) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-md px-2 py-1 text-lg text-muted hover:bg-mist"
        aria-label="Row actions"
        onClick={() => setOpen((v) => !v)}
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 min-w-[140px] overflow-hidden rounded-lg border border-line bg-white shadow-lg">
          {onView && (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
              onClick={() => {
                setOpen(false);
                onView(row);
              }}
            >
              View
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
              onClick={() => {
                setOpen(false);
                onEdit(row);
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-coral hover:bg-mist"
              onClick={() => {
                setOpen(false);
                onDelete(row);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ListPage<T extends { id: string }>({
  title,
  primaryActionLabel,
  onPrimaryAction,
  showTenantDropdown = true,
  summaryCards = [],
  search,
  onSearchChange,
  sort,
  sortOptions,
  onSortChange,
  columns,
  rows,
  loading,
  total,
  page,
  pageSize = 10,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  emptyMessage = 'No results found.',
}: ListPageProps<T>) {
  const dispatch = useAppDispatch();
  const tenants = useAppSelector((s) => s.tenants.items);
  const selectedTenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 animate-[fadeIn_0.35s_ease]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showTenantDropdown && (
            <select
              className="min-w-[180px] rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-sea"
              value={selectedTenantId ?? ''}
              onChange={(e) => dispatch(setSelectedTenant(e.target.value || null))}
            >
              <option value="" disabled>
                Select tenant
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          {primaryActionLabel && onPrimaryAction && (
            <button
              type="button"
              onClick={onPrimaryAction}
              className="rounded-lg bg-sea px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sea-deep"
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>

      {summaryCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-line/70 bg-white/70 px-5 py-4 backdrop-blur-sm"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-muted">{card.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full max-w-md rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-sea"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-sea"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-mist/60 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium">
                    {col.header}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/60 last:border-0 hover:bg-mist/40">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-middle">
                        {col.render(row)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <RowMenu row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {rows.length} of {total} results
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkillChips({ skills }: { skills: Array<{ id: string; name: string }> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span
          key={s.id}
          className="rounded-md bg-mist px-2 py-0.5 text-xs font-medium text-ink-soft"
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}