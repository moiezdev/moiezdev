import { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import Button from '../../ui/Button';
import Reveal from '../../../motion/Reveal';
import { Chevron } from '../../ui/SectionTitle';
import { Spinner } from '../../Loading';
import { contacts } from '../../../data';
import site from '../../../data/site.json';
import { useContent } from '../../../i18n/content';

const FIELDS = ['name', 'email', 'subject', 'message'];
// Bots fill every field they find; people never see this one. Its value is
// never sent to EmailJS, so the template only ever receives the real fields.
const HONEYPOT = 'website';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const formattedDate = (now) => {
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes}${ampm} || ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
};

/** Returns the i18n key of the field's error, or '' when it is valid. */
const validateField = (name, value = '') => {
  const v = String(value).trim();
  if (!v) return `contact.errors.${name}`;
  if (name === 'email' && !EMAIL_RE.test(v)) return 'contact.errors.emailInvalid';
  return '';
};

const Field = ({ name, label, error, type = 'text', multiline = false }) => {
  const id = `contact-${name}`;
  const errorId = `${id}-error`;
  const a11y = {
    id,
    name,
    required: true,
    placeholder: ' ',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  };
  return (
    <div className="field">
      {multiline ? (
        <div className={`field-area ${error ? '!border-danger' : ''}`}>
          <textarea {...a11y} />
        </div>
      ) : (
        <input
          {...a11y}
          type={type}
          autoComplete={name === 'subject' ? 'off' : name}
          className={error ? '!border-danger' : ''}
        />
      )}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p id={errorId} className="mt-1.5 px-1 text-[13px] leading-[1.4] text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

/** Live local time in Riyadh, ticking once a minute. */
const RiyadhTime = ({ lang }) => {
  // null until mounted: the time at build would be wrong (and break hydration)
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  if (!now) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
};

const CheckIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-[17px] h-[17px]" viewBox="0 0 20 20" fill="none" aria-hidden>
    <rect x="3" y="4.5" width="14" height="12.5" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 8.5h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ContactSection = () => {
  const { t, lang } = useContent();
  const formRef = useRef(null);
  const sentRef = useRef(null);
  const failRef = useRef(null);
  const busy = useRef(false); // blocks a second submit before React re-renders
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const focusAfter = useRef(null); // 'sent' | 'error' | 'form'

  useEffect(() => {
    const target = focusAfter.current;
    if (!target) return;
    focusAfter.current = null;
    if (target === 'sent') sentRef.current?.focus();
    else if (target === 'error') failRef.current?.focus();
    else formRef.current?.elements.name?.focus();
  }, [status]);

  const finish = (next) => {
    busy.current = false;
    focusAfter.current = next;
    setStatus(next);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    if (!attempted || !FIELDS.includes(name)) return;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    if (busy.current) return;
    const form = formRef.current;
    const data = Object.fromEntries(new FormData(form));

    const nextErrors = Object.fromEntries(FIELDS.map((f) => [f, validateField(f, data[f])]));
    setAttempted(true);
    setErrors(nextErrors);
    const firstInvalid = FIELDS.find((f) => nextErrors[f]);
    if (firstInvalid) {
      form.elements[firstInvalid].focus();
      return;
    }

    busy.current = true;
    setStatus('sending');

    const trap = data[HONEYPOT];
    delete data[HONEYPOT];
    if (trap) {
      // a bot filled the hidden field: look like it worked, send nothing
      setTimeout(() => finish('sent'), 700);
      return;
    }

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        { ...data, time: formattedDate(new Date()) }, // sent time, not page-load time
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY },
      );
      finish('sent');
    } catch {
      finish('error');
    }
  };

  const reset = () => {
    setErrors({});
    setAttempted(false);
    focusAfter.current = 'form';
    setStatus('idle');
  };

  const direct = contacts.filter((c) => c.categories.includes('contact') || c.platform === 'GitHub');
  const sending = status === 'sending';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Reveal className="flex flex-col gap-6">
        <p className="text-[17px] leading-[1.6] text-label-2">{t('contact.intro')}</p>

        {/* TODO(moiez): hidden until site.calendlyUrl is set in src/data/site.json */}
        {site.calendlyUrl && (
          <Button href={site.calendlyUrl} className="self-start">
            <CalendarIcon />
            {t('contact.bookCall')}
          </Button>
        )}

        <dl className="grid grid-cols-3 surface !rounded-[20px] divide-x divide-separator">
          <div className="p-4">
            <dt className="text-[12px] text-label-3">{t('contact.status')}</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-[14px] font-medium text-label">
              <span className="relative flex size-2 shrink-0" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-green opacity-60 animate-ping motion-reduce:hidden" />
                <span className="relative size-2 rounded-full bg-green" />
              </span>
              {t('contact.available')}
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-[12px] text-label-3">{t('contact.localTime')}</dt>
            <dd className="mt-1 text-[14px] font-medium text-label tabular-nums">
              <RiyadhTime lang={lang} />
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-[12px] text-label-3">{t('contact.replies')}</dt>
            <dd className="mt-1 text-[14px] font-medium text-label">{t('contact.replyTime')}</dd>
          </div>
        </dl>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-label-3 mb-2 px-1">
            {t('contact.direct')}
          </p>
          <ul className="surface overflow-hidden !rounded-[20px]">
            {direct.map((contact, i) => (
              <li key={contact.platform}>
                <a
                  href={contact.url}
                  target={contact.url.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3.5 ps-4 hover:bg-fill transition-colors"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-fill">
                    <img src={contact.icon} alt="" loading="lazy" decoding="async" className="w-[17px] h-[17px] brightness-0 opacity-75 dark:invert" />
                  </span>
                  <span
                    className={`flex flex-1 min-w-0 items-center justify-between gap-3 py-3.5 pe-4 ${
                      i < direct.length - 1 ? 'border-b border-separator' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] text-label">{contact.platform}</span>
                      <span className="block text-[13px] text-label-2 truncate" dir="ltr">
                        {contact.handle}
                      </span>
                    </span>
                    <Chevron className="w-3 h-3 text-label-3 shrink-0" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={100} className="surface self-start p-6 md:p-8 relative">
        {status === 'sent' ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-green)_16%,transparent)] text-green">
              <CheckIcon />
            </span>
            <h3 ref={sentRef} tabIndex={-1} className="text-[21px] font-semibold tracking-[-0.01em] text-label outline-none">
              {t('contact.sentTitle')}
            </h3>
            <p className="max-w-sm text-[15px] leading-[1.55] text-label-2" role="status">
              {t('contact.sent')}
            </p>
            <Button className="mt-2" onClick={reset}>
              {t('contact.sendAnother')}
            </Button>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={sendEmail}
            onChange={onChange}
            noValidate
            aria-busy={sending || undefined}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label={t('contact.name')} error={errors.name && t(errors.name)} />
              <Field name="email" type="email" label={t('contact.email')} error={errors.email && t(errors.email)} />
            </div>
            <Field name="subject" label={t('contact.subject')} error={errors.subject && t(errors.subject)} />
            <Field name="message" label={t('contact.message')} error={errors.message && t(errors.message)} multiline />

            {/* honeypot: visually hidden, hidden from assistive tech, never focusable */}
            <div aria-hidden="true" className="sr-only">
              <label htmlFor={`contact-${HONEYPOT}`}>{t('contact.honeypot')}</label>
              <input id={`contact-${HONEYPOT}`} type="text" name={HONEYPOT} tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>

            <div aria-live="polite">
              {status === 'error' && (
                <p
                  ref={failRef}
                  tabIndex={-1}
                  className="rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger text-[14px] leading-[1.5] px-4 py-3 outline-none"
                >
                  {t('contact.fail')}{' '}
                  <a href="mailto:moiezdev@gmail.com" className="font-medium underline underline-offset-2" dir="ltr">
                    moiezdev@gmail.com
                  </a>
                  .
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" primary size="lg" disabled={sending}>
                {sending ? (
                  <>
                    <Spinner size={16} />
                    {t('contact.sending')}
                  </>
                ) : (
                  t('contact.send')
                )}
              </Button>
            </div>
          </form>
        )}
      </Reveal>
    </div>
  );
};

export default ContactSection;
