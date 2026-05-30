/**
 * Money helpers — single source of truth for monetary rounding.
 *
 * All monetary values in the app are stored as JS numbers but treated as
 * having cent-precision. Use these helpers instead of inlining
 * `Math.round(x * 100) / 100` or magic 0.005 thresholds.
 */

/** Smallest meaningful monetary delta. Values below this are treated as zero. */
export const MONEY_EPSILON = 0.005;

/** Round a number to 2 decimal places (cent precision). */
export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** True when |amount| is below the monetary epsilon (i.e. effectively zero). */
export function isMonetaryZero(amount: number): boolean {
  return Math.abs(amount) < MONEY_EPSILON;
}
