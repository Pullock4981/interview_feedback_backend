/**
 * Minimal duration-string parser: converts strings like "15m", "7d",
 * "30s", "1h" into milliseconds. Only supports the small set of units
 * we actually use for JWT_ACCESS_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN,
 * so we don't need to pull in the full "ms" npm package for one line
 * of logic.
 */
const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function ms(durationString) {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(durationString).trim());
  if (!match) {
    throw new Error(
      `Invalid duration string "${durationString}". Expected format like "15m", "7d", "1h".`
    );
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}

module.exports = ms;
