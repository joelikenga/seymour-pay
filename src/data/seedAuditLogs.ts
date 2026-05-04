import type { AuditLogEntry } from '../types/auditLog'

export const seedAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    at: new Date(Date.now() - 3600_000).toISOString(),
    userLabel: 'Seymour Ops',
    action: 'login',
    summary: 'Signed in',
    detail: 'Session started from Chrome on Windows',
  },
  {
    id: 'log-2',
    at: new Date(Date.now() - 7200_000).toISOString(),
    userLabel: 'Seymour Ops',
    action: 'navigation',
    summary: 'Opened Dashboard',
    detail: 'Navigated to /admin',
  },
]
