export type MemberRole = 'member' | 'admin' | 'treasurer' | 'youth_coordinator'
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type ContributionStatus = 'pending' | 'verified' | 'rejected'
export type PaymentMethod = 'orange_money' | 'africell_money' | 'bank_transfer' | 'cash'
export type TransactionType = 'contribution' | 'extra_contribution' | 'withdrawal' | 'bank_deposit' | 'expense' | 'member_approved'
export type NotificationType = 'payment_reminder' | 'payment_verified' | 'payment_rejected' | 'announcement' | 'fund_update' | 'member_approved' | 'withdrawal'

export interface Member {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  role: MemberRole
  status: MemberStatus
  orange_money_number?: string | null
  joined_date: string
  created_at: string
  updated_at: string
}

export interface Contribution {
  id: string
  member_id: string
  monthly_amount: number
  extra_amount: number
  month: string
  year: number
  payment_method: PaymentMethod
  payment_reference: string | null
  transaction_message: string | null
  proof_url: string | null
  status: ContributionStatus
  verified: boolean
  is_extra?: boolean
  allocated_month?: string | null
  verified_by: string | null
  verified_at: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  member?: Member
  verifier?: Member
}

export interface LedgerEntry {
  id: string
  type: TransactionType
  amount: number | null
  description: string
  member_id: string | null
  member_name: string | null
  approved_by: string | null
  approved_by_name: string | null
  transaction_id: string
  reference_id: string | null
  payment_source: PaymentMethod | null
  created_at: string
}

export interface Withdrawal {
  id: string
  amount: number
  reason: string
  source: PaymentMethod
  category_id: string | null
  approved_by: string
  approved_by_name: string
  ledger_entry_id: string | null
  created_at: string
  category?: FundCategory
  approver?: Member
}

export interface FundCategory {
  id: string
  name: string
  description: string | null
  target_amount: number | null
  is_active: boolean
  created_at: string
}

export interface BankDeposit {
  id: string
  amount: number
  deposit_date: string
  bank_name: string
  account_number: string
  deposit_slip_url: string | null
  deposited_by: string
  verified_by: string | null
  notes: string | null
  created_at: string
  depositor?: Member
  verifier?: Member
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  reference_id: string | null
  category_id: string | null
  created_by: string
  created_at: string
  category?: FundCategory
  creator?: Member
}

export interface FundBalance {
  id: string
  category_id: string
  balance: number
  mobile_money_balance: number
  bank_balance: number
  last_updated: string
  category?: FundCategory
}

export interface Notification {
  id: string
  member_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  totalMembers: number
  totalContributions: number
  pendingContributions: number
  totalFundBalance: number
  monthlyTarget: number
  currentMonthCollection: number
}

export interface MemberContributionSummary {
  memberId: string
  memberName: string
  totalPaid: number
  paidMonths: string[]
  unpaidMonths: string[]
  lastPaymentDate: string | null
}

export interface MonthlyTotal {
  month: string
  year: number
  regularContributions: number
  extraContributions: number
  totalContributions: number
  withdrawals: number
  netBalance: number
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export const MINIMUM_CONTRIBUTION = 50 // 50 Leones

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'africell_money', label: 'Africell Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
]
