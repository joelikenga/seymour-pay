export interface CashierAccount {
  id: string
  email?: string
  firstName: string
  lastName: string
  gate: string
  name: string
  username: string
  shift?: 'morning' | 'night'
  createdAt?: string
}

export interface CashierAccountsListResponse {
  data: CashierAccount[]
}

export interface CreateCashierAccountBody {
  email?: string
  firstName: string
  lastName: string
  username: string
  gate: string
}

export interface CreateCashierAccountResponse {
  cashier: CashierAccount
  password: string
}

export interface UpdateCashierAccountBody {
  firstName?: string
  lastName?: string
  gate?: string
}

export interface DeleteCashierAccountResponse {
  message: string
}
