import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    projects: [

        {
            id: 'twlm-pos',
            title: "TWLM - POS",
            subtitle: "Point of Sale System with Loyalty & Wallet Integrations",
            description:
                [
                    "TWLM - POS – Comprehensive Point of Sale System",
                    [
                        "A comprehensive Point of Sale (POS) system focused on enhancing customer experience, loyalty engagement, and business growth through modern UI/UX, loyalty systems, and wallet integrations.",
                        "Improved the overall UI/UX, making features more intuitive and user-friendly, which reduced support center requests by approximately 70%.",
                        "Designed and developed loyalty program features including a Loyalty Points System, Loyalty Cards, a Gift Card System with Apple Wallet and Google Wallet integration, and real-time notification support.",
                        "Built a centralized promotional messaging system with Apple Wallet loyalty passes, smart geo-location targeting, and branch-based tracking and visibility.",
                        "Developed a dynamic Page Builder and a Flutter-based mobile application that allows businesses to create customizable storefront pages and enables customers to place orders online easily.",
                        "Optimized backend APIs, reducing latency by approximately 64% and improving system performance.",
                        "Refactored a large portion of the codebase—improved code structure and maintainability, eliminated side effects caused by rapid development, and enhanced overall application stability.",
                    ]
                ],
            technologies: ["React.js", "Flutter", "Nest.js", "Fastify", "Node.js", "Apple Wallet", "Google Wallet", "REST APIs", "Zustand", "TanStack Query"],
            imageUrl: "/projects-media/twlm-pos/main.webp",
            projectUrl: "https://twlm.solutions",
            githubUrl: "https://github.com/Twlm-App/twlm-solutions",
            githubBackendUrl: "https://github.com/Twlm-App/twlm-solutions-backend",
            media: ['main.webp', 'img1.webp', 'img2.webp']
        },
        {
            id: 'eims',
            title: "EIMS (Backend)",
            subtitle: "Learning Management System FullStack (Under Development)",
            description:
                [
                    "EIMS – Educational Institutes Management System",
                    [
                        "This is my own project to make learning easier online, with features like dashboards, progress tracking, and track records of learners.",
                        "Working on microsoft entity framework to make the backend more robust and scalable.",
                    ]
                ],
            technologies: ["ASP.NET Core", "C#", "Entity Framework", "PostgreSQL Server"],
            imageUrl: "/projects-media/eims/main.webp",
            githubUrl: "https://github.com/moiezdev/EIMS.WebAPI",
            media: ['main.webp']
        },
        {
            id: 'lms',
            title: "LMS",
            subtitle: "Learning Management System FullStack (Under Development)",
            description:
                [
                    "LMS – Learning Management System",
                    [
                        "This is my own project to make learning easier online, with features like quizzes, dashboards, and progress tracking.",
                        "The interface is simple and works well on both desktop and mobile, so learners can use it anywhere.",
                        "Added interactive parts so users can see their progress and navigate courses without confusion.",
                        "Tried to keep everything fast and clean so it doesn’t feel slow even with lots of content.",
                        "Connected it with backend stuff like Node and MongoDB to save and manage all the data smoothly."
                    ]
                ],
            technologies: ["HTML", "SCSS", "JavaScript", "React", "Redux Toolkit", "Node.js", "Express", "MongoDB"],
            imageUrl: "/projects-media/lms/main.webp",
            githubUrl: "https://github.com/moiezdev/LMS",
            media: ['main.webp']
        },
        {
            id: 'my-portfolio',
            title: "Portfolio Website",
            subtitle: "My Personal Portfolio",
            description:
                [
                    "MoezDev – Personal Portfolio Website",
                    [
                        "Built my personal portfolio from scratch to showcase my projects, skills, and experience as a frontend developer.",
                        "Focused on creating a clean, responsive, and intuitive design that works smoothly on both desktop and mobile devices.",
                        "Added interactive elements like project previews and smooth animations to make the site feel dynamic and engaging.",
                        "Optimized the website for fast loading and a seamless user experience, keeping performance and accessibility in mind.",
                        "Worked closely on the overall look and feel, making sure the design reflects my personal style and professional brand."
                    ]
                ],
            technologies: ["React", "TailwindCSS", "JavaScript", "Redux Toolkit"],
            imageUrl: "/projects-media/portfolio/main.webp",
            projectUrl: "http://moiezdev.com",
            githubUrl: "https://github.com/moiezdev/my-portfolio-react",
            media: ['main.webp']
        },
        {
            id: 'scmborba',
            title: "Scmborba",
            subtitle: "Social Services Website",
            description:
                [
                    "Santa Casa da Misericórdia de Borba – Institutional Website",
                    [
                        "Contributed as a Frontend Developer, focusing on UI/UX improvements and Vue.js development.",
                        "Translated complex design requirements into a clean, responsive, and accessible user interface.",
                        "Implemented dynamic components in Vue.js to enhance site navigation and user engagement.",
                        "Collaborated with the team to modernize the visual identity of a non-profit social services institution, ensuring the platform clearly communicates its mission, services, and community initiatives.",
                        "Optimized performance and usability for a wide audience, including elderly users and families seeking social support."
                    ]
                ],
            technologies: ["React", "TailwindCSS", "JavaScript", "Redux Toolkit"],
            imageUrl: "/projects-media/scmborba/main.webp",
            projectUrl: "http://scmborba.pt",
            media: ['main.webp', 'img1.webp', 'img2.webp', 'img3.webp', 'img4.webp']
        },
        {
            id: 'aa-tourism',
            title: "AATourism",
            subtitle: "Flight Booking Platform",
            description:
                [
                    "AA Tourism – Flight Booking Platform",
                    [
                        "A site to search and book flights easily using Sabre and Amadeus APIs.",
                        "Built the frontend with Nuxt 2, Vuex, Buefy, and Bootstrap, with small animations here and there to make it feel alive.",
                        "Forms, flight lists, and booking steps are interactive but simple, so users don’t get lost.",
                        "The site works smoothly on both mobile and desktop, even with real-time flight data from the APIs.",
                        "Kept the visuals clean and consistent with the brand colors and style."
                    ]
                ],
            technologies: ["Nuxt 2", "Vuex", "Buefy", "Bootstrap 5", "JavaScript", "SCSS", "Sabre", "Amadeus"],
            imageUrl: "/projects-media/aa-tourism/main.webp",
            projectUrl: "http://aatourism.ca/",
            githubUrl: "https://github.com/moiezdev/AAtourism",
            media: ['main.webp', 'img1.webp', 'img2.webp', 'img3.webp', 'img4.webp']
        },
        {
            id: 'docean-fisheries',
            title: "D’Ocean Fisheries",
            subtitle: "Seafood Supplier Website",
            description:
                [
                    "D’Ocean Fisheries – Seafood Supplier Website",
                    [
                        "Created a fresh and simple frontend so customers can easily explore different seafood categories like live, frozen, and fillets.",
                        "Designed the pages to be responsive, so everything looks clean and easy to use on both desktop and mobile screens.",
                        "Added product sections with quick links and quote/contact forms to make browsing and inquiries straightforward.",
                        "Focused on clear visuals, spacing, and smooth navigation so the site feels professional without being overwhelming.",
                        "Worked with imagery, colors, and layout to reflect the brand identity of a seafood supplier."
                    ]
                ],
            technologies: ["HTML", "CSS", "JavaScript"],
            imageUrl: "/projects-media/docean-fisheries/main.webp",
            projectUrl: "https://doceanfisheries.com/",
            media: ['main.webp']
        },
        {
            id: 'gala-travels',
            title: "Gala Travels",
            subtitle: "Flight Booking Platform",
            description:
                [
                    "Gala Travels – Flight Booking Platform",
                    [
                        "A platform for booking flights using Sabre API, with a smooth and simple user experience.",
                        "Frontend built with Vue/Nuxt 2, Buefy, Bootstrap, and subtle animations to make interactions more engaging.",
                        "Interactive booking forms, flight listings, and itinerary views are designed to be easy to use.",
                        "The site adapts nicely to mobile and desktop screens, handling API data seamlessly.",
                        "Worked on keeping the visuals consistent with the brand and making the interface approachable."
                    ]
                ],
            technologies: ["Nuxt 2", "Vue", "Buefy", "Bootstrap 5", "JavaScript", "SCSS", "Sabre"],
            imageUrl: "/projects-media/gala-travels/main.webp",
            githubUrl: "https://github.com/moiezdev/gala-saber",
            media: ['main.webp', 'img1.webp']
        },
        {
            id: 'mian-travels',
            title: "Mian's Travels",
            subtitle: "Flight Booking Platform",
            description:
                [
                    "Mian's Travels – Flight Booking Platform",
                    [
                        "A flight booking site using Sabre API, made to feel simple and intuitive for users.",
                        "Frontend made with Nuxt 2, Vue, Buefy, Bootstrap, including small animations for better interactions.",
                        "Booking forms, flight searches, and listings are straightforward and easy to navigate.",
                        "Works well on mobile and desktop, fetching data from Sabre API without any hiccups.",
                        "Focused on keeping the design clean, readable, and consistent with the brand style."
                    ]
                ],
            technologies: ["Nuxt 2", "Vue", "Buefy", "Bootstrap 5", "JavaScript", "SCSS", "Sabre"],
            imageUrl: "/projects-media/mian-travels/main.webp",
            githubUrl: "https://github.com/moiezdev/MiansTravels",
            media: ['main.webp', 'img1.webp']
        },
        {
            id: 'ain-saas',
            title: "Ain Saas",
            subtitle: "Ecommerce Website",
            description:
                [
                    "Ain Saiss – Water Utility / Institutional Website",
                    [
                        "Made a simple and modern frontend to show the services and info clearly.",
                        "Works on desktops and phones, and everything adjusts nicely depending on screen size.",
                        "Added small interactive bits like menus and cards to make browsing a little more fun.",
                        "Tried to keep it fast and easy to use for everyone, including people who use assistive tech.",
                        "Worked with the team to keep colors, fonts, and visuals consistent with the brand."
                    ]
                ],
            technologies: ["HTML", "SCSS", "JavaScript"],
            imageUrl: "/projects-media/ain-saas/main.webp",
            projectUrl: "https://ain-saiss.ma",
            media: ['main.webp', 'img1.webp', 'img2.webp', 'img3.webp']
        },
        {
            id: 'city-arrivals',
            title: "City Arrivals",
            subtitle: "Luxry Car Rental",
            description:
                [
                    "City Arrivals – Airport Transfer & Limousine Service Website",
                    [
                        "Served as a Frontend Developer, specializing in creating a seamless and user-friendly booking experience.",
                        "Developed responsive layouts to ensure optimal performance across various devices, enhancing user engagement.",
                        "Integrated real-time booking functionalities, allowing users to easily schedule and manage their rides.",
                        "Collaborated with the design team to maintain brand consistency and ensure a visually appealing interface.",
                        "Employed best practices in web development to ensure fast load times and smooth navigation."
                    ]
                ],
            technologies: ["Html", "SCSS", "JavaScript", "Jquery"],
            imageUrl: "/projects-media/city-arrivals/main.webp",
            projectUrl: "https://cityarrivals.ca",
            media: ['main.webp', 'img1.webp', 'img2.webp']
        },
        {
            id: 'mtlnation',
            title: "MTLnation",
            subtitle: "Vue.js Based Website",
            description:
                [
                    "MTLnation – Vue.js Web Platform",
                    [
                        "Built the site using Vue.js with a focus on keeping everything fast and responsive.",
                        "Structured the pages as reusable Vue components, so it’s easier to maintain and extend later.",
                        "Added dynamic sections like news, events, and media content with smooth transitions and animations.",
                        "Integrated forms and interactive parts so users can connect, subscribe, or explore content without issues.",
                        "Kept the design clean with consistent colors, fonts, and spacing to match the brand’s modern look."
                    ]
                ],
            technologies: ["Vue.js", "JavaScript", "SCSS", "Bootstrap"],
            imageUrl: "/projects-media/mtlnation/main.webp",
            projectUrl: "https://mtlnation.com",
            media: ['main.webp']
        },
        {
            id: 'tdm',
            title: "TDM",
            subtitle: "Civil Engineering & Project Management Website",
            description:
                [
                    "TDM – Engenharia & Gestão de Projetos",
                    [
                        "Developed the frontend for TDM’s corporate website, presenting the company’s civil engineering and project management services.",
                        "Structured clear sections for services, projects, and contact, so visitors quickly understand what TDM offers.",
                        "Made the site responsive, adapting well across desktop and mobile devices.",
                        "Used a clean and professional design approach to reflect TDM’s reliability and technical expertise.",
                        "Focused on keeping the site simple to navigate while aligning visuals with the company’s brand identity."
                    ]
                ],
            technologies: ["HTML", "CSS", "JavaScript"],
            imageUrl: "/projects-media/tdm/main.webp",
            githubUrl: "https://github.com/moiezdev/tdm",
            media: ['main.webp', "img1.webp", "img2.webp", "img3.webp", "img4.webp"]
        },
        {
            id: 'joshua-portfolio',
            title: "Joshua Portfolio",
            subtitle: "Personal Portfolio Website",
            description:
                [
                    "Joshua – Developer Portfolio (React.js)",
                    [
                        "Built a modern and responsive personal portfolio site for Joshua using React.js.",
                        "Structured the site with reusable components to keep it easy to maintain and extend later.",
                        "Added sections like About, Projects, and Contact, making the content flow simple and clear.",
                        "Included smooth animations and transitions so the site feels more dynamic and engaging.",
                        "Kept the design minimal and professional, highlighting Joshua’s skills and experience as a developer."
                    ]
                ],
            technologies: ["React.js", "JavaScript", "CSS", "Bootstrap"],
            imageUrl: "/projects-media/joshua-portfolio/main.webp",
            projectUrl: "https://joshua-portfolio.com", // replace with real link
            githubUrl: "https://github.com/moiezdev/joshua-portfolio",
            media: ['main.webp']
        },
    ],
};

const projectsSlice = createSlice({
    name: "projects",
    initialState,
    reducers: {},
});

export default projectsSlice.reducer;