export const openCommandPalette = () => window.dispatchEvent(new Event('open-command-palette'));

export const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
