import React, { useLayoutEffect, useRef, useState } from 'react';
import Button from './Button';
import Floating from './Floating';
import LazyImage from './LazyImage';
import { getSkillIcon } from '../../utils/skillIcons';

const TECH_STACK_MAX_H = 'calc(2 * 1.75rem + 8px)';

const TechStackTags = ({ techStack }) => {
  const listRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || !techStack?.length) {
      setOverflowing(false);
      return;
    }

    const check = () => {
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [techStack]);

  if (!techStack?.length) return null;

  return (
    <p className="border-b border-gray-a text-gray-400 p-[8px] relative">
      <span
        ref={listRef}
        className="flex flex-wrap gap-[8px] overflow-hidden"
        style={{ maxHeight: TECH_STACK_MAX_H }}
      >
        {techStack.map((item, idx) => {
          const skillIcon = getSkillIcon(item);
          const Icon = skillIcon?.Icon;
          return (
            <span
              className="inline-flex items-center gap-1.5 cursor-pointer cursor-scale-0 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all"
              key={idx}
              title={item}
            >
              {Icon && (
                <Icon
                  className="text-[14px] shrink-0"
                  style={{ color: skillIcon.color }}
                  aria-hidden
                />
              )}
              {item}
            </span>
          );
        })}
      </span>
      {overflowing && (
        <span
          className="absolute bottom-[8px] right-[8px] pl-8 pr-2.5 pb-0.5 pt-8 text-xs font-medium text-gray-a cursor-default"
          style={{
            background:
              'radial-gradient(circle at bottom right, var(--color-gray-b) 0%, var(--color-gray-b) 20%, transparent 100%)',
          }}
          title={techStack.join(', ')}
          aria-label={`More technologies: ${techStack.join(', ')}`}
        >
          ...
        </span>
      )}
    </p>
  );
};

const Card = ({
  className,
  title,
  description,
  techStack,
  liveLink,
  codeLink,
  codeLinkSecondary,
  codeLinkSecondaryLabel = 'Backend >=',
  image,
  altText,
}) => {
  return (
    <Floating duration={5}>
      <div
        className={`border bg-gray-b border-gray-a hover:shadow-lg transition-shadow duration-300 ${className}`}
      >
        {image ? (
          <div className="relative border-b border-gray-a">
            <LazyImage
              src={image}
              alt={altText || title}
              wrapperClass="w-full aspect-[16/10] object-cover cursor-pointer cursor-scale-4 cursor-white h-[210px]"
            />
          </div>
        ) : null}
        <div>
          <TechStackTags techStack={techStack} />
          <div className="flex flex-col gap-[16px] p-[16px]">
            <h2 className="text-large font-semibold text-white cursor-pointer">{title}</h2>
            <p className=" cursor-pointer">{description}</p>
            <div className="flex flex-wrap gap-[16px]">
              {liveLink && (
                <Button
                  className={`cursor-scale-0 cursor-pointer`}
                  onClick={() => window.open(liveLink, '_blank')}
                  primary={true}
                >
                  {'Live <~>'}
                </Button>
              )}
              {codeLink && (
                <Button onClick={() => window.open(codeLink, '_blank')}>{'Github >='}</Button>
              )}
              {codeLinkSecondary && (
                <Button onClick={() => window.open(codeLinkSecondary, '_blank')}>
                  {codeLinkSecondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Floating>
  );
};

export default Card;
