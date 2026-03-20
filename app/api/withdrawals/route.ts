import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logLedgerEntry, sendNotification } from '@/lib/ledger'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let { data: member } = await supabase.from('members').select('*').eq('user_id', user.id).single()
  const ADMIN_EMAILS = ['samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com']
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  if (isAdmin) {
    if (!member) member = { id: user?.id, user_id: user?.id, full_name: user?.user_metadata?.full_name || 'Admin', role: 'admin', status: 'approved' } as any
    else { member.role = 'admin'; member.status = 'approved'; }
  }

  if (!member || !['admin', 'treasurer'].includes(member.role) || member.status !== 'approved') {
    return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })
  }

  const body = await request.json()
  const { amount, reason, source } = body

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!reason?.trim()) return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
  if (!source) return NextResponse.json({ error: 'Source is required' }, { status: 400 })

  // Log to immutable ledger
  const transactionId = await logLedgerEntry({
    type: 'withdrawal',
    amount,
    description: reason,
    approvedBy: member.id,
    approvedByName: member.full_name,
    paymentSource: source,
  })

  // Record the withdrawal
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      amount,
      reason,
      source,
      approved_by: member.id,
      approved_by_name: member.full_name,
    })
    .select()
    .single()

  if (withdrawalError) {
    return NextResponse.json({ error: withdrawalError.message }, { status: 500 })
  }

  // Deduct from the general fund balance (first available)
  const { data: generalFund } = await supabase
    .from('fund_balances')
    .select('id, balance, category:fund_categories(name)')
    .order('balance', { ascending: false })
    .limit(1)
    .single()

  if (generalFund) {
    await supabase
      .from('fund_balances')
      .update({ balance: Math.max(0, generalFund.balance - amount), last_updated: new Date().toISOString() })
      .eq('id', generalFund.id)
  }

  return NextResponse.json({ 
    success: true, 
    transaction_id: transactionId,
    withdrawal_id: withdrawal.id 
  })
}
