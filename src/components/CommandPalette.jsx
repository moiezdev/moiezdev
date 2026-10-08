import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DUR } from '../motion/tokens';
import { prefersReducedMotion } from '../motion/reducedMotion';
import { useNavigate } from 'react-router-dom';
import { contacts } from '../data';
import { usePreferences } from '../context/Preferences';
import { useContent } from '../i18n/content';
import site from '../data/site.json';
import { transitionLang, transitionTheme } from '../motion/prefsTransitions';

const Icon = ({ d }) => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const ICONS = {
  page: 'M4 3.5h8l4 4v9H4z M12 3.5v4h4',
  project: 'M3 5.5h14v10H3z M3 8.5h14',
  action: 'M11 2.5 4.5 11H10l-1 6.5L15.5 9H10z',
  link: 'M8 12l4-4 M6.5 9.5 4.8 11.2a2.5 2.5 0 0 0 3.5 3.5L10 13 M13.5 10.5l1.7-1.7a2.5 2.5 0 0 0-3.5-3.5L10 7',
};

/** Spotlight-style command palette. Opens with ⌘K / Ctrl+K. */
const CommandPalette = () => {
  const [open, setOpenState] = useState(false);
  const [closing, setClosing] = useState(false);
  const openRef = useRef(false);
  const closeTimer = useRef(0);
  const highlightRef = useRef(null);
  // opening is immediate; closing plays a short exit (--dur-fast) before unmounting
  const setOpen = useCallback((next) => {
    const want = typeof next === 'function' ? next(openRef.current) : next;
    clearTimeout(closeTimer.current);
    if (want) {
      openRef.current = true;
      setClosing(false);
      setOpenState(true);
      return;
    }
    if (!openRef.current) return;
    openRef.current = false;
    if (prefersReducedMotion()) {
      setOpenState(false);
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setClosing(false);
      setOpenState(false);
    }, DUR.fast);
  }, []);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme, toggleLang } = usePreferences();
  const { t, projects } = useContent();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, [setOpen]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    setCopied(false);
    const id = setTimeout(() => inputRef.current?.focus(), 30);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(id);
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = useMemo(() => {
    const go = (path) => () => navigate(path);
    const pages = [
      ['nav.home', '/'],
      ['nav.works', '/works'],
      ['nav.experience', '/experience'],
      ['nav.about', '/about'],
      ['nav.contact', '/contact'],
    ].map(([key, path]) => ({ id: `p-${path}`, group: t('cmd.pages'), type: 'page', title: t(key), run: go(path) }));

    const work = projects.map((p) => ({
      id: `w-${p.id}`,
      group: t('cmd.projects'),
      type: 'project',
      title: p.title,
      hint: p.subtitle,
      keywords: (p.technologies || []).join(' '),
      run: go(`/works/${p.id}`),
    }));

    const actions = [
      { id: 'a-twlm', title: t('cmd.twlm'), hint: 'TWLM POS · NestJS · BullMQ', run: go('/works/twlm-pos') },
      { id: 'a-theme', title: theme === 'dark' ? t('cmd.light') : t('cmd.dark'), run: () => transitionTheme(toggleTheme) },
      { id: 'a-lang', title: t('cmd.lang'), run: () => transitionLang(toggleLang) },
      {
        id: 'a-cv',
        title: t('hero.resume'),
        run: () => {
          const a = document.createElement('a');
          a.href = site.cv.url;
          a.download = site.cv.fileName;
          a.click();
        },
      },
      {
        id: 'a-whatsapp',
        title: t('cmd.whatsapp'),
        hint: contacts.find((c) => c.platform === 'WhatsApp')?.handle,
        run: () => window.open(contacts.find((c) => c.platform === 'WhatsApp')?.url, '_blank', 'noopener'),
      },
      {
        id: 'a-email',
        title: t('cmd.copyEmail'),
        hint: 'moiezdev@gmail.com',
        keep: true,
        run: () => {
          navigator.clipboard?.writeText('moiezdev@gmail.com');
          setCopied(true);
        },
      },
    ].map((a) => ({ ...a, group: t('cmd.actions'), type: 'action' }));

    const links = contacts
      .filter((c) => c.categories.includes('media'))
      .map((c) => ({
        id: `l-${c.platform}`,
        group: t('cmd.links'),
        type: 'link',
        title: c.platform,
        hint: c.handle,
        run: () => window.open(c.url, '_blank', 'noopener'),
      }));

    return [...pages, ...actions, ...work, ...links];
  }, [navigate, projects, t, theme, toggleLang, toggleTheme]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.title} ${i.hint || ''} ${i.keywords || ''}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // one highlight slides to the active row (transform), instead of each row repainting
  useLayoutEffect(() => {
    const row = listRef.current?.querySelector(`[data-index="${active}"]`);
    const hl = highlightRef.current;
    if (!hl) return;
    if (!row) {
      hl.style.opacity = '0';
      return;
    }
    hl.style.opacity = '1';
    hl.style.height = `${row.offsetHeight}px`;
    hl.style.transform = `translateY(${row.offsetTop}px)`;
  }, [active, results, open]);

  const run = (item) => {
    if (!item) return;
    item.run();
    if (!item.keep) setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') run(results[active]);
  };

  if (!open) return null;
  const state = closing ? 'closing' : 'open';

  let lastGroup = null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t('cmd.placeholder')}>
      <div className="palette-backdrop absolute inset-0 bg-black/30 backdrop-blur-[2px]" data-state={state} onClick={() => setOpen(false)} />
      <div className="palette-panel relative w-full max-w-[620px] overflow-hidden rounded-[22px] glass ring-1 ring-separator shadow-[0_32px_80px_rgba(0,0,0,0.35)]" data-state={state} onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 px-5 border-b border-separator">
          <svg className="w-5 h-5 text-label-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <circle cx="9" cy="9" r="6" />
            <path d="m13.5 13.5 4 4" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmd.placeholder')}
            className="flex-1 bg-transparent h-14 text-[19px] text-label placeholder:text-label-3 outline-none focus-visible:outline-none"
            aria-activedescendant={results[active]?.id}
          />
          <kbd className="text-[11px] font-medium text-label-3 rounded-md ring-1 ring-separator px-1.5 py-0.5">esc</kbd>
        </div>

        <ul ref={listRef} className="relative max-h-[52vh] overflow-y-auto p-2" role="listbox">
          <span ref={highlightRef} className="palette-highlight" aria-hidden />
          {results.length === 0 && <li className="px-4 py-10 text-center text-label-2">{t('cmd.empty')}</li>}
          {results.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.id}>
                {header && <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-label-3">{header}</p>}
                <button
                  type="button"
                  id={item.id}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={() => run(item)}
                  className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors duration-(--dur-fast) ${
                    index === active ? 'text-on-accent' : 'text-label'
                  }`}
                >
                  <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg ${index === active ? 'bg-[color-mix(in_srgb,var(--color-on-accent)_16%,transparent)]' : 'bg-fill text-label-2'}`}>
                    <Icon d={ICONS[item.type]} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] truncate">
                      {item.id === 'a-email' && copied ? t('cmd.copied') : item.title}
                    </span>
                    {item.hint && (
                      <span className={`block text-[12px] truncate ${index === active ? 'text-on-accent/75' : 'text-label-2'}`}>{item.hint}</span>
                    )}
                  </span>
                  {index === active && <span className="text-[12px] text-on-accent/80">↵</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-4 px-5 py-2.5 border-t border-separator text-[12px] text-label-3">
          <span>{t('cmd.footer')}</span>
          <span className="hidden sm:flex items-center gap-3">
            <span>↑↓ {t('cmd.navigate')}</span>
            <span>↵ {t('cmd.open')}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
