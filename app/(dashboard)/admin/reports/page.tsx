import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MONTHS } from '@/lib/types'
import type { Contribution, Member, Transaction, FundCategory } from '@/lib/types'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  const actualYear = new Date().getFullYear()
  const currentYear = resolvedParams.year ? parseInt(resolvedParams.year) : actualYear
  const currentMonth = currentYear < actualYear ? 11 : new Date().getMonth()

  // Get all approved members
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('status', 'approved')
    .order('full_name')

  // Get all verified contributions for current year
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('verified', true)
    .eq('year', currentYear)

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:fund_categories(*), creator:members(*)')
    .order('created_at', { ascending: false })
    .limit(20)

  const membersList = (members || []) as Member[]
  const contributionsList = (contributions || []) as Contribution[]
  const transactionsList = (transactions || []) as (Transaction & { 
    category: FundCategory | null
    creator: Member 
  })[]

  // Summary stats
  // For 2026, we start in March (index 2). For future years, start in January (index 0).
  const startMonthIndex = currentYear === 2026 ? 2 : 0
  const transparencyMonths = MONTHS.slice(startMonthIndex, currentMonth + 1)
  const totalCollected = contributionsList.reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)
  
  const monthlyTarget = membersList.length * 50
  const targetUpToNow = membersList.length * transparencyMonths.length * 50
  
  // For 2026, expected yearly is 10 months (March-Dec). For future years, it's 12 months.
  const expectedMonthsInYear = currentYear === 2026 ? 10 : 12
  const expectedYearly = membersList.length * expectedMonthsInYear * 50

  // Build member contribution matrix
  const memberContributions = membersList.map(member => {
    const memberContribs = contributionsList.filter(c => c.member_id === member.id)
    const paidMonths = memberContribs.map(c => c.month)
    const totalPaid = memberContribs.reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

    return {
      member,
      paidMonths,
      totalPaid,
      monthsData: transparencyMonths.map(month => {
        const monthContribs = memberContribs.filter(c => c.month === month);
        return {
          month,
          paid: monthContribs.length > 0,
          amount: monthContribs.reduce((sum, c) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0),
        }
      }),
    }
  })

  const fullyPaidMembers = memberContributions.filter(
    m => m.monthsData.every(md => md.paid)
  ).length
  
  // Use Target Up To Now for the collection rate comparisons
  const expectedCollection = targetUpToNow > 0 ? targetUpToNow : monthlyTarget 

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-muted-foreground">Financial reports, member contribution status, and data export</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            {Array.from({ length: Math.max(1, actualYear - 2026 + 1) }, (_, i) => 2026 + i).map(y => (
              <a 
                key={y} 
                href={`?year=${y}`} 
                className={`px-3 py-1.5 text-sm rounded-md transition ${currentYear === y ? 'bg-background shadow font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {y}
              </a>
            ))}
          </div>
          <a
            href={`/api/export-excel?year=${currentYear}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow transition hover:bg-accent/90"
          >
            ⬇ Download Excel
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected ({currentYear})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCollected.toLocaleString()} Le</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expected (Min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetUpToNow.toLocaleString()} Le</div>
            <div className="mt-1 space-y-1">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{monthlyTarget.toLocaleString()} Le</span> Monthly Target
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{expectedYearly.toLocaleString()} Le</span> Yearly Minimum
              </p>
              <p className="text-[10px] text-muted-foreground italic border-t pt-1 mt-1">
                Target up to {transparencyMonths[transparencyMonths.length - 1] || 'None'} (since {MONTHS[startMonthIndex]})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expectedCollection > 0
                ? Math.round((totalCollected / expectedCollection) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fully Paid Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fullyPaidMembers} / {membersList.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Contribution Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Member Contributions - {currentYear}</CardTitle>
          <CardDescription>Payment status by member and month</CardDescription>
        </CardHeader>
        <CardContent>
          {memberContributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No approved members yet.
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-4">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Member</TableHead>
                    {transparencyMonths.map(month => (
                      <TableHead key={month} className="text-center min-w-[60px]">
                        {month.slice(0, 3)}
                      </TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberContributions.map(({ member, monthsData, totalPaid }) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      {monthsData.map(({ month, paid, amount }) => (
                        <TableCell key={month} className="text-center">
                          {paid ? (
                            <Badge
                              variant="default"
                              className="bg-accent hover:bg-accent text-xs"
                            >
                              {amount}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              -
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {totalPaid.toLocaleString()} Le
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest fund movements</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transactionsList.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          transaction.type === 'contribution' || transaction.type === 'bank_deposit'
                            ? 'default'
                            : 'secondary'
                        }
                        className="capitalize"
                      >
                        {transaction.type}
                      </Badge>
                      {transaction.category && (
                        <span className="text-sm text-muted-foreground">
                          {transaction.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()} by {transaction.creator?.full_name}
                    </p>
                  </div>
                  <div className={`text-right font-medium ${
                    transaction.type === 'withdrawal' || transaction.type === 'expense'
                      ? 'text-destructive'
                      : 'text-accent'
                  }`}>
                    {transaction.type === 'withdrawal' || transaction.type === 'expense' ? '-' : '+'}
                    {transaction.amount.toLocaleString()} Le
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
