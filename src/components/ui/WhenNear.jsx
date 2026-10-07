import { Suspense, useEffect, useRef, useState } from 'react';

/**
 * Mounts its (lazy) children only once they come within ~600px of the
 * viewport, keeping their space reserved until then.
 */
const WhenNear = ({ children, minHeight }) => {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={near ? undefined : { minHeight }}>
      {near && <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense>}
    </div>
  );
};

export default WhenNear;
