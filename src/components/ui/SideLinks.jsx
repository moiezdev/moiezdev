import { contacts } from '../../data';

const SideLinks = () => {
  const github = contacts.find((contact) => contact.platform === 'GitHub');
  const linkedin = contacts.find((contact) => contact.platform === 'LinkedIn');

  return (
    <div className="hidden xl:flex fixed left-[25px] top-0 flex-col justify-end items-center z-10 p-1 bg-gray-b">
      <div className="h-[200px] border border-gray-a animate-growHeight"></div>
      <div className="flex flex-col items-center mt-4 space-y-4">
        {/* GitHub */}
        <a
          href={github ? github.url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer"
        >
          <img src="/socialMediaIcons/Github.svg" alt="GitHub" />
        </a>
        {/* LinkedIn */}
        <a
          href={linkedin ? linkedin.url : '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer"
        >
          <img src="/socialMediaIcons/Linkedin.svg" alt="LinkedIn" />
        </a>
      </div>
    </div>
  );
};

export default SideLinks;
