export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Users, Wallet, LogOut } from 'lucide-react'
import { ContributionForm } from '@/components/contributions/contribution-form'
import { MONTHS } from '@/lib/types'
import { Button } from '@/components/ui/button'

export default async function PendingApprovalPage() {
  const supabase = await createClient()

  // Safely get user
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData?.user

  if (userError || !user) {
    redirect('/auth/login')
  }

  // Find member
  let { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  // Salvage logic (In case of trigger failures)
  if (!member) {
    const { data: existingByEmail } = await supabase
      .from('members')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()

    if (existingByEmail) {
      const { data: linkedMember } = await supabase
        .from('members')
        .update({ user_id: user.id })
        .eq('id', existingByEmail.id)
        .select()
        .single()
      member = linkedMember
    } else {
      const adminEmails = [
        'samuel540wisesamura@gmail.com',
        'paulannehk@gmail.com',
        'princessconteh673@gmail.com',
        'jonathanksenessie@gmail.com' // Coordinator auto-approval
      ]
      const isAdminEmail = adminEmails.includes(user.email || '')
      const isCoordinator = user.email === 'jonathanksenessie@gmail.com'

      const { data: newMember } = await supabase.from('members').insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'New Member',
        phone: user.user_metadata?.phone || 'N/A',
        role: isCoordinator ? 'youth_coordinator' : (isAdminEmail ? 'admin' : 'member'),
        status: (isCoordinator || isAdminEmail) ? 'approved' : 'pending',
        joined_date: new Date().toISOString().split('T')[0]
      }).select().maybeSingle()
      
      member = newMember
    }
  }

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Sync Error</CardTitle>
            <CardDescription>We encountered an issue creating your member profile. Please try logging out and back in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action="/api/auth/sign-out" method="POST">
              <Button type="submit" variant="outline" className="w-full">Sign Out</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Redirect if already approved
  if (member.status === 'approved') {
    redirect('/')
  }

  const currentYear = new Date().getFullYear()
  
  // Get contributions
  const { data: contributions } = await supabase
    .from('contributions')
    .select('month')
    .eq('member_id', member.id)
    .eq('year', currentYear)

  const paidMonths = (contributions || []).map((c: any) => c.month)
  const availableMonths = (MONTHS as unknown as string[]).slice(2).filter((m: string) => !paidMonths.includes(m))

  const statusMessages = {
    pending: {
      title: 'Awaiting Approval',
      description: 'Your application is under review by the Youth Coordinator. You will gain full access once verified.',
      icon: Clock,
      color: 'text-warning'
    },
    rejected: {
      title: 'Application Rejected',
      description: 'Unfortunately, your registration was not approved. Profile details mismatch.',
      icon: AlertCircleIcon, // Using a fallback if not imported
      color: 'text-destructive'
    },
    suspended: {
      title: 'Account Suspended',
      description: 'This account has been temporarily disabled. Contact admin.',
      icon: AlertCircleIcon,
      color: 'text-destructive'
    },
  }

  const status = statusMessages[member.status as keyof typeof statusMessages] || statusMessages.pending
  const StatusIcon = status.icon || Clock

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12 text-center">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white overflow-hidden border shadow-sm">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">DCLM Youth Fund, Kabala</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-60">Production System</p>
      </div>

      <Card className="w-full max-w-lg border-accent/20">
        <CardHeader>
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted`}>
            <StatusIcon className={`h-6 w-6 ${status.color || 'text-warning'}`} />
          </div>
          <CardTitle className="text-lg">{status.title}</CardTitle>
          <CardDescription>{status.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-xs text-left">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-bold text-muted-foreground uppercase">Member:</span>
              <span className="col-span-2 font-medium">{member.full_name}</span>
              <span className="font-bold text-muted-foreground uppercase">Role:</span>
              <span className="col-span-2 font-bold text-accent capitalize">{member.role.replace('_', ' ')}</span>
            </div>
          </div>

          {member.status === 'pending' && (
            <div className="mt-4 border-t border-border pt-6">
              <h3 className="flex items-center justify-center gap-2 text-md font-bold mb-4">
                <Wallet className="h-4 w-4 text-accent" />
                Pay for Activation
              </h3>
              <ContributionForm 
                memberId={member.id} 
                availableMonths={availableMonths} 
                currentYear={currentYear} 
              />
            </div>
          )}

          <div className="pt-4">
            <form action="/api/auth/sign-out" method="POST">
              <Button type="submit" variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Minimal fallback icon if Lucide alert is missing or broken in SSR
function AlertCircleIcon({ className }: { className?: string }) {
  return <Clock className={className} />
}
