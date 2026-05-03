import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, Calendar, ArrowRight, CheckCircle2, Clock, XCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { MONTHS, MINIMUM_CONTRIBUTION } from '@/lib/types'
import type { Contribution } from '@/lib/types'
import { TransparencyTable } from '@/components/dashboard/transparency-table'

export const dynamic = 'force-dynamic'

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let { data: member } = user ? await supabase.from('members').select('*').eq('user_id', user.id).single() : { data: null }
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  
  if (isAdmin) {
    if (!member) member = { id: user?.id, user_id: user?.id, full_name: user?.user_metadata?.full_name || 'Admin', role: 'admin', status: 'approved' } as any
    else member.role = 'admin'
  }

  if (member?.role === 'youth_coordinator') {
    redirect('/youth-coordinator')
  }

  if (!user || !member) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view your dashboard.</div>
  }

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Get member's contributions for the current year
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', member.id)
    .eq('year', currentYear)
    .order('created_at', { ascending: false })

  const contributionsList = (contributions || []) as Contribution[]

  // Calculate stats
  const totalPaid = contributionsList
    .filter(c => c.status === 'verified')
    .reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

  const paidMonths = contributionsList
    .filter(c => c.status === 'verified')
    .map(c => c.month)

  // Start calculating unpaid months from March (index 2)
  const START_MONTH_INDEX = 2 // March
  const transparencyMonths = MONTHS.slice(START_MONTH_INDEX, currentMonth + 1)
  
  const unpaidMonths = transparencyMonths
    .filter(month => !paidMonths.includes(month))

  const totalEligibleMonths = transparencyMonths.length
  const pendingContributions = contributionsList.filter(c => c.status === 'pending')

  // Recent contributions
  const recentContributions = contributionsList.slice(0, 5)

  // COMMUNITY TOTALS (Transparency)
  const { data: allYearContributions } = await supabase
    .from('contributions')
    .select('monthly_amount, extra_amount')
    .eq('status', 'verified')
    .eq('year', currentYear)
  
  const communityTotalCollected = (allYearContributions || []).reduce((sum, c) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)
  const { data: allFundBalances } = await supabase
    .from('fund_balances')
    .select('balance')
  
  const communityFundBalance = (allFundBalances || []).reduce((sum, f) => sum + f.balance, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Track your contributions and fund status</p>
      </div>

      {/* Community Transparency Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-accent">
              Community Fund Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{communityFundBalance.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Total balance across all youth funds</p>
          </CardContent>
        </Card>

        <Card className="border-accent/40 bg-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-accent">
              Total Collected ({currentYear})
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{communityTotalCollected.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Verified contributions from all members</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Total Contribution
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Personal total for {currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Months Paid
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidMonths.length} / {totalEligibleMonths}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidMonths.length > 0 ? `${unpaidMonths.length} month(s) unpaid` : 'All caught up!'}
            </p>
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
            <div className="text-2xl font-bold">{pendingContributions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin review</p>
          </CardContent>
        </Card>
      </div>

      <TransparencyTable />

      {/* Unpaid Months Alert */}
      {unpaidMonths.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Unpaid Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {unpaidMonths.map(month => (
                <Badge key={month} variant="outline" className="border-warning/50 text-warning">
                  {month}
                </Badge>
              ))}
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/contributions">
                Make Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Contributions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Contributions</CardTitle>
            <CardDescription>Your latest payment submissions</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/history">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentContributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No contributions yet</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/dashboard/contributions">Make Your First Contribution</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {contribution.status === 'verified' && (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    )}
                    {contribution.status === 'pending' && (
                      <Clock className="h-5 w-5 text-warning" />
                    )}
                    {contribution.status === 'rejected' && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{contribution.month} {contribution.year}</p>
                      <p className="text-sm text-muted-foreground">
                        {contribution.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{(Number(contribution.monthly_amount) + Number(contribution.extra_amount)).toLocaleString()} Le</p>
                    <Badge
                      variant={
                        contribution.status === 'verified'
                          ? 'default'
                          : contribution.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="capitalize"
                    >
                      {contribution.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contribution Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Minimum monthly contribution: <span className="font-medium text-foreground">{MINIMUM_CONTRIBUTION} Leones</span></p>
          <p>Payment methods accepted: Orange Money (**+232 74 172197**), Africell Money, Bank Transfer, Cash</p>
          <p>Please submit proof of payment for verification.</p>
        </CardContent>
      </Card>
    </div>
  )
}
