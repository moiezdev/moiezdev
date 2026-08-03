import { useEffect, useRef, useState } from 'react';

/**
 * Reveals `text` character-by-character. Calls onDone when finished.
 * Slightly faster on spaces / punctuation for a natural “speaking” pace.
 */
const TypewriterText = ({ text, active = true, onDone, onProgress, className = '' }) => {
  const [shown, setShown] = useState(active ? '' : text);
  const onDoneRef = useRef(onDone);
  const onProgressRef = useRef(onProgress);
  onDoneRef.current = onDone;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!active) {
      setShown(text);
      return undefined;
    }

    setShown('');
    let i = 0;
    let timer;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      // Burst 2–3 chars per tick for snappier pacing
      const step = text[i] === ' ' ? 1 : 2 + (Math.random() > 0.7 ? 1 : 0);
      i = Math.min(i + step, text.length);
      setShown(text.slice(0, i));
      onProgressRef.current?.();

      if (i >= text.length) {
        onDoneRef.current?.();
        return;
      }

      const ch = text[i - 1];
      let delay = 6 + Math.random() * 5;
      if (ch === ' ') delay = 3;
      if (/[.,!?;:]/.test(ch)) delay = 28 + Math.random() * 18;
      if (ch === '\n') delay = 40;

      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 16);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, active]);

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {shown}
      {active && shown.length < text.length && (
        <span
          className="inline-block w-[0.55ch] ml-px bg-primary align-baseline animate-pulse"
          aria-hidden
        >
          &nbsp;
        </span>
      )}
    </p>
  );
};

export default TypewriterText;
