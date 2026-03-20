import { createClient } from '@/lib/supabase/server'
import type { TransactionType, PaymentMethod } from '@/lib/types'

interface LogLedgerEntry {
  type: TransactionType
  amount?: number
  description: string
  memberId?: string
  memberName?: string
  approvedBy?: string
  approvedByName?: string
  referenceId?: string
  paymentSource?: PaymentMethod
}

/**
 * Logs an immutable ledger entry to the ledger_entries table.
 * Use this for all financial actions: contributions, withdrawals, deposits, approvals.
 * Entries are READ-ONLY once created (no UPDATE or DELETE RLS policies exist).
 */
export async function logLedgerEntry(entry: LogLedgerEntry): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ledger_entries')
    .insert({
      type: entry.type,
      amount: entry.amount ?? null,
      description: entry.description,
      member_id: entry.memberId ?? null,
      member_name: entry.memberName ?? null,
      approved_by: entry.approvedBy ?? null,
      approved_by_name: entry.approvedByName ?? null,
      reference_id: entry.referenceId ?? null,
      payment_source: entry.paymentSource ?? null,
    })
    .select('id, transaction_id')
    .single()

  if (error) {
    console.error('[Ledger] Failed to log entry:', error.message)
    return null
  }

  return data?.transaction_id ?? null
}

/**
 * Sends an in-app notification to a member.
 */
export async function sendNotification({
  memberId,
  type,
  title,
  message,
}: {
  memberId: string
  type: string
  title: string
  message: string
}) {
  const supabase = await createClient()

  await supabase.from('notifications').insert({
    member_id: memberId,
    type,
    title,
    message,
  })
}
