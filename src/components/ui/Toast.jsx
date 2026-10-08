import { useEffect, useRef, useState } from 'react';

/**
 * One small frosted toast at the bottom of the screen (e.g. "Copied"),
 * announced politely to screen readers. Fades/rises in (250ms), leaves after 2s.
 */
export default function Toast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    const onToast = (e) => {
      clearTimeout(timer.current);
      setMessage(e.detail);
      setVisible(true);
      timer.current = setTimeout(() => setVisible(false), 2000);
    };
    window.addEventListener('app-toast', onToast);
    return () => {
      window.removeEventListener('app-toast', onToast);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="toast-wrap" aria-live="polite" role="status">
      <div className={`toast glass ring-1 ring-separator ${visible ? 'is-visible' : ''}`}>{message}</div>
    </div>
  );
}
