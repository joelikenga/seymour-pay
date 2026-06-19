/** Normalized check for server admin role (`superadmin`, `super_admin`, etc.). */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  const normalized = role?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? ''
  return normalized === 'superadmin' || normalized === 'super_admin'
}
