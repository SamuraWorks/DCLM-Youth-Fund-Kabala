import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Member } from '@/lib/types'
import { AuthGuard } from '@/components/auth/auth-guard'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  console.log('AdminLayout trace - User:', user?.id, user?.email)

  if (!user) {
    console.log('DashboardLayout trace - No user found, stopping render')
    return <div className="p-8 text-center text-muted-foreground">Please sign in to DCLM Youth Fund, Kabala to access your dashboard.</div>
  }

  let { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  
  console.log('AdminLayout trace - Member fetched:', member?.id, 'Role:', member?.role)

  if (!member) {
    console.log('AdminLayout trace - No member found for admin email, attempting salvage...')
    
    // Check if user is in authorized list
    const AUTHORIZED_ADMINS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
    const isAdminEmail = AUTHORIZED_ADMINS.includes((user.email || '').toLowerCase())
    
    if (isAdminEmail) {
      // Auto-salvage admin profile with Service Role
      const { data: newMember, error: insertError } = await (await createAdminClient()).from('members').insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin User',
        role: 'admin',
        status: 'approved'
      }).select().maybeSingle()
      
      if (newMember) {
        console.log('AdminLayout trace - Admin salvage successful:', newMember.id)
        member = newMember
      } else {
        console.error('AdminLayout trace - Admin salvage failed, using virtual admin:', insertError)
        member = {
          id: 'virtual-admin-' + user.id,
          user_id: user.id,
          email: user.email,
          role: 'admin',
          status: 'approved',
          full_name: user.user_metadata?.full_name || 'Admin User'
        } as Member
      }
      member = null
    }
  }

  // REMOVED: All automatic redirects.
  // The client-side AuthGuard handles authorization UI. grant.

  return (
    <AuthGuard adminOnly>
      <div className="flex-1">
        {children}
      </div>
    </AuthGuard>
  )
}
