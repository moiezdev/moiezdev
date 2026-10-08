import { useEffect, useRef } from 'react';
import { linkifyToNodes } from './LinkifiedText';
import { DUR } from '../../motion/tokens';
import { prefersReducedMotion } from '../../motion/reducedMotion';

/**
 * A bot reply, shown whole with one short fade/rise (no fake typing — the API
 * returns the full answer). `onDone` fires once it has settled.
 */
const MessageText = ({ text, spans = [], onNavigate, active = true, onDone, onProgress, className = '' }) => {
  const onDoneRef = useRef(onDone);
  const onProgressRef = useRef(onProgress);
  onDoneRef.current = onDone;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!active) return undefined;
    onProgressRef.current?.();
    const id = window.setTimeout(() => onDoneRef.current?.(), prefersReducedMotion() ? 0 : DUR.base);
    return () => window.clearTimeout(id);
  }, [text, active]);

  return (
    <p className={`whitespace-pre-wrap ${active ? 'msg-in' : ''} ${className}`}>
      {linkifyToNodes(text, { spans, onNavigate })}
    </p>
  );
};

export default MessageText;
