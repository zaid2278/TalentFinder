import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login(username.trim(), password);
      dispatch(setCredentials(result));
      navigate('/tenants', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-lg"
      >
        <h1 className="font-display text-3xl text-ink">TalentFinder</h1>
        <p className="mt-1 text-sm text-muted">Sign in to the recruiter portal</p>

        <label className="mt-6 block text-sm font-medium">
          Username
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-sea"
          />
        </label>

        {error && <p className="mt-4 text-sm text-coral">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-sea py-2.5 text-sm font-semibold text-white hover:bg-sea-deep disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
