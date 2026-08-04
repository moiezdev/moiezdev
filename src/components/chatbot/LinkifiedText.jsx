const overlaps = (a, b) => a.start < b.end && b.start < a.end;

/**
 * Turn emails, phones, URLs, and in-app nav spans into clickable nodes.
 * `spans` come from prepareBotReply (project titles + [[nav]] markers).
 * Emails / phones / URLs win over nav keywords (e.g. "moiezdev" inside an address).
 */
export function linkifyToNodes(text = '', { spans = [], onNavigate } = {}) {
  const input = String(text);
  if (!input) return null;

  const regions = [];

  const pattern =
    /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|(?:github|linkedin|wa\.me)\.com\/[^\s<>"']+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+\d[\d\s()-]{6,}\d|\b\d{3}[\s-]\d{3}[\s-]?\d{4,}\b)/gi;

  let match;
  while ((match = pattern.exec(input)) !== null) {
    let raw = match[0];
    let end = match.index + raw.length;
    while (/[),.;:!?]$/.test(raw)) {
      raw = raw.slice(0, -1);
      end -= 1;
    }
    const start = match.index;
    const href = toHref(raw);
    if (!href) continue;
    const region = { start, end, kind: 'ext', href };
    if (regions.some((r) => overlaps(r, region))) continue;
    regions.push(region);
  }

  for (const span of spans) {
    if (span.end > input.length || span.start >= input.length) continue;
    const region = {
      start: span.start,
      end: Math.min(span.end, input.length),
      kind: 'nav',
      to: span.to,
    };
    if (regions.some((r) => overlaps(r, region))) continue;
    regions.push(region);
  }

  regions.sort((a, b) => a.start - b.start);

  const nodes = [];
  let last = 0;
  let key = 0;

  for (const region of regions) {
    if (region.start < last) continue;
    if (region.start > last) nodes.push(input.slice(last, region.start));

    const label = input.slice(region.start, region.end);

    if (region.kind === 'nav') {
      nodes.push(
        <button
          key={`n-${key++}`}
          type="button"
          className="text-primary underline underline-offset-2 hover:opacity-80 cursor-scale-0 inline p-0 m-0 bg-transparent border-0 font-inherit text-inherit"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(region.to);
          }}
        >
          {label}
        </button>,
      );
    } else {
      const external = region.href.startsWith('http');
      nodes.push(
        <a
          key={`e-${key++}`}
          href={region.href}
          className="text-primary underline underline-offset-2 hover:opacity-80 break-all cursor-scale-0"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          onClick={(e) => {
            e.stopPropagation();
            // mailto:/tel: can be swallowed by SPA click handlers — open explicitly
            if (/^(mailto|tel):/i.test(region.href)) {
              e.preventDefault();
              window.location.href = region.href;
            }
          }}
        >
          {label}
        </a>,
      );
    }

    last = region.end;
  }

  if (last < input.length) nodes.push(input.slice(last));
  return nodes;
}

function toHref(raw) {
  const value = raw.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/^(github|linkedin|wa\.me)\.com\//i.test(value)) return `https://${value}`;
  if (/@/.test(value) && /\.[a-z]{2,}$/i.test(value)) return `mailto:${value}`;

  if (/^[\d+\s()-]+$/.test(value)) {
    const digits = value.replace(/[^\d+]/g, '');
    if (digits.replace(/\D/g, '').length >= 8) return `tel:${digits}`;
  }
  return null;
}

export default function LinkifiedText({ text, spans, onNavigate, className = '' }) {
  return (
    <span className={className}>{linkifyToNodes(text, { spans, onNavigate })}</span>
  );
}
