import Button from '../../ui/Button';
import SectionTitle from '../../ui/SectionTitle';
import { ThemeProvider, FloatingLabel, createTheme } from 'flowbite-react';
import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import Loading from '../../Loading';
import Floating from '../../ui/Floating';
import { contacts } from '../../../data';
import { useContent } from '../../../i18n/content';

const Error = ({ message, setError }) => (
  <div
    className="z-50 relative w-full flex flex-col justify-center p-4 mb-4 text-sm bg-red-800/20 text-red-800"
    role="alert"
  >
    <p className="text-white flex items-end gap-2">
      <img className="w-[20px] mb-[1px]" src="/error.svg" alt="/error" />
      {message}
    </p>
    <button
      type="button"
      className="absolute top-0 end-0 text-white h-full flex items-center justify-center aspect-square hover:bg-red-700/20"
      data-dismiss-target="#alert-2"
      aria-label="Close"
      onClick={() => setError(false)}
    >
      <svg
        aria-hidden="true"
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>
      <span className="sr-only">Close</span>
    </button>
  </div>
);

const ContactSection = () => {
  const { t } = useContent();
  const contactForm = useRef();

  // states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const sendEmail = (e) => {
    setLoading(true);
    e.preventDefault();
    console.log(contactForm.current.time);
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    console.log(SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY);

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, contactForm.current, PUBLIC_KEY).then(
      () => {
        setLoading(false);
        contactForm.current.reset();
        console.log('SUCCESS!');
      },
      (error) => {
        setLoading(false);
        setErrorMessage(error.text);
        setError(true);
        console.log('FAILED...', error.text);
      }
    );
  };
  const labelClass =
    'left-1 rtl:left-auto rtl:right-1 origin-top-left rtl:origin-top-right peer-focus:text-gray-a peer-focus:dark:text-gray-a dark:text-gray-a peer-focus:bg-gray-b peer-placeholder-shown:bg-gray-b bg-gray-b dark:bg-transparent text-gray-a text-normal text-start';
  const fieldClass =
    'border border-gray-a text-normal outline-none focus:outline-none focus:ring-0 focus:border-gray-a dark:focus:border-gray-a dark:border-gray-a text-white text-start rounded-none';

  const input = createTheme({
    input: {
      default: {
        outlined: {
          sm: fieldClass,
          md: fieldClass,
        },
      },
    },
    label: {
      default: {
        outlined: {
          sm: labelClass,
          md: labelClass,
        },
      },
    },
  });

  const formattedDate = (now) => {
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;

    const day = now.getDate();
    const month = now.getMonth() + 1; // months are 0-indexed
    const year = now.getFullYear();

    return `${hour12.toString().padStart(2, '0')}:${minutes}${ampm} || ${day}-${month}-${year}`;
  };
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col justify-between order-2 md:order-1">
          <p className="my-6 cursor-pointer cursor-white cursor-scale-1.2">{t('contact.intro')}</p>
          <div>
            <Floating>
              <div className="border border-gray-a inline-flex flex-col gap-4 p-[16px]">
                <h3>{t('contact.direct')}</h3>
                {contacts
                  .filter((contact) => contact.categories.includes('contact'))
                  .map((contact, index) => (
                    <a
                      className="flex items-center gap-2 cursor-pointer hover:text-primary"
                      href={contact.url}
                      target="_blank"
                      key={index}
                    >
                      <img width={25} src={contact.icon} alt="" />
                      {contact.handle}
                    </a>
                  ))}
              </div>
            </Floating>
          </div>
        </div>
        <div className="relative order-1 md:order-2 flex justify-center md:justify-end">
          <ThemeProvider theme={input}>
            <form
              action=""
              ref={contactForm}
              onSubmit={sendEmail}
              className="contact-form max-w-md w-full relative"
            >
              {loading && (
                <div className="w-full h-full absolute top-0 start-0 end-0 bottom-0 z-20">
                  <Loading message={t('contact.sending')} height="h-full" />
                </div>
              )}
              {error && <Error setError={setError} message={errorMessage || t('contact.fail')} />}
              <div className="flex flex-col gap-4">
                <input type="hidden" name="time" defaultValue={formattedDate(new Date())} />
                <FloatingLabel
                  required
                  name="name"
                  theme={input}
                  variant="outlined"
                  label={t('contact.name')}
                />
                <FloatingLabel
                  required
                  name="email"
                  theme={input}
                  variant="outlined"
                  label={t('contact.email')}
                  type="email"
                />
                <FloatingLabel
                  required
                  name="subject"
                  theme={input}
                  variant="outlined"
                  label={t('contact.subject')}
                />
                <div className="relative">
                  <textarea
                    required
                    id="contactMessage"
                    name="message"
                    className="peer block w-full h-50 p-3 appearance-none border bg-transparent px-2.5 pb-2.5 pt-4 text-sm outline-none focus:outline-none focus:ring-0 focus:border-gray-a dark:focus:border-gray-a border-gray-a text-white text-start rounded-none"
                    placeholder=" "
                  ></textarea>
                  <label
                    htmlFor="contactMessage"
                    className="absolute left-1 rtl:left-auto rtl:right-1 top-2 z-10 origin-top-left rtl:origin-top-right -translate-y-4 scale-75 px-2 text-sm text-start transition-transform duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-gray-a peer-focus:dark:text-gray-a peer-focus:bg-gray-b peer-placeholder-shown:bg-gray-b
                     bg-gray-b text-gray-a text-normal"
                  >
                    {t('contact.message')}
                  </label>
                </div>
                <div>
                  <Button primary={true}>{t('contact.send')}</Button>
                </div>
              </div>
            </form>
          </ThemeProvider>
        </div>
      </div>
    </>
  );
};

export default ContactSection;
