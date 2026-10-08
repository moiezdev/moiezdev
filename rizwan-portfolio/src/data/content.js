// All site content lives here. Replace the dummy data with real data —
// no component changes needed. Image fields accept a URL or a path in /public
// (e.g. '/images/portrait.jpg'); leave empty ('') to show the neutral placeholder.

const unsplash = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const profile = {
  name: 'Rizwan Ahmed',
  shortName: 'Rizwan',
  initials: 'RA',
  role: 'Operations & Administration Manager',
  location: 'Riyadh, Saudi Arabia',
  availability: 'Open to senior operations leadership roles',
  headline: 'Operations that run quietly. Results that speak loudly.',
  intro:
    'For 12 years I have built the systems, teams and routines that let organisations scale without friction — from multi-site facilities to enterprise-wide process change.',
  portrait: '',
  heroImage: unsplash('1497366216548-37526070297c', 2400),
  cv: '#', // e.g. '/rizwan-cv.pdf'
}

export const stats = [
  { value: '12', suffix: '+', label: 'Years of experience' },
  { value: '20', suffix: '+', label: 'Projects delivered' },
  { value: '150', suffix: '+', label: 'People led across teams' },
  { value: '18', suffix: '%', label: 'Average cost reduction' },
]

export const about = {
  paragraphs: [
    'I am an operations and administration leader who believes that great organisations are built on clear processes, accountable teams and decisions grounded in data.',
    'My work spans facilities management, vendor and procurement strategy, compliance, budgeting and cross-functional project delivery. I have led operations for organisations of 80 to 1,200 employees across corporate, hospitality and logistics environments.',
    'I am at my best when bringing order to complexity — turning scattered workflows into reliable systems, and helping people do their best work.',
  ],
  competencies: [
    'Operations Strategy',
    'Process Optimisation',
    'Team Leadership',
    'Budget & Cost Control',
    'Vendor Management',
    'Facilities Management',
    'Compliance & Policy',
    'Project Delivery',
    'Procurement',
    'Change Management',
    'KPI & Reporting',
    'Event Management',
  ],
  education: [
    { title: 'MBA, Operations Management', place: 'University Name', year: '2016' },
    { title: 'BBA, Business Administration', place: 'University Name', year: '2012' },
  ],
  certifications: [
    { title: 'Project Management Professional (PMP)', place: 'PMI', year: '2019' },
    { title: 'Lean Six Sigma Green Belt', place: 'IASSC', year: '2018' },
    { title: 'Certified Facility Manager (CFM)', place: 'IFMA', year: '2021' },
  ],
}

export const experience = [
  {
    role: 'Senior Operations Manager',
    company: 'Company Name',
    location: 'Riyadh',
    period: '2021 — Present',
    summary:
      'Lead operations and administration for a 1,200-person organisation across four sites, reporting directly to the COO.',
    highlights: [
      'Cut annual operating costs by 22% through vendor consolidation and renegotiated contracts.',
      'Introduced a unified KPI dashboard used by the leadership team every week.',
      'Led a 45-person team across facilities, procurement and administration.',
    ],
  },
  {
    role: 'Operations Manager',
    company: 'Company Name',
    location: 'Dubai',
    period: '2017 — 2021',
    summary:
      'Owned day-to-day operations, facilities and procurement for a fast-growing regional business.',
    highlights: [
      'Opened and fitted out two new offices on schedule and 9% under budget.',
      'Reduced procurement cycle time from 21 to 8 days with a digital approvals workflow.',
      'Achieved ISO 9001 certification for the first time in company history.',
    ],
  },
  {
    role: 'Administration Manager',
    company: 'Company Name',
    location: 'Karachi',
    period: '2014 — 2017',
    summary:
      'Managed office administration, HR operations support and company-wide policy.',
    highlights: [
      'Rewrote the administrative policy handbook adopted across all departments.',
      'Centralised asset management, recovering 14% of untracked equipment value.',
    ],
  },
  {
    role: 'Operations Executive',
    company: 'Company Name',
    location: 'Karachi',
    period: '2012 — 2014',
    summary:
      'Supported operations planning, vendor coordination and reporting for regional offices.',
    highlights: [
      'Built the monthly operations report later adopted as the company standard.',
    ],
  },
]

