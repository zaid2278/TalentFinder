import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Skill } from '../api/client';
import { BackButton } from '../components/BackButton';
import { SkillChips } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearCurrent,
  deleteJobOrder,
  fetchJobOrder,
  fetchMatches,
  shortlistCandidate,
  unshortlistCandidate,
  updateJobOrder,
} from '../store/jobOrderSlice';

export function JobOrderDetailsPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const job = useAppSelector((s) => s.jobOrders.current);
  const matches = useAppSelector((s) => s.jobOrders.matches);
  const matchesStatus = useAppSelector((s) => s.jobOrders.matchesStatus);
  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [minExperienceYears, setMinExperienceYears] = useState(0);
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('Open');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [shortlisting, setShortlisting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insightsByCandidate, setInsightsByCandidate] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!tenantId || !id) return;
    dispatch(clearCurrent());
    dispatch(fetchJobOrder({ tenantId, id }));
    dispatch(fetchMatches({ tenantId, id }));
    setInsightsByCandidate({});
  }, [dispatch, tenantId, id]);

  useEffect(() => {
    if (!tenantId || !id || matchesStatus !== 'succeeded' || matches.length === 0) return;

    let cancelled = false;
    api
      .getMatchInsights(tenantId, id)
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const item of res.insights ?? []) {
          if (item.candidateId && item.insight) map[item.candidateId] = item.insight;
        }
        setInsightsByCandidate(map);
      })
      .catch(() => {
        if (!cancelled) setInsightsByCandidate({});
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId, id, matchesStatus, matches.length]);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    if (!job) return;
    setJobTitle(job.jobTitle);
    setLocation(job.location);
    setMinExperienceYears(job.minExperienceYears);
    setNumberOfOpenings(job.numberOfOpenings);
    setClientName(job.clientName || '');
    setStatus(job.status);
    setSkillIds(job.requiredSkills.map((s) => s.id));
  }, [job]);

  if (!tenantId) return <p className="text-muted">Select a tenant first.</p>;
  if (!job) return <p className="text-muted">Loading job order…</p>;

  const shortlistedIds = new Set(job.submissions?.map((s) => s.candidate.id) ?? []);

  async function handleShortlist(candidateId: string) {
    if (!tenantId) return;
    setShortlisting(candidateId);
    try {
      await dispatch(shortlistCandidate({ tenantId, jobOrderId: id, candidateId })).unwrap();
    } finally {
      setShortlisting(null);
    }
  }

  async function handleUnshortlist(candidateId: string) {
    if (!tenantId) return;
    setShortlisting(candidateId);
    try {
      await dispatch(unshortlistCandidate({ tenantId, jobOrderId: id, candidateId })).unwrap();
    } finally {
      setShortlisting(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setError(null);
    try {
      await dispatch(
        updateJobOrder({
          tenantId,
          id,
          body: {
            jobTitle,
            location,
            minExperienceYears,
            numberOfOpenings,
            clientName: clientName || null,
            status,
            skillIds,
          },
        }),
      ).unwrap();
      setEditing(false);
      dispatch(fetchMatches({ tenantId, id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function handleDelete() {
    if (!tenantId || !job) return;
    if (!confirm(`Delete ${job.jobTitle}?`)) return;
    await dispatch(deleteJobOrder({ tenantId, id }));
    navigate('/job-orders');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-[fadeIn_0.35s_ease]">
      <BackButton to="/job-orders" label="Back to Job Orders" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{job.jobTitle}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
          >
            {editing ? 'Cancel edit' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-coral/30 bg-white px-3 py-2 text-sm text-coral"
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-line bg-white/80 p-6">
          <label className="block text-sm font-medium">
            Job Title *
            <input
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Location *
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium">
              Client Name
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Min Exp *
              <input
                type="number"
                min={0}
                required
                value={minExperienceYears}
                onChange={(e) => setMinExperienceYears(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium">
              Openings *
              <input
                type="number"
                min={1}
                required
                value={numberOfOpenings}
                onChange={(e) => setNumberOfOpenings(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => {
              const active = skillIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setSkillIds((prev) =>
                      prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                    )
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    active ? 'bg-sea text-white' : 'bg-mist'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          {error && <p className="text-sm text-coral">{error}</p>}
          <button type="submit" className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white">
            Save changes
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-line bg-white/80 p-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Client</dt>
              <dd className="mt-1">{job.clientName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Location</dt>
              <dd className="mt-1">{job.location}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Min Experience</dt>
              <dd className="mt-1">{job.minExperienceYears} years</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Openings</dt>
              <dd className="mt-1">{job.numberOfOpenings}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Status</dt>
              <dd className="mt-1">{job.status}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted">Required Skills</p>
            <div className="mt-2">
              <SkillChips skills={job.requiredSkills} />
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white/80 p-6">
        <h2 className="font-display text-xl">Matching Candidates</h2>
        <p className="mt-1 text-sm text-muted">Ranked by exact skill overlap within this tenant.</p>
        <p className="mt-1 text-xs text-muted/80">Fit explanations powered by AI (optional)</p>
        {matchesStatus === 'loading' || matchesStatus === 'idle' ? (
          <p className="mt-4 text-sm text-muted">Loading matches…</p>
        ) : matchesStatus === 'failed' ? (
          <p className="mt-4 text-sm text-coral">
            Could not load matches. Is the API running on port 4000?
          </p>
        ) : matches.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No matching candidates in this tenant. Add candidates that share at least one required
            skill.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {matches.map((m) => {
              const already = shortlistedIds.has(m.candidate.id);
              const insight = insightsByCandidate[m.candidate.id];
              return (
                <li
                  key={m.candidate.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      to={`/candidates/${m.candidate.id}`}
                      className="font-medium hover:text-sea"
                    >
                      {m.candidate.fullName}
                    </Link>
                    <p className="text-sm text-muted">
                      {m.candidate.location || '—'} · {m.candidate.experienceYears} yrs ·{' '}
                      <span className="font-semibold text-sea-deep">{m.matchCount} match
                      {m.matchCount === 1 ? '' : 'es'}</span>
                    </p>
                    <div className="mt-2">
                      <SkillChips skills={m.matchedSkills} />
                    </div>
                    {insight && (
                      <p className="mt-2 text-sm italic text-muted">AI insight: {insight}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={shortlisting === m.candidate.id}
                    onClick={() =>
                      already
                        ? handleUnshortlist(m.candidate.id)
                        : handleShortlist(m.candidate.id)
                    }
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      already
                        ? 'border border-line bg-white text-ink hover:border-coral hover:text-coral'
                        : 'bg-coral text-white hover:opacity-90'
                    }`}
                  >
                    {shortlisting === m.candidate.id
                      ? '…'
                      : already
                        ? 'Remove shortlist'
                        : 'Shortlist'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-white/80 p-6">
        <h2 className="font-display text-xl">Shortlisted Candidates</h2>
        {!job.submissions?.length ? (
          <p className="mt-3 text-sm text-muted">No shortlists yet — use the buttons above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {job.submissions.map((sub) => (
              <li key={sub.id} className="flex items-center justify-between gap-3 py-3">
                <Link
                  to={`/candidates/${sub.candidate.id}`}
                  className="font-medium hover:text-sea"
                >
                  {sub.candidate.fullName}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-sea/10 px-2 py-0.5 text-xs font-semibold text-sea-deep">
                    {sub.status}
                  </span>
                  <button
                    type="button"
                    disabled={shortlisting === sub.candidate.id}
                    onClick={() => handleUnshortlist(sub.candidate.id)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-coral hover:border-coral"
                  >
                    {shortlisting === sub.candidate.id ? '…' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}