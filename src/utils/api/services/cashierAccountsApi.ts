import { axios$ } from '../..'
import type {
  CashierAccount,
  CreateCashierAccountBody,
  CreateCashierAccountResponse,
  DeleteCashierAccountResponse,
  UpdateCashierAccountBody,
} from '../../../types/cashierAccount'

/**
 * `GET /admin/cashier-accounts`
 * Retrieves all cashier accounts. Requires superadmin role.
 */
export async function adminGetCashierAccounts(): Promise<CashierAccount[]> {
  const res = (await axios$.get('/admin/cashier-accounts')) as unknown
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: CashierAccount[] }).data
  }
  if (Array.isArray(res)) {
    return res as CashierAccount[]
  }
  return []
}

/**
 * `POST /admin/cashier-accounts`
 * Creates a new cashier account and returns profile + one-time password.
 * Requires superadmin role.
 */
export async function adminCreateCashierAccount(
  body: CreateCashierAccountBody,
): Promise<CreateCashierAccountResponse> {
  const cleanUsername = body.username.trim()
  const email = body.email?.trim() || `${cleanUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@cashier.seymour.ng`
  const data = (await axios$.post('/admin/cashier-accounts', {
    email,
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    username: cleanUsername,
    gate: body.gate.trim(),
  })) as unknown
  return data as CreateCashierAccountResponse
}

/**
 * `DELETE /admin/cashier-accounts/{id}`
 * Deletes a cashier account by UUID. Requires superadmin role.
 */
export async function adminDeleteCashierAccount(
  id: string,
): Promise<DeleteCashierAccountResponse> {
  const data = (await axios$.delete(
    `/admin/cashier-accounts/${encodeURIComponent(id)}`,
  )) as unknown
  return data as DeleteCashierAccountResponse
}

/**
 * `PATCH /admin/cashier-accounts/{id}`
 * Updates a cashier's display name (firstName/lastName) and/or gate assignment.
 * All fields are optional — sends only the fields you want to change.
 * Requires superadmin role.
 */
export async function adminUpdateCashierAccount(
  id: string,
  body: UpdateCashierAccountBody,
): Promise<CashierAccount> {
  const payload: Record<string, string> = {}
  if (body.firstName !== undefined && body.firstName.trim()) {
    payload.firstName = body.firstName.trim()
  }
  if (body.lastName !== undefined && body.lastName.trim()) {
    payload.lastName = body.lastName.trim()
  }
  if (body.gate !== undefined && body.gate.trim()) {
    payload.gate = body.gate.trim()
  }

  try {
    const data = (await axios$.patch(
      `/admin/cashier-accounts/${encodeURIComponent(id)}`,
      payload,
    )) as unknown
    return data as CashierAccount
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    if (/method not allowed/i.test(errorMsg)) {
      const data = (await axios$.put(
        `/admin/cashier-accounts/${encodeURIComponent(id)}`,
        payload,
      )) as unknown
      return data as CashierAccount
    }
    throw err
  }
}
