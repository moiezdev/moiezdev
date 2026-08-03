import SectionTitle from '../ui/SectionTitle';
import FloatingDotBox from '../ui/animatedSvgs/FloatingDotBox';
import Logo from '../ui/Logo';
import Floating from '../ui/Floating';
import Magnetic from '../ui/Magnetic';
import { getSkillIcon } from '../../utils/skillIcons';
import { skills } from '../../data';

const TECHNICAL_CATEGORIES = new Set([
  'Frontend',
  'Backend',
  'Databases',
  'Programming Languages',
  'Tools & Platforms',
  'Design & Prototyping',
]);

const technicalSkills = skills.filter((skill) => TECHNICAL_CATEGORIES.has(skill.category));
const otherSkills = skills.filter((skill) => !TECHNICAL_CATEGORIES.has(skill.category));

const SkillIconBadge = ({ name }) => {
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;
  if (!Icon) return null;

  return (
    <span
      className="inline-flex items-center justify-center size-9 bg-gray-a/20 hover:scale-110 transition-all cursor-pointer cursor-scale-0 hover:bg-primary/20"
      title={name}
      aria-label={name}
    >
      <Icon className="text-[18px] shrink-0" style={{ color: skillIcon.color }} aria-hidden />
    </span>
  );
};

const SkillTextBadge = ({ name }) => {
  const skillIcon = getSkillIcon(name);
  const Icon = skillIcon?.Icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 transition-all cursor-pointer cursor-scale-0 hover:bg-primary/20"
      title={name}
    >
      {Icon && (
        <Icon className="text-[14px] shrink-0" style={{ color: skillIcon.color }} aria-hidden />
      )}
      {name}
    </span>
  );
};

const SkillCategoryCard = ({ skill, iconOnly = false }) => (
  <Floating duration={5}>
    <Magnetic strength={0.1} duration={0.5}>
      <div className="border border-gray-a hover:shadow-lg transition-shadow duration-300 w-full">
        <div className="flex flex-col">
          <h3 className="font-semibold text-white border-b border-gray-a p-[8px] cursor-pointer cursor-white cursor-scale-1">
            {skill.category}
          </h3>
          <div className="flex flex-wrap gap-[8px] p-[8px]">
            {skill.items.map((item) =>
              iconOnly ? (
                <SkillIconBadge key={item} name={item} />
              ) : (
                <SkillTextBadge key={item} name={item} />
              )
            )}
          </div>
        </div>
      </div>
    </Magnetic>
  </Floating>
);

const SkillSubsection = ({ title, categories, iconOnly = false }) => {
  if (!categories.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-white text-large font-semibold border-b border-gray-a pb-2 cursor-pointer cursor-white cursor-scale-1">
        {title}
      </h2>
      <div className="grid gap-[16px] sm:grid-cols-2">
        {categories.map((skill) => (
          <SkillCategoryCard key={skill.category} skill={skill} iconOnly={iconOnly} />
        ))}
      </div>
    </div>
  );
};

const Skills = () => {
  return (
    <section className="w-full px-4 py-12" id="skills">
      <div className="app-container mx-auto">
        <SectionTitle title="skills" />
        <div className="grid gap-8 lg:grid-cols-7">
          <div className="col-span-3 p-5 hidden lg:block relative">
            <div className="border inline-block border-gray-a p-1 mx-auto mb-4 cursor-pointer cursor-white cursor-scale-1.7">
              <span className="bg-primary h-[16px] aspect-square inline-block mb-[-2px] mr-1"></span>
              Core: product-focused fullstack — FE, BE & product
            </div>

            <div className="absolute bottom-1 left-0 translate-x -translate-y-1/2 z-0 cursor-pointer cursor-white cursor-scale-0">
              <Magnetic strength={0.2}>
                <Logo
                  size={170}
                  animate={true}
                  animationStyle="draw-floating"
                  repeat={1}
                  duration={2}
                  floatDuration={5}
                />
              </Magnetic>
            </div>

            <div className="absolute bottom-1/5 right-1/3 translate-x -translate-y-1/2">
              <Magnetic strength={0.1} duration={0.5}>
                <FloatingDotBox animate={true} dotSize={2} rows={4} cols={5} duration={9} />
              </Magnetic>
            </div>

            <div className="absolute top-1/3 left-2 translate-x -translate-y-1/2">
              <Magnetic strength={0.1} duration={0.5}>
                <FloatingDotBox
                  animate={true}
                  dotSize={2}
                  rows={7}
                  cols={7}
                  duration={12}
                  floatDistance={8}
                />
              </Magnetic>
            </div>

            <div className="absolute top-1/3 right-1/7 translate-x -translate-y-1/2">
              <Magnetic strength={0.1} duration={0.5}>
                <Floating duration={8}>
                  <div className="w-[100px] h-[100px] border border-gray-a hover:bg-gray-a/10 transition-colors"></div>
                </Floating>
              </Magnetic>
            </div>

            <div className="absolute bottom-1/14 right-4 translate-x -translate-y-1/2">
              <Magnetic strength={0.1} duration={0.5}>
                <Floating duration={8}>
                  <div className="w-[65px] h-[65px] border border-gray-a hover:bg-gray-a/10 transition-colors"></div>
                </Floating>
              </Magnetic>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-10">
            <SkillSubsection title="Technical Skills" categories={technicalSkills} iconOnly />
            <SkillSubsection title="Other Skills" categories={otherSkills} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
