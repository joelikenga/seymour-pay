export type AuditAction =
  | 'navigation'
  | 'login'
  | 'export'
  | 'reconciliation'
  | 'settings'

export interface AuditLogEntry {
  id: string
  at: string
  userLabel: string
  action: AuditAction
  summary: string
  detail: string
}