export const projects = [
  {
    title: 'Multi-site Facilities Consolidation',
    category: 'Facilities',
    year: '2024',
    image: unsplash('1497366811353-6870744d04b2'),
    summary:
      'Consolidated four facilities contracts into one integrated service model across all sites.',
    outcome: '22% annual cost saving',
    details: [
      'Ran a structured tender with 11 vendors and a weighted scoring model.',
      'Defined SLAs and a monthly service review with clear escalation paths.',
      'Moved 1,200 staff to a single helpdesk with no service disruption.',
    ],
  },
  {
    title: 'Digital Procurement Workflow',
    category: 'Process',
    year: '2023',
    image: unsplash('1460925895917-afdab827c52f'),
    summary:
      'Replaced paper-based purchase approvals with a digital, auditable workflow.',
    outcome: 'Cycle time 21 → 8 days',
    details: [
      'Mapped the end-to-end approval process with finance and department heads.',
      'Introduced tiered approval limits and automated budget checks.',
      'Trained 140 requesters and approvers over three weeks.',
    ],
  },
  {
    title: 'New Regional Headquarters',
    category: 'Project Delivery',
    year: '2022',
    image: unsplash('1497215842964-222b430dc094'),
    summary:
      'Led the fit-out and relocation of 350 employees into a new regional headquarters.',
    outcome: 'Delivered 9% under budget',
    details: [
      'Managed contractors, IT, security and furniture vendors to a single plan.',
      'Moved all teams over one weekend with zero lost working days.',
    ],
  },
  {
    title: 'ISO 9001 Certification',
    category: 'Compliance',
    year: '2020',
    image: unsplash('1454165804606-c3d57bc86b40'),
    summary:
      'Prepared the organisation for its first ISO 9001 quality management certification.',
    outcome: 'Certified on first audit',
    details: [
      'Documented 60+ core processes and assigned clear process owners.',
      'Ran internal audits and corrective-action tracking for six months.',
    ],
  },
  {
    title: 'Fleet & Logistics Optimisation',
    category: 'Operations',
    year: '2019',
    image: unsplash('1586528116311-ad8dd3c8310d'),
    summary:
      'Redesigned routing and maintenance schedules for a 60-vehicle service fleet.',
    outcome: '15% lower fuel spend',
    details: [
      'Introduced GPS tracking and preventive maintenance scheduling.',
      'Cut vehicle downtime by a third within the first year.',
    ],
  },
  {
    title: 'Operations KPI Dashboard',
    category: 'Reporting',
    year: '2018',
    image: unsplash('1551288049-bebda4e38f71'),
    summary:
      'Built a single weekly view of cost, service and people metrics for leadership.',
    outcome: 'Adopted by the executive team',
    details: [
      'Agreed 24 KPIs with department heads and set clear data owners.',
      'Replaced six separate spreadsheets with one automated report.',
    ],
  },
]

export const events = [
  {
    title: 'Annual Leadership Summit',
    type: 'Organised',
    date: 'March 2025',
    location: 'Riyadh',
    image: unsplash('1540575467063-178a50c2df87'),
    summary: 'Planned and ran a two-day summit for 400 leaders, from venue to logistics and agenda.',
  },
  {
    title: 'Middle East Facilities Management Expo',
    type: 'Speaker',
    date: 'November 2024',
    location: 'Dubai',
    image: unsplash('1505373877841-8d25f7d46678'),
    summary: 'Spoke on “Integrated Facilities Management at Scale” to an audience of 300 practitioners.',
  },
  {
    title: 'Operations Excellence Workshop',
    type: 'Host',
    date: 'June 2024',
    location: 'Riyadh',
    image: unsplash('1552664730-d307ca884978'),
    summary: 'Hosted a hands-on workshop on lean process mapping for 40 managers.',
  },
  {
    title: 'Company Annual Gala',
    type: 'Organised',
    date: 'December 2023',
    location: 'Jeddah',
    image: unsplash('1511578314322-379afb476865'),
    summary: 'Led end-to-end planning for an 800-guest annual celebration, delivered on budget.',
  },
]

export const testimonials = [
  {
    quote:
      'Rizwan brings calm to complex situations. The operations function went from reactive to genuinely strategic under that leadership.',
    name: 'Full Name',
    title: 'Chief Operating Officer, Company Name',
  },
  {
    quote:
      'Every project was delivered with clarity, structure and attention to detail. A rare combination of planning and execution.',
    name: 'Full Name',
    title: 'Managing Director, Company Name',
  },
]

export const contact = {
  email: 'rizwan@example.com',
  phone: '+966 50 000 0000',
  location: 'Riyadh, Saudi Arabia',
  linkedin: 'https://www.linkedin.com/',
}

export const nav = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'events', label: 'Events' },
  { id: 'contact', label: 'Contact' },
]
