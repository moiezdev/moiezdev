let mounted = false;

/** Called once the app has mounted; later pages fade in, the first one doesn't. */
export const markMounted = () => {
  mounted = true;
};

/** `page-in` for in-app navigation only, so prerendered content shows on first paint. */
export const pageInClass = () => (mounted ? 'page-in' : '');
