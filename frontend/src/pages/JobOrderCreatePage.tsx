import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Skill } from '../api/client';
import { BackButton } from '../components/BackButton';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createJobOrder } from '../store/jobOrderSlice';

export function JobOrderCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tenantId = useAppSelector((s) => s.tenants.selectedTenantId);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [minExperienceYears, setMinExperienceYears] = useState(1);
  const [numberOfOpenings, setNumberOfOpenings] = useState(1);
  const [clientName, setClientName] = useState('');
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId) {
      setError('Select a tenant first');
      return;
    }
    if (skillIds.length === 0) {
      setError('Select at least one required skill');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const job = await dispatch(
        createJobOrder({
          tenantId,
          body: {
            jobTitle,
            location,
            minExperienceYears,
            numberOfOpenings,
            clientName: clientName || null,
            skillIds,
            status: 'Open',
          },
        }),
      ).unwrap();
      navigate(`/job-orders/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job order');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-[fadeIn_0.35s_ease]">
      <BackButton to="/job-orders" label="Back to Job Orders" />
      <h1 className="font-display text-3xl tracking-tight">Create Job Order</h1>
      <p className="mt-1 text-sm text-muted">Define the role so matching can rank candidates.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
        <label className="block text-sm font-medium">
          Job Title *
          <input
            required
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>
        <label className="block text-sm font-medium">
          Client Name
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>
        <label className="block text-sm font-medium">
          Location *
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Min Experience (Years) *
            <input
              required
              type="number"
              min={0}
              value={minExperienceYears}
              onChange={(e) => setMinExperienceYears(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
          <label className="block text-sm font-medium">
            Number of Openings *
            <input
              required
              type="number"
              min={1}
              value={numberOfOpenings}
              onChange={(e) => setNumberOfOpenings(Number(e.target.value))}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Required Skills *</legend>
          <div className="mt-2 flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-line p-3">
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
            onClick={() => navigate('/job-orders')}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-sea px-4 py-2 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Create Job Order'}
          </button>
        </div>
      </form>
    </div>
  );
}