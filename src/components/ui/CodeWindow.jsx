import { useEffect, useRef, useState } from 'react';
import WindowChrome from './WindowChrome';
import { getExperienceYears } from '../../utils/experience';

// token helpers — k: keyword, s: string, n: number, p: property, t: type, c: comment
const k = (v) => ['k', v];
const s = (v) => ['s', `'${v}'`];
const p = (v) => ['p', v];
const x = (v) => ['x', v];
const list = (items) => [x('['), ...items.flatMap((v, i) => (i ? [x(', '), s(v)] : [s(v)])), x(']')];

const buildLines = (years) => [
  [['c', '// The engineer behind this portfolio']],
  [k('const'), x(' '), ['t', 'engineer'], x(': '), ['t', 'Engineer'], x(' = {')],
  [x('  '), p('name'), x(': '), s('Moieez ur Rehman'), x(',')],
  [x('  '), p('role'), x(': '), s('Senior Full Stack Engineer & Software Architect'), x(',')],
  [x('  '), p('experience'), x(': '), ['n', String(years)], x(', '), ['c', '// years']],
  [x('  '), p('based'), x(': '), s('Saudi Arabia'), x(',')],
  [x('  '), p('stack'), x(': {')],
  [x('    '), p('frontend'), x(': '), ...list(['React', 'Next.js', 'Vue', 'Nuxt']), x(',')],
  [x('    '), p('backend'), x(': '), ...list(['Node.js', 'NestJS', 'Laravel']), x(',')],
  [x('    '), p('data'), x(': '), ...list(['PostgreSQL', 'Prisma', 'Redis']), x(',')],
  [x('  },')],
  [x('  '), p('architects'), x(': '), ...list(['Event-driven systems', 'Data access layers', 'Auth & RBAC']), x(',')],
  [x('  '), p('ships'), x(': '), ...list(['POS', 'Loyalty', 'Wallets', 'Payments', 'AI search']), x(',')],
  [x('  '), p('ownsFeatures'), x(': '), k('true'), x(',')],
  [x('  '), p('availableForHire'), x(': '), k('true'), x(',')],
  [x('};')],
];

/** Xcode-styled code window that "types" itself in when scrolled into view. */
const CodeWindow = () => {
  const lines = buildLines(getExperienceYears());
  const ref = useRef(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(lines.length);
      return undefined;
    }
    let timer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let n = 0;
        timer = setInterval(() => {
          n += 1;
          setShown(n);
          if (n >= lines.length) clearInterval(timer);
        }, 110);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [lines.length]);

  return (
    <div ref={ref}>
      <WindowChrome title="engineer.ts">
        <pre className="code-window overflow-x-auto p-5 md:p-7 text-[13px] md:text-[14px] leading-[1.75] font-mono" dir="ltr">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex" style={{ visibility: i < shown ? 'visible' : 'hidden' }}>
                <span className="select-none w-8 shrink-0 text-end pe-4 tok-ln">{i + 1}</span>
                <span className="whitespace-pre">
                  {line.map(([cls, text], j) => (
                    <span key={j} className={`tok-${cls}`}>
                      {text}
                    </span>
                  ))}
                  {i === Math.min(shown, lines.length) - 1 && <span className="code-caret" aria-hidden />}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </WindowChrome>
    </div>
  );
};

export default CodeWindow;
