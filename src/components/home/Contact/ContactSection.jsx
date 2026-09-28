import { useEffect, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import Button from '../../ui/Button';
import Reveal from '../../ui/Reveal';
import { Chevron } from '../../ui/SectionTitle';
import { Spinner } from '../../Loading';
import { contacts } from '../../../data';
import { useContent } from '../../../i18n/content';

const formattedDate = (now) => {
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes}${ampm} || ${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
};

const Field = ({ name, label, type = 'text', multiline = false }) => {
  const id = `contact-${name}`;
  return (
    <div className="field">
      {multiline ? (
        <textarea id={id} name={name} required placeholder=" " />
      ) : (
        <input id={id} name={name} type={type} required placeholder=" " autoComplete={name === 'subject' ? 'off' : name} />
      )}
      <label htmlFor={id}>{label}</label>
    </div>
  );
};

/** Live local time in Riyadh, ticking once a minute. */
const RiyadhTime = ({ lang }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    timeZone: 'Asia/Riyadh',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);
};

const ContactSection = () => {
  const { t, lang } = useContent();
  const formRef = useRef();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('');

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus('sending');
    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      )
      .then(
        () => {
          formRef.current.reset();
          setStatus('sent');
        },
        (error) => {
          setErrorMessage(error?.text || '');
          setStatus('error');
        },
      );
  };

  const direct = contacts.filter((c) => c.categories.includes('contact') || c.platform === 'GitHub');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Reveal className="flex flex-col gap-6">
        <p className="text-[17px] leading-[1.6] text-label-2">{t('contact.intro')}</p>

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
                    <img src={contact.icon} alt="" className="w-[17px] h-[17px] brightness-0 opacity-75 dark:invert" />
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

      <Reveal delay={100}>
        <form ref={formRef} onSubmit={sendEmail} className="surface p-6 md:p-8 flex flex-col gap-4 relative">
          <input type="hidden" name="time" defaultValue={formattedDate(new Date())} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label={t('contact.name')} />
            <Field name="email" type="email" label={t('contact.email')} />
          </div>
          <Field name="subject" label={t('contact.subject')} />
          <Field name="message" label={t('contact.message')} multiline />

          {status === 'error' && (
            <p role="alert" className="rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger text-[14px] px-4 py-3">
              {errorMessage || t('contact.fail')}
            </p>
          )}
          {status === 'sent' && (
            <p role="status" className="rounded-xl bg-[color-mix(in_srgb,var(--color-green)_12%,transparent)] text-green text-[14px] px-4 py-3">
              {t('contact.sent')}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" primary size="lg" disabled={status === 'sending'}>
              {status === 'sending' ? (
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
      </Reveal>
    </div>
  );
};

export default ContactSection;
