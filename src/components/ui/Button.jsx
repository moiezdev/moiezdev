import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

// every variant but `plain` is a small machined block (see .cube-btn in index.css): squared corners, a bevel
// and a hard side face that the press pushes flat. No soft shadows.
const VARIANTS = {
  primary: 'cube-btn cube-btn--solid bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'cube-btn bg-fill text-label hover:bg-[color-mix(in_srgb,var(--color-fill)_160%,transparent)]',
  outline: 'cube-btn border border-accent text-accent hover:bg-accent hover:text-on-accent',
  plain: 'btn-press rounded-[5px] text-accent hover:underline underline-offset-4',
};

const SIZES = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-7 text-[17px]',
};

/**
 * Cube button, matching the hero's machined cubes. Renders a router Link when `to` is given,
 * an anchor when `href` is given, and a native button otherwise.
 */
const Button = forwardRef(function Button(
  {
    children,
    className = '',
    primary = false,
    variant,
    size = 'md',
    type = 'button',
    to,
    href,
    ...rest
  },
  ref,
) {
  const tone = VARIANTS[variant || (primary ? 'primary' : 'secondary')];
  const classes = `inline-flex items-center justify-center gap-1.5 font-medium tracking-[-0.01em] whitespace-nowrap select-none disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${SIZES[size]} ${tone} ${className}`;

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
