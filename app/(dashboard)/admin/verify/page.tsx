import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PaymentVerification } from '@/components/admin/payment-verification'
import { BackButton } from '@/components/ui/back-button'
import { ExternalLink } from 'lucide-react'
import type { Contribution, Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function VerifyPage() {
  const supabase = await createClient()

  // Get all contributions with member info
  const { data: contributions } = await supabase
    .from('contributions')
    .select('*, member:members!contributions_member_id_fkey(*), verifier:members!contributions_verified_by_fkey(*)')
    .order('created_at', { ascending: false })

  // Get current user role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentMember } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user?.id)
    .single()
  
  const role = currentMember?.role || 'member'
  const isManagement = role === 'admin' || role === 'treasurer'

  const contributionsList = (contributions || []) as (Contribution & { 
    member: Member
    verifier: Member | null 
  })[]

  const pendingContributions = contributionsList.filter(c => c.status === 'pending')
  const verifiedContributions = contributionsList.filter(c => c.status === 'verified')
  const rejectedContributions = contributionsList.filter(c => c.status === 'rejected')

  function ContributionTable({ 
    contributions, 
    showActions = false 
  }: { 
    contributions: (Contribution & { member: Member; verifier: Member | null })[]
    showActions?: boolean 
  }) {
    if (contributions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No contributions found
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {contributions.map((contribution) => (
          <div
            key={contribution.id}
            className="rounded-lg border p-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{contribution.member?.full_name}</p>
                  <Badge variant="secondary" className="capitalize">
                    {contribution.payment_method.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                  <p>Period: {contribution.month} {contribution.year}</p>
                  <p>Amount: <span className="font-medium text-foreground">{(Number(contribution.monthly_amount) + Number(contribution.extra_amount || 0)).toLocaleString()} Le</span></p>
                  {contribution.payment_reference && (
                    <p>Reference: {contribution.payment_reference}</p>
                  )}
                  {contribution.notes && (
                    <p>Notes: {contribution.notes}</p>
                  )}
                  <p>Submitted: {new Date(contribution.created_at).toLocaleDateString()}</p>
                  {contribution.verifier && (
                    <p>Verified by: {contribution.verifier.full_name}</p>
                  )}
                  {contribution.rejection_reason && (
                    <p className="text-destructive">Rejection reason: {contribution.rejection_reason}</p>
                  )}
                </div>
                {contribution.proof_url && (
                  <a
                    href={contribution.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline mt-2"
                  >
                    View Payment Proof
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
              {showActions && (
                <PaymentVerification contribution={contribution} />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Verification</h1>
          <p className="text-muted-foreground">Review and verify member contributions</p>
        </div>
        <BackButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contributions</CardTitle>
          <CardDescription>
            {pendingContributions.length} pending verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending ({pendingContributions.length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({verifiedContributions.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedContributions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ContributionTable contributions={pendingContributions} showActions={isManagement} />
            </TabsContent>

            <TabsContent value="verified">
              <ContributionTable contributions={verifiedContributions} />
            </TabsContent>

            <TabsContent value="rejected">
              <ContributionTable contributions={rejectedContributions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
