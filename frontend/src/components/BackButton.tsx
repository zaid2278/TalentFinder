import { useNavigate } from 'react-router-dom';

type BackButtonProps = {
  to: string;
  label?: string;
};

export function BackButton({ to, label = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-sea hover:text-sea"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  );
}
