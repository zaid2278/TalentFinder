import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Skill } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createCandidate } from '../store/candidateSlice';

export function CandidateCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  function toggleSkill(id: string) {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setError('Select a tenant first');
      return;
    }
    if (skillIds.length === 0) {
      setError('Select at least one skill');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('location', location);
      formData.append('experienceYears', String(experienceYears));
      if (email) formData.append('email', email);
      if (phone) formData.append('phone', phone);
      formData.append('skillIds', JSON.stringify(skillIds));
      if (cvFile) formData.append('cv', cvFile);

      const candidate = await dispatch(createCandidate({ tenantId, formData })).unwrap();
      navigate(`/candidates/${candidate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create candidate');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-[fadeIn_0.35s_ease]">
      <h1 className="font-display text-3xl tracking-tight">Add Candidate</h1>
      <p className="mt-1 text-sm text-muted">Manual entry with optional CV file upload (no parsing).</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Upload CV (optional)
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
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Total Experience (Years) *
            <input
              required
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Skills * (at least one)</legend>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-line p-3">
            {skills.map((s) => {
              const active = skillIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    active ? 'bg-sea text-white' : 'bg-mist text-ink-soft hover:bg-line'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/candidates')}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create Candidate'}
          </button>
        </div>
      </form>
    </div>
  );
}