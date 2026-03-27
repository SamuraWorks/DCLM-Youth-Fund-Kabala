import { createClient } from '@/lib/supabase/server'
import WithdrawalsClientPage from '@/components/admin/withdrawals-client'

export default async function WithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  let { data: member } = user ? await supabase.from('members').select('role').eq('user_id', user.id).single() : { data: null }

  if (isAdmin) {
    if (!member) member = { role: 'admin' } as any
    else member.role = 'admin'
  }

  if (!user || !member || !['admin', 'treasurer'].includes(member.role)) {
    return <div className="p-8 text-center text-muted-foreground">Admin access required.</div>
  }

  const [{ data: withdrawals }, { data: fundBalances }] = await Promise.all([
    supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('fund_balances')
      .select('*, category:fund_categories(name)')
      .order('category_id'),
  ])

  return (
    <WithdrawalsClientPage
      withdrawals={withdrawals || []}
      fundBalances={fundBalances || []}
    />
  )
}
