import projectOrder from './projects/index.json';
import skills from './skills.json';

import twlmPos from './projects/twlm-pos.json';
import aaTourism from './projects/aa-tourism.json';
import scmborba from './projects/scmborba.json';
import doceanFisheries from './projects/docean-fisheries.json';
import myPortfolio from './projects/my-portfolio.json';
import galaTravels from './projects/gala-travels.json';
import mianTravels from './projects/mian-travels.json';
import ainSaas from './projects/ain-saas.json';
import cityArrivals from './projects/city-arrivals.json';
import mtlnation from './projects/mtlnation.json';
import tdm from './projects/tdm.json';
import joshuaPortfolio from './projects/joshua-portfolio.json';
import eims from './projects/eims.json';
import lms from './projects/lms.json';

const projectsById = {
  'twlm-pos': twlmPos,
  'aa-tourism': aaTourism,
  scmborba,
  'docean-fisheries': doceanFisheries,
  'my-portfolio': myPortfolio,
  'gala-travels': galaTravels,
  'mian-travels': mianTravels,
  'ain-saas': ainSaas,
  'city-arrivals': cityArrivals,
  mtlnation,
  tdm,
  'joshua-portfolio': joshuaPortfolio,
  eims,
  lms,
};

const knownSkills = new Set(skills.flatMap((category) => category.items));

export const allProjects = projectOrder.map((id) => {
  const project = projectsById[id];
  if (!project) {
    throw new Error(`Missing project JSON for id: ${id}`);
  }

  const unknownTech = project.technologies.filter((tech) => !knownSkills.has(tech));
  if (unknownTech.length) {
    console.warn(
      `[data/projects] "${project.id}" uses tech not in skills.json:`,
      unknownTech.join(', ')
    );
  }

  // repo links only ever reach the UI (and the chatbot) for public repos
  if (project.repoPublic !== true) {
    const { githubUrl: _g, githubBackendUrl: _b, ...rest } = project;
    return rest;
  }
  return project;
});

/** Projects shown in lists. Unlisted ones (e.g. waiting on new images) keep their own page. */
export const projects = allProjects.filter((project) => project.listed !== false);

export const getProjectById = (id) => allProjects.find((project) => project.id === id);
