import { createClient } from '@/lib/supabase/server'
import { BackButton } from '@/components/ui/back-button'
import { MembersClient } from '@/components/admin/members-client'
import type { Member } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Get all members
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false })

  // Get current user role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentMember } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user?.id)
    .single()
  
  const role = currentMember?.role || 'member'

  const defaultTab = params.status || 'approved'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground">Manage member accounts and approvals</p>
        </div>
        <BackButton />
      </div>

      <MembersClient 
        initialMembers={(members || []) as Member[]} 
        defaultTab={defaultTab} 
        currentRole={role}
      />
    </div>
  )
}
