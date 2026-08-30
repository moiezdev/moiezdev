import { contacts } from '../data';

const Footer = () => {
  return (
    <footer className="relative w-full border-t border-t-gray-300/20  px-4 py-6 mt-12 z-0">
      <div className="app-container mx-auto text-sm text-gray-500">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <div>
            <p>
              <span className="text-white mr-5">Moiz</span>
              <a className="cursor-pointer hover:text-primary" href="mailto:moiezdev@gmail.com">
                moiezdev@gmail.com
              </a>
            </p>
            <p className="text-white">Senior Full Stack Software Engineer</p>
          </div>
          <div>
            <h1 className="text-large text-white">Media</h1>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 mt-2">
              {contacts.map((contact, index) => {
                if (contact.icon && contact.categories.includes('media')) {
                  return (
                    <a
                      className="cursor-pointer"
                      href={contact.url}
                      target="_blank"
                      key={index}
                      rel="noopener noreferrer"
                    >
                      <img src={contact.icon} alt={contact.platform} />
                    </a>
                  );
                } else {
                  return;
                }
              })}
            </div>
          </div>
        </div>
        <div className=" text-center ">
          &copy; {new Date().getFullYear()} Moizdev. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
