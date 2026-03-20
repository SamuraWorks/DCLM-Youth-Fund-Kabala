import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContributionForm } from '@/components/contributions/contribution-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/ui/back-button'
import { MONTHS, MINIMUM_CONTRIBUTION } from '@/lib/types'
import type { Contribution } from '@/lib/types'

export default async function ContributionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let { data: member } = user ? await supabase.from('members').select('*').eq('user_id', user.id).single() : { data: null }
  const ADMIN_EMAILS = ['samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com']
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  
  if (isAdmin) {
    if (!member) member = { id: user?.id, user_id: user?.id, full_name: user?.user_metadata?.full_name || 'Admin', role: 'admin', status: 'approved' } as any
    else member.role = 'admin'
  }

  if (!user || !member) return <div className="p-8 text-center text-muted-foreground">Please sign in to access this page.</div>

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Get contributions for current year
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', member.id)
    .eq('year', currentYear)

  const contributionsList = (contributions || []) as Contribution[]

  // Get months that are paid or pending
  const paidOrPendingMonths = contributionsList
    .filter(c => c.status === 'verified' || c.status === 'pending')
    .map(c => c.month)

  // Months available for payment (up to current month, excluding paid/pending)
  const availableMonths = MONTHS.slice(2, Math.max(3, currentMonth + 1))
    .filter(month => !paidOrPendingMonths.includes(month))

  // Create month status map
  const monthStatusMap = new Map<string, { status: string; contribution?: Contribution }>()
  MONTHS.slice(2, Math.max(3, currentMonth + 1)).forEach((month: string) => {
    const contribution = contributionsList.find(c => c.month === month)
    if (contribution) {
      monthStatusMap.set(month, { status: contribution.status, contribution })
    } else {
      monthStatusMap.set(month, { status: 'unpaid' })
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Make Contribution</h1>
          <p className="text-muted-foreground">Submit your monthly contribution with payment proof</p>
        </div>
        <BackButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Payment</CardTitle>
            <CardDescription>
              Minimum contribution: {MINIMUM_CONTRIBUTION} Leones per month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableMonths.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>All months are either paid or pending verification.</p>
                <p className="text-sm mt-2">Check your payment history for status updates.</p>
              </div>
            ) : (
              <ContributionForm 
                memberId={member.id} 
                availableMonths={availableMonths}
                currentYear={currentYear}
              />
            )}
          </CardContent>
        </Card>

        {/* Monthly Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status - {currentYear}</CardTitle>
            <CardDescription>Overview of your monthly contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {MONTHS.slice(2, Math.max(3, currentMonth + 1)).map(month => {
                const info = monthStatusMap.get(month)
                return (
                  <div
                    key={month}
                    className={`rounded-lg border p-3 text-center ${
                      info?.status === 'verified'
                        ? 'border-accent/50 bg-accent/5'
                        : info?.status === 'pending'
                        ? 'border-warning/50 bg-warning/5'
                        : info?.status === 'rejected'
                        ? 'border-destructive/50 bg-destructive/5'
                        : 'border-muted'
                    }`}
                  >
                    <p className="text-sm font-medium">{month.slice(0, 3)}</p>
                    <Badge
                      variant={
                        info?.status === 'verified'
                          ? 'default'
                          : info?.status === 'pending'
                          ? 'secondary'
                          : info?.status === 'rejected'
                          ? 'destructive'
                          : 'outline'
                      }
                      className="mt-1 text-xs capitalize"
                    >
                      {info?.status || 'unpaid'}
                    </Badge>
                    {info?.contribution && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(Number(info.contribution.monthly_amount) + Number(info.contribution.extra_amount || 0))} Le
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-4">
          <div>
            <p className="font-medium text-foreground">Orange Money / Africell Money</p>
            <p>Send payment to **+232 74 172197** (Orange Money) and include your name as reference.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Bank Transfer</p>
            <p>Transfer to the DLKYF account and use your member ID as reference.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Cash</p>
            <p>Hand cash to the treasurer and request a receipt.</p>
          </div>
          <p className="text-xs border-t pt-4">
            Important: Always take a screenshot or photo of your payment confirmation 
            and upload it as proof. Payments without proof may take longer to verify.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
