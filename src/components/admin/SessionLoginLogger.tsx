/** Session flag used when clearing audit-related tab state on logout. */
export const SEYMOUR_ADMIN_TAB_SESSION_KEY = 'seymour_audit_login_logged'

/** Reserved for future tab-session behaviour; login audit is sent from {@link LoginPage} via API. */
export default function SessionLoginLogger() {
  return null
}
