import { useEffect, useRef, useState } from 'react';
import { linkifyToNodes } from './LinkifiedText';
import { prefersReducedMotion } from '../../motion/reducedMotion';

// ~70 characters a second, with short beats after punctuation
const CHARS_PER_MS = 0.07;
const PAUSE_MS = { punct: 90, newline: 140 };

/**
 * A bot reply, typed out smoothly on animation frames. Nav / contact links
 * become clickable once their full label has been typed. With reduced motion
 * the reply appears whole. `onDone` fires once it has finished.
 */
const MessageText = ({ text, spans = [], onNavigate, active = true, onDone, onProgress, className = '' }) => {
  const [shown, setShown] = useState(active ? '' : text);
  const onDoneRef = useRef(onDone);
  const onProgressRef = useRef(onProgress);
  onDoneRef.current = onDone;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setShown(text);
      if (active) onDoneRef.current?.();
      return undefined;
    }

    setShown('');
    let i = 0;
    let budget = 0;
    let pauseUntil = 0;
    let last = performance.now();
    let frame;

    const tick = (now) => {
      const dt = Math.min(now - last, 64); // a backgrounded tab doesn't dump the rest at once
      last = now;
      if (now >= pauseUntil) {
        budget += dt * CHARS_PER_MS;
        let next = i;
        while (budget >= 1 && next < text.length) {
          next += 1;
          budget -= 1;
          const ch = text[next - 1];
          if (ch === '\n' || /[.!?؟،,;:]/.test(ch)) {
            pauseUntil = now + (ch === '\n' ? PAUSE_MS.newline : PAUSE_MS.punct);
            budget = 0;
            break;
          }
        }
        if (next !== i) {
          i = next;
          setShown(text.slice(0, i));
          onProgressRef.current?.();
        }
      }
      if (i >= text.length) {
        onDoneRef.current?.();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, active]);

  return (
    <p className={`whitespace-pre-wrap ${className}`}>
      {linkifyToNodes(shown, { spans, onNavigate })}
      {active && shown.length < text.length && (
        <span className="inline-block w-[0.5ch] ms-px bg-accent align-baseline animate-pulse" aria-hidden>
          &nbsp;
        </span>
      )}
    </p>
  );
};

export default MessageText;
