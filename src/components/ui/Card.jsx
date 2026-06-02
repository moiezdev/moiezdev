import React from 'react';
import Button from './Button';
import Floating from './Floating';
import LazyImage from './LazyImage';

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
          <p className="border-b border-gray-a text-gray-400 p-[8px] flex flex-wrap gap-[8px]">
            {techStack &&
              techStack.map((item, idx) => (
                <span
                  className="cursor-pointer cursor-scale-0 px-2.5 py-0.5 bg-gray-a/20 hover:scale-110 hover:bg-primary/20 transition-all"
                  key={idx}
                >
                  {item}
                </span>
              ))}
          </p>
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
