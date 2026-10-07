import images from '../../data/images.json';

/**
 * Responsive image: AVIF/WebP srcset from `npm run images`, intrinsic width/height
 * (no layout shift), lazy by default, and an inline blur placeholder for photos.
 * `src` is the image's public URL as used in the data files; unknown images fall
 * back to a plain lazy <img>.
 */
export default function Img({ src, alt = '', sizes = '100vw', priority = false, className = '', style, ...rest }) {
  const meta = images[src];
  const loading = priority ? 'eager' : 'lazy';
  if (!meta) {
    return <img src={src} alt={alt} loading={loading} decoding="async" className={className} style={style} {...rest} />;
  }

  const set = (ext) => meta.widths.map((w) => `${meta.base}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`${meta.base}-${meta.widths.at(-1)}.webp`}
        width={meta.w}
        height={meta.h}
        alt={alt}
        loading={loading}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={className}
        style={meta.blur ? { backgroundImage: `url(${meta.blur})`, backgroundSize: 'cover', backgroundPosition: 'center', ...style } : style}
        {...rest}
      />
    </picture>
  );
}
