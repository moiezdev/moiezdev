import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)] active:scale-[0.97]',
  secondary: 'bg-fill text-label hover:bg-[color-mix(in_srgb,var(--color-fill)_160%,transparent)] active:scale-[0.97]',
  outline:
    'text-accent ring-1 ring-inset ring-accent hover:bg-accent hover:text-on-accent active:scale-[0.97]',
  plain: 'text-accent hover:underline underline-offset-4',
};

const SIZES = {
  sm: 'h-8 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-7 text-[17px]',
};

/**
 * Pill button following Apple's HIG. Renders a router Link when `to` is given,
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
  const classes = `inline-flex items-center justify-center gap-1.5 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap select-none btn-press disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${SIZES[size]} ${tone} ${className}`;

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
