import { useEffect, useRef, useState } from 'react';
import { linkifyToNodes } from './LinkifiedText';

/**
 * Reveals `text` character-by-character. Nav / contact links become clickable
 * once their full label has been typed.
 */
const TypewriterText = ({
  text,
  spans = [],
  onNavigate,
  active = true,
  onDone,
  onProgress,
  className = '',
}) => {
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
      const step = text[i] === ' ' ? 1 : 2 + (Math.random() > 0.7 ? 1 : 0);
      i = Math.min(i + step, text.length);
      setShown(text.slice(0, i));
      onProgressRef.current?.();

      if (i >= text.length) {
        onDoneRef.current?.();
        return;
      }

      const ch = text[i - 1];
      let delay = 4 + Math.random() * 4;
      if (ch === ' ') delay = 2;
      if (/[.,!?;:]/.test(ch)) delay = 18 + Math.random() * 12;
      if (ch === '\n') delay = 24;

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
      {linkifyToNodes(shown, { spans, onNavigate })}
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
