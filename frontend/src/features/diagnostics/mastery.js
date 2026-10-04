/**
 * UI-level mastery bands. PLACEHOLDER thresholds: strong >= 75, watch >= 50, weak < 50.
 * Where these rules finally live (backend vs frontend) is still to be confirmed.
 */
export const STRONG_THRESHOLD = 75;
export const WATCH_THRESHOLD = 50;

/** @param {number} score mastery 0-100 */
export function masteryBand(score) {
  if (score >= STRONG_THRESHOLD) return { key: 'strong', label: 'Strong' };
  if (score >= WATCH_THRESHOLD) return { key: 'watch', label: 'Watch' };
  return { key: 'weak', label: 'Needs work' };
}
