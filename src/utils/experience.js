/**
 * Career start: May 2019.
 * Experience years are derived from this date so the site stays current.
 */
export const CAREER_START = new Date(2019, 4, 1); // month is 0-indexed

/**
 * Full years of experience since career start (floored).
 */
export function getExperienceYears(from = CAREER_START, to = new Date()) {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  const years = Math.floor(months / 12);
  return Math.max(0, years);
}

/** e.g. "~6" or "6" */
export function formatExperienceYears({ approx = true } = {}) {
  const years = getExperienceYears();
  return approx ? `~${years}` : String(years);
}

/** Replace {{experienceYears}} in copy (uses bare number, e.g. 6). */
export function withExperienceYears(text) {
  if (!text) return text;
  return String(text).replaceAll('{{experienceYears}}', String(getExperienceYears()));
}
