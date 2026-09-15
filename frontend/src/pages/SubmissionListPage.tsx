import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPage, type Column } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSubmissions } from '../store/submissionSlice';
import type { Submission } from '../api/client';

export function SubmissionListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const { items, total, page, status } = useAppSelector((s) => s.submissions);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');

  useEffect(() => {
    if (!tenantId) return;
    const t = setTimeout(() => {
      dispatch(fetchSubmissions({ tenantId, search, page: 1, sort }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, tenantId, search, sort]);

  const columns: Column<Submission>[] = [
    {
      key: 'job',
      header: 'Job Order',
      render: (r) => <span className="font-medium">{r.jobOrder.jobTitle}</span>,
    },
    { key: 'candidate', header: 'Candidate', render: (r) => r.candidate.fullName },
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

  return (
    <ListPage
      title="Submissions"
      summaryCards={[
        { label: 'Total submissions', value: total },
        {
          label: 'Shortlisted on page',
          value: items.filter((s) => s.status === 'Shortlisted').length,
        },
      ]}
      search={search}
      onSearchChange={setSearch}
      sort={sort}
      sortOptions={[
        { value: '-createdAt', label: 'Newest' },
        { value: 'status', label: 'Status A–Z' },
      ]}
      onSortChange={setSort}
      columns={columns}
      rows={items}
      loading={status === 'loading'}
      total={total}
      page={page}
      onPageChange={(p) =>
        tenantId && dispatch(fetchSubmissions({ tenantId, search, page: p, sort }))
      }
      onView={(r) => navigate(`/job-orders/${r.jobOrder.id}`)}
      emptyMessage={tenantId ? 'No submissions yet.' : 'Select a tenant first.'}
    />
  );
}