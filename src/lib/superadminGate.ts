/**
 * Demo gate until wired to your API. Set `VITE_SUPERADMIN_PASSWORD` in `.env` for deployments.
 */
export function verifySuperadminPassword(password: string): boolean {
  const env = import.meta.env.VITE_SUPERADMIN_PASSWORD as string | undefined
  const expected =
    typeof env === 'string' && env.length > 0 ? env : 'seymour-superadmin-demo'
  return password === expected
}
