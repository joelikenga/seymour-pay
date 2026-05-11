/** Rules for “Change password” on the admin Settings page. */

export const ADMIN_NEW_PASSWORD_MIN_LENGTH = 8

export interface AdminPasswordRequirementChecks {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasDigit: boolean
  hasSpecial: boolean
}

export function checkAdminPasswordRequirements(
  password: string,
): AdminPasswordRequirementChecks {
  return {
    minLength: password.length >= ADMIN_NEW_PASSWORD_MIN_LENGTH,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    /** Any character that is not a letter or digit (symbol, punctuation, space, etc.). */
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  }
}

export function isAdminPasswordPolicySatisfied(password: string): boolean {
  const c = checkAdminPasswordRequirements(password)
  return c.minLength && c.hasUpper && c.hasLower && c.hasDigit && c.hasSpecial
}
