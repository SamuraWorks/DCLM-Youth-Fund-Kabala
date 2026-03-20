import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import type { Member } from '@/lib/types'
import { AuthGuard } from '@/components/auth/auth-guard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  console.log('DashboardLayout trace - User:', user?.id, user?.email)

  if (!user) {
    console.log('DashboardLayout trace - No user found, stopping render')
    return <div className="p-8 text-center text-muted-foreground">Please sign in to access this page.</div>
  }

  let { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  
  console.log('DashboardLayout trace - Member fetched:', member?.id, 'Role:', member?.role, 'Status:', member?.status)

  if (!member) {
    console.log('DashboardLayout trace - No member found, attempting salvage...')
    // Auto-salvage: create member row if trigger failed
    const adminEmails = [
      'samuel540wisesamura@gmail.com',
      'paulannehk@gmail.com',
      'princessconteh673@gmail.com'
    ]
    const coordinatorEmails = ['jonathanksenessie@gmail.com']
    const isAdminEmail = adminEmails.includes(user.email || '')
    const isCoordinatorEmail = coordinatorEmails.includes(user.email || '')
    
    const { data: newMember, error: insertError } = await (await createAdminClient()).from('members').insert({
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || 'New Member',
      phone: user.user_metadata?.phone || 'N/A',
      role: isAdminEmail ? 'admin' : (isCoordinatorEmail ? 'youth_coordinator' : 'member'),
      status: (isAdminEmail || isCoordinatorEmail) ? 'approved' : 'pending',
      joined_date: new Date().toISOString()
    }).select().maybeSingle()
    
    if (newMember) {
      console.log('DashboardLayout trace - Salvage successful:', newMember.id)
      member = newMember as Member;
    } else {
      console.error('DashboardLayout trace - Salvage failed, falling back to virtual member:', insertError)
      // FINAL FALLBACK: Create a virtual member object that satisfies the Member interface
      const now = new Date().toISOString()
      member = {
        id: 'virtual-' + user.id,
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'New Member',
        phone: user.user_metadata?.phone || 'N/A',
        role: isAdminEmail ? 'admin' : (isCoordinatorEmail ? 'youth_coordinator' : 'member'),
        status: (isAdminEmail || isCoordinatorEmail) ? 'approved' : 'pending',
        joined_date: now,
        created_at: now,
        updated_at: now
      } as Member
    }
  }

  // Auto-approve admins/coordinators that were accidentally created as pending
  if (member && (member.role === 'admin' || member.role === 'treasurer' || member.role === 'youth_coordinator') && member.status !== 'approved') {
    console.log('DashboardLayout trace - Auto-approving privileged role')
    await (await createAdminClient()).from('members').update({ status: 'approved' }).eq('id', member.id)
    member = { ...member, status: 'approved' }
  }

  // REDIRECTION: Send unapproved members to the pending status page.
  if (member && member.role === 'member' && member.status !== 'approved') {
    redirect('/pending-approval')
  }

  // Fetch unread notifications count
  // Handle virtual members by skipping the notification check (they won't have any)
  let unreadCount = 0
  if (!member.id.startsWith('virtual-')) {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', member.id)
      .eq('is_read', false)
    unreadCount = count || 0
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <DashboardSidebar member={member} />
        <SidebarInset>
          <DashboardHeader member={member} unreadCount={unreadCount} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
