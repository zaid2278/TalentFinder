import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPage, SkillChips, type Column } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteCandidate, fetchCandidates } from '../store/candidateSlice';
import type { Candidate } from '../api/client';

export function CandidateListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const { items, total, page, status } = useAppSelector((s) => s.candidates);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');

  useEffect(() => {
    if (!tenantId) return;
    const t = setTimeout(() => {
      dispatch(fetchCandidates({ tenantId, search, page: 1, sort }));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, tenantId, search, sort]);

  const columns: Column<Candidate>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => <span className="font-medium">{r.fullName}</span>,
    },
    { key: 'location', header: 'Location', render: (r) => r.location || '—' },
    {
      key: 'exp',
      header: 'Experience',
      render: (r) => `${r.experienceYears} yr${r.experienceYears === 1 ? '' : 's'}`,
    },
    { key: 'skills', header: 'Skills', render: (r) => <SkillChips skills={r.skills} /> },
  ];

  return (
    <ListPage
      title="Candidates"
      primaryActionLabel="Add Candidate"
      onPrimaryAction={() => navigate('/candidates/new')}
      summaryCards={[
        { label: 'In this tenant', value: total },
        {
          label: 'Avg experience',
          value:
            items.length === 0
              ? '—'
              : `${Math.round(items.reduce((a, c) => a + c.experienceYears, 0) / items.length)} yrs`,
        },
      ]}
      search={search}
      onSearchChange={setSearch}
      sort={sort}
      sortOptions={[
        { value: '-createdAt', label: 'Newest' },
        { value: 'fullName', label: 'Name A–Z' },
        { value: '-experienceYears', label: 'Experience high–low' },
        { value: 'experienceYears', label: 'Experience low–high' },
      ]}
      onSortChange={setSort}
      columns={columns}
      rows={items}
      loading={status === 'loading'}
      total={total}
      page={page}
      onPageChange={(p) => tenantId && dispatch(fetchCandidates({ tenantId, search, page: p, sort }))}
      onView={(r) => navigate(`/candidates/${r.id}`)}
      onEdit={(r) => navigate(`/candidates/${r.id}?edit=1`)}
      onDelete={async (r) => {
        if (!tenantId) return;
        if (!confirm(`Delete ${r.fullName}?`)) return;
        await dispatch(deleteCandidate({ tenantId, id: r.id }));
      }}
      emptyMessage={tenantId ? 'No candidates for this tenant.' : 'Select a tenant first.'}
    />
  );
}