/** Placeholders the owner still has to fill: "TODO(moiez): …" values never reach the UI. */
export const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO(');

/** A non-empty string that isn't a TODO placeholder. */
export const filled = (value) => typeof value === 'string' && value.trim() !== '' && !isTodo(value);
