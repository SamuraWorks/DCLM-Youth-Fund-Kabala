import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Wallet, FileText, Calendar } from 'lucide-react'
import { TransparencyTable } from '@/components/dashboard/transparency-table'

export const dynamic = 'force-dynamic'

export default async function YouthCoordinatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  if (!member || member.role !== 'youth_coordinator') {
    redirect('/dashboard')
  }

  const currentYear = new Date().getFullYear()

  // Community Stats
  const { data: allYearContributions } = await supabase
    .from('contributions')
    .select('monthly_amount, extra_amount')
    .eq('verified', true)
    .eq('year', currentYear)
  
  const totalCollected = (allYearContributions || []).reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

  const { data: allFundBalances } = await supabase
    .from('fund_balances')
    .select('balance')
  
  const communityFundBalance = (allFundBalances || []).reduce((sum: number, f: any) => sum + Number(f.balance), 0)

  const { count: memberCount } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Youth Coordinator Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {member.full_name}. Overseeing community growth and transparency.</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-accent text-accent">
          Coordinator Access
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-accent">Total Fund Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{communityFundBalance.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">Across all youth fund categories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected ({currentYear})</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCollected.toLocaleString()} Le</div>
            <p className="text-xs text-muted-foreground">All verified contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">Verified community members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">End-of-Month Status</div>
            <p className="text-xs text-muted-foreground">Reviewing member transparency log</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            Member Transparency Matrix
          </h2>
          <p className="text-sm text-muted-foreground">Monitor real-time contribution status of all community members.</p>
        </div>
        <TransparencyTable />
      </div>
    </div>
  )
}
