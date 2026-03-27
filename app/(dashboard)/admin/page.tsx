import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Wallet, Clock, TrendingUp, UserCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Contribution, Member } from '@/lib/types'

export default async function AdminDashboardPage() {
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

  const currentYear = new Date().getFullYear()

  // Get stats
  const { count: totalMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { count: pendingMembers } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: pendingContributions } = await supabase
    .from('contributions')
    .select('*, member:members!contributions_member_id_fkey(*)')
    .eq('verified', false)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentContributions } = await supabase
    .from('contributions')
    .select('*, member:members!contributions_member_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: yearContributions } = await supabase
    .from('contributions')
    .select('monthly_amount, extra_amount')
    .eq('verified', true)
    .eq('year', currentYear)

  const totalCollected = (yearContributions || []).reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

  // Get fund balance
  const { data: fundBalances } = await supabase
    .from('fund_balances')
    .select('balance')

  const totalFundBalance = (fundBalances || []).reduce((sum: number, f: any) => sum + f.balance, 0)

  const pendingContributionsList = (pendingContributions || []) as (Contribution & { member: Member })[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of fund management and member activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers || 0}</div>
            {pendingMembers && pendingMembers > 0 && (
              <p className="text-xs text-warning">{pendingMembers} pending approval</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fund Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFundBalance.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected ({currentYear})
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCollected.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Verified contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Verification
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingContributionsList.length}</div>
            <p className="text-xs text-muted-foreground">Contributions awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pending Members */}
        {pendingMembers && pendingMembers > 0 && (
          <Card className="border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-warning" />
                Pending Member Approvals
              </CardTitle>
              <CardDescription>{pendingMembers} member(s) waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/members?status=pending">
                  Review Applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Contributions */}
        <Card className={pendingContributionsList.length > 0 ? 'border-primary/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Payment Verification
            </CardTitle>
            <CardDescription>
              {pendingContributionsList.length > 0
                ? `${pendingContributionsList.length} payment(s) pending verification`
                : 'All payments verified'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant={pendingContributionsList.length > 0 ? 'default' : 'outline'}>
              <Link href="/admin/verify">
                {pendingContributionsList.length > 0 ? 'Verify Payments' : 'View All'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending Contributions */}
      {pendingContributionsList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Pending Payments</CardTitle>
              <CardDescription>Latest contributions awaiting verification</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/verify">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingContributionsList.slice(0, 5).map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{contribution.member?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contribution.month} {contribution.year} • {contribution.payment_method.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(Number(contribution.monthly_amount) + Number(contribution.extra_amount)).toLocaleString()} Le</p>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
