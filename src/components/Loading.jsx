import { t } from '../i18n/content';
import { usePreferences } from '../context/Preferences';

/** Apple-style activity indicator. */
export const Spinner = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" style={{ animation: 'spin 1s steps(8) infinite' }} aria-hidden>
    {Array.from({ length: 8 }).map((_, i) => (
      <rect
        key={i}
        x="12.75"
        y="2"
        width="2.5"
        height="7"
        rx="1.25"
        fill="currentColor"
        opacity={0.2 + (i / 8) * 0.8}
        transform={`rotate(${i * 45} 14 14)`}
      />
    ))}
  </svg>
);

export default function Loading({ height = 'h-screen', message }) {
  const { lang } = usePreferences();
  const label = message ?? t(lang, 'common.loading');

  return (
    <div className={`flex items-center justify-center w-full bg-bg/80 ${height}`} role="status">
      <div className="flex flex-col items-center gap-3 text-label-2">
        <Spinner />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
