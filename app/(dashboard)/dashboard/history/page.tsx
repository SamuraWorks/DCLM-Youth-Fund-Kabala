import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import Link from 'next/link'
import type { Contribution } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let { data: member } = user ? await supabase.from('members').select('*').eq('user_id', user.id).single() : { data: null }
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  
  if (isAdmin) {
    if (!member) member = { id: user?.id, user_id: user?.id, full_name: user?.user_metadata?.full_name || 'Admin', role: 'admin', status: 'approved' } as any
    else member.role = 'admin'
  }

  if (!user || !member) return <div className="p-8 text-center text-muted-foreground">Please sign in to access this page.</div>

  // Get all contributions ordered by date
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', member.id)
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  const contributionsList = (contributions || []) as Contribution[]

  // Calculate totals
  const totalPaid = contributionsList
    .filter(c => c.status === 'verified')
    .reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

  const pendingAmount = contributionsList
    .filter(c => c.status === 'pending')
    .reduce((sum: number, c: any) => sum + Number(c.monthly_amount) + Number(c.extra_amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment History</h1>
          <p className="text-muted-foreground">View all your contribution records</p>
        </div>
        <BackButton />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalPaid.toLocaleString()} Le</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingAmount.toLocaleString()} Le</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributionsList.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contributions</CardTitle>
          <CardDescription>Complete history of your payment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {contributionsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No contributions yet</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/dashboard/contributions">Make Your First Contribution</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-4">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Proof</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributionsList.map((contribution) => (
                    <TableRow key={contribution.id}>
                      <TableCell className="font-medium">
                        {contribution.month} {contribution.year}
                      </TableCell>
                      <TableCell>{(Number(contribution.monthly_amount) + Number(contribution.extra_amount)).toLocaleString()} Le</TableCell>
                      <TableCell className="capitalize">
                        {contribution.payment_method.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contribution.status === 'verified' && (
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                          )}
                          {contribution.status === 'pending' && (
                            <Clock className="h-4 w-4 text-warning" />
                          )}
                          {contribution.status === 'rejected' && (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
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
                        {contribution.status === 'rejected' && contribution.rejection_reason && (
                          <p className="text-xs text-destructive mt-1">
                            {contribution.rejection_reason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contribution.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {contribution.proof_url ? (
                          <a
                            href={contribution.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-primary hover:underline text-sm"
                          >
                            View
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
