import Button from '../../ui/Button';
import SectionTitle from '../../ui/SectionTitle';
import { ThemeProvider, FloatingLabel, createTheme } from 'flowbite-react';
import { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import Loading from '../../Loading';
import Floating from '../../ui/Floating';
import { contacts } from '../../../data';

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
      className="absolute top-0 right-0 text-white h-full flex items-center justify-center aspect-square hover:bg-red-700/20"
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
  const input = createTheme({
    input: {
      default: {
        outlined: {
          sm: 'border border-gray-a text-normal focus:outline-none focus:ring-0 text-white focus:border-primary rounded-none',
          md: 'border border-gray-a text-normal focus:outline-none focus:ring-0 text-white focus:border-primary rounded-none',
        },
      },
    },
    label: {
      default: {
        outlined: {
          sm: 'peer-focus:text-primary peer-focus:bg-gray-b peer-placeholder-shown:bg-gray-b bg-gray-b dark:bg-transparent text-gray-a text-normal ',
          md: 'peer-focus:text-primary peer-focus:bg-gray-b peer-placeholder-shown:bg-gray-b bg-gray-b dark:bg-transparent text-gray-a text-normal ',
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
          <p className="my-6 cursor-pointer cursor-white cursor-scale-1.2">
            Currently available for hire as a product-focused full stack software engineer. I enjoy
            building reliable digital products — from polished interfaces to solid backend systems.
            Whether you have a role, a project, or a question, I’d be glad to hear from you.
          </p>
          <div>
            <Floating>
              <div className="border border-gray-a inline-flex flex-col gap-4 p-[16px]">
                <h3>Message Me Directly</h3>
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
              className="max-w-md w-full relative"
            >
              {loading && (
                <div className="w-full h-full absolute top-0 left-0 right-0 bottom-0 z-20">
                  <Loading message="Sending..." height="h-full" />
                </div>
              )}
              {error && (
                <Error
                  setError={setError}
                  message={errorMessage || 'Something went wrong! Please try again.'}
                />
              )}
              <div className="flex flex-col gap-4">
                <input type="hidden" name="time" defaultValue={formattedDate(new Date())} />
                <FloatingLabel
                  required
                  name="name"
                  theme={input}
                  variant="outlined"
                  label="Your Name"
                />
                <FloatingLabel
                  required
                  name="email"
                  theme={input}
                  variant="outlined"
                  label="Your Email"
                  type="email"
                />
                <FloatingLabel
                  required
                  name="subject"
                  theme={input}
                  variant="outlined"
                  label="Subject"
                />
                <div className="relative">
                  <textarea
                    required
                    id="contactMessage"
                    name="message"
                    className="peer block w-full h-50 p-3 appearance-none border bg-transparent px-2.5 pb-2.5 pt-4 text-sm focus:outline-none focus:ring-0 border-gray-a text-white focus:border-primary rounded-none"
                    placeholder=" "
                  ></textarea>
                  <label
                    htmlFor="contactMessage"
                    className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 px-2 text-sm transition-transform duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary peer-focus:bg-gray-b peer-placeholder-shown:bg-gray-b
                     bg-gray-b text-gray-a text-normal"
                  >
                    Your Message Here
                  </label>
                </div>
                <div>
                  <Button primary={true}>Send Message</Button>
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
