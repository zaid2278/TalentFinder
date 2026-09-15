import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, type Skill } from '../api/client';
import { SkillChips } from '../components/ListPage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  deleteCandidate,
  fetchCandidate,
  updateCandidate,
} from '../store/candidateSlice';

export function CandidateDetailsPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const candidate = useAppSelector((s) => s.candidates.current);
  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenantId && id) dispatch(fetchCandidate({ tenantId, id }));
  }, [dispatch, tenantId, id]);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  useEffect(() => {
    if (!candidate) return;
    setFullName(candidate.fullName);
    setLocation(candidate.location || '');
    setExperienceYears(candidate.experienceYears);
    setEmail(candidate.email || '');
    setPhone(candidate.phone || '');
    setSkillIds(candidate.skills.map((s) => s.id));
  }, [candidate]);

  if (!tenantId) return <p className="text-muted">Select a tenant first.</p>;
  if (!candidate) return <p className="text-muted">Loading candidate…</p>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('location', location);
      formData.append('experienceYears', String(experienceYears));
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('skillIds', JSON.stringify(skillIds));
      if (cvFile) formData.append('cv', cvFile);
      await dispatch(updateCandidate({ tenantId, id, formData })).unwrap();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!tenantId || !candidate) return;
    if (!confirm(`Delete ${candidate.fullName}?`)) return;
    await dispatch(deleteCandidate({ tenantId, id }));
    navigate('/candidates');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-[fadeIn_0.35s_ease]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link to="/candidates" className="hover:text-sea">
              Candidates
            </Link>{' '}
            / Profile
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{candidate.fullName}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            aria-label="Edit"
          >
            {editing ? 'Cancel edit' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-coral/30 bg-white px-3 py-2 text-sm text-coral"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-line bg-white/80 p-6">
          <label className="block text-sm font-medium">
            Replace CV
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-1.5 block w-full text-sm"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block text-sm font-medium">
            Full Name *
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium">
              Experience *
              <input
                type="number"
                min={0}
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5"
              />
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
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      ) : (
        <div className="rounded-2xl border border-line bg-white/80 p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Location</dt>
              <dd className="mt-1">{candidate.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Experience</dt>
              <dd className="mt-1">{candidate.experienceYears} years</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Email</dt>
              <dd className="mt-1">{candidate.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-muted">Phone</dt>
              <dd className="mt-1">{candidate.phone || '—'}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.1em] text-muted">Skills</p>
            <div className="mt-2">
              <SkillChips skills={candidate.skills} />
            </div>
          </div>
          {candidate.cvUrl && (
            <a
              href={candidate.cvUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-sea hover:text-sea-deep"
            >
              Download CV
            </a>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white/80 p-6">
        <h2 className="font-display text-xl">Shortlisted Job Orders</h2>
        {!candidate.submissions?.length ? (
          <p className="mt-3 text-sm text-muted">Not shortlisted for any job orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {candidate.submissions.map((sub) => (
              <li key={sub.id} className="flex items-center justify-between gap-3 py-3">
                <Link
                  to={`/job-orders/${sub.jobOrder.id}`}
                  className="font-medium text-ink hover:text-sea"
                >
                  {sub.jobOrder.jobTitle}
                </Link>
                <span className="rounded-md bg-mist px-2 py-0.5 text-xs font-semibold">
                  {sub.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}