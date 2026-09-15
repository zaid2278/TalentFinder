import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPage, SkillChips, type Column } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteJobOrder, fetchJobOrders } from '../store/jobOrderSlice';
import type { JobOrder } from '../api/client';

export function JobOrderListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const { items, total, page, status } = useAppSelector((s) => s.jobOrders);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');

  useEffect(() => {
    if (!tenantId) return;
    const t = setTimeout(() => {
      dispatch(fetchJobOrders({ tenantId, search, page: 1, sort }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, tenantId, search, sort]);

  const columns: Column<JobOrder>[] = [
    {
      key: 'title',
      header: 'Job Title',
      render: (r) => <span className="font-medium">{r.jobTitle}</span>,
    },
    { key: 'client', header: 'Client Name', render: (r) => r.clientName || '—' },
    { key: 'location', header: 'Location', render: (r) => r.location },
    {
      key: 'minExp',
      header: 'Min Experience',
      render: (r) => `${r.minExperienceYears} yrs`,
    },
    { key: 'openings', header: 'Openings', render: (r) => r.numberOfOpenings },
    {
      key: 'skills',
      header: 'Required Skills',
      render: (r) => <SkillChips skills={r.requiredSkills} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
            r.status === 'Open' ? 'bg-sea/10 text-sea-deep' : 'bg-mist text-muted'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <ListPage
      title="Job Orders"
      primaryActionLabel="Create Job Order"
      onPrimaryAction={() => navigate('/job-orders/new')}
      summaryCards={[
        { label: 'Total orders', value: total },
        { label: 'Open on page', value: items.filter((j) => j.status === 'Open').length },
      ]}
      search={search}
      onSearchChange={setSearch}
      sort={sort}
      sortOptions={[
        { value: '-createdAt', label: 'Newest' },
        { value: 'jobTitle', label: 'Title A–Z' },
        { value: '-minExperienceYears', label: 'Min exp high–low' },
      ]}
      onSortChange={setSort}
      columns={columns}
      rows={items}
      loading={status === 'loading'}
      total={total}
      page={page}
      onPageChange={(p) => tenantId && dispatch(fetchJobOrders({ tenantId, search, page: p, sort }))}
      onView={(r) => navigate(`/job-orders/${r.id}`)}
      onEdit={(r) => navigate(`/job-orders/${r.id}?edit=1`)}
      onDelete={async (r) => {
        if (!tenantId) return;
        if (!confirm(`Delete ${r.jobTitle}?`)) return;
        await dispatch(deleteJobOrder({ tenantId, id: r.id }));
      }}
      emptyMessage={tenantId ? 'No job orders for this tenant.' : 'Select a tenant first.'}
    />
  );
}