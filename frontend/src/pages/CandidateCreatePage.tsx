import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Skill } from '../api/client';
import { BackButton } from '../components/BackButton';
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
  const [parsedCvUrl, setParsedCvUrl] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  function toggleSkill(id: string) {
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleCvSelected(file: File | null) {
    setCvFile(file);
    setParsedCvUrl(null);
    setParseMessage(null);
    if (!file) return;

    setParsing(true);
    try {
      const result = await api.parseCv(file);
      setParsedCvUrl(result.cvUrl);

      if (result.readable) {
        const { fields } = result;
        if (fields.fullName) setFullName(fields.fullName);
        if (fields.email) setEmail(fields.email);
        if (fields.phone) setPhone(fields.phone);
        if (fields.location) setLocation(fields.location);
        if (fields.experienceYears !== undefined) setExperienceYears(fields.experienceYears);
        if (fields.skillIds?.length) setSkillIds(fields.skillIds);
        setParseMessage('CV parsed — review and edit the fields below before saving.');
      } else {
        setParseMessage(
          "We couldn't read this file automatically, please fill in the details below",
        );
      }
    } catch {
      // Fail softly into manual entry; keep the selected file for upload on save
      setParseMessage(
        "We couldn't read this file automatically, please fill in the details below",
      );
    } finally {
      setParsing(false);
    }
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
      if (cvFile) {
        formData.append('cv', cvFile);
      } else if (parsedCvUrl) {
        formData.append('cvUrl', parsedCvUrl);
      }

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
      <BackButton to="/candidates" label="Back to Candidates" />
      <h1 className="font-display text-3xl tracking-tight">Add Candidate</h1>
      <p className="mt-1 text-sm text-muted">
        Optional CV upload can auto-fill fields; you can always enter details manually.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium">
            Upload CV (optional)
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-1.5 block w-full text-sm"
              onChange={(e) => handleCvSelected(e.target.files?.[0] ?? null)}
            />
          </label>
          {parsing && (
            <p className="mt-2 text-sm text-muted">Reading CV…</p>
          )}
          {!parsing && parseMessage && (
            <p
              className={`mt-2 text-sm ${
                parseMessage.startsWith("We couldn't") ? 'text-coral' : 'text-sea-deep'
              }`}
            >
              {parseMessage}
            </p>
          )}
        </div>

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
