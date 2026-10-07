import { Link } from 'react-router-dom';
import { MdOutlineChatBubbleOutline, MdOutlineManageSearch, MdOutlineScience } from 'react-icons/md';
import { Chevron } from '../ui/SectionTitle';
import Reveal from '../ui/Reveal';
import TechChip from '../ui/TechChip';
import { chatbot } from '../../data';
import { useContent } from '../../i18n/content';
import { openBotfolio } from '../../utils/botfolio';

const BOT_NAME = chatbot.botName || 'BotFolio';

const Item = ({ icon, title, body, tags, children }) => {
  const Icon = icon;
  return (
    <li className="flex gap-4 border-t border-separator py-6 first:border-t-0 first:pt-0">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-fill text-label">
        <Icon className="text-[20px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-label">{title}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-label-2">{body}</p>
        {tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <TechChip key={tag} name={tag} />
            ))}
          </div>
        )}
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
};

/**
 * Home: where LLMs are already in use — TWLM's smart menu search and this
 * site's BotFolio — plus a slot for a public AI demo project.
 */
const AiHighlight = () => {
  const { t, projects } = useContent();
  // TODO(moiez): mark a public AI demo project with "aiDemo": true in its JSON; it appears here once listed
  const demo = projects.find((p) => p.aiDemo);

  return (
    <section className="w-full px-5 py-20 md:py-28" id="ai">
      <div className="app-container grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <p className="eyebrow mb-3">{t('ai.eyebrow')}</p>
          <h2 className="headline-1 text-label">{t('ai.headline')}</h2>
          <p className="lead mt-4">{t('ai.subtitle')}</p>
        </Reveal>
        <Reveal as="ul" delay={80} className="flex flex-col">
          <Item icon={MdOutlineManageSearch} title={t('ai.twlmTitle')} body={t('ai.twlmBody')} tags={['OpenRouter', 'DeepSeek', 'NestJs']}>
            <Link to="/works/twlm-pos" className="link-arrow text-[15px]">
              {t('projects.caseStudy')}
              <Chevron />
            </Link>
          </Item>
          <Item icon={MdOutlineChatBubbleOutline} title={t('ai.botTitle', { name: BOT_NAME })} body={t('ai.botBody', { name: BOT_NAME })} tags={['OpenRouter', 'DeepSeek']}>
            <button type="button" onClick={openBotfolio} className="link-arrow text-[15px] cursor-pointer">
              {t('ai.botCta', { name: BOT_NAME })}
              <Chevron />
            </button>
          </Item>
          {demo && (
            <Item icon={MdOutlineScience} title={demo.title} body={demo.subtitle}>
              <Link to={`/works/${demo.id}`} className="link-arrow text-[15px]">
                {t('projects.learnMore')}
                <Chevron />
              </Link>
            </Item>
          )}
        </Reveal>
      </div>
    </section>
  );
};

export default AiHighlight;
