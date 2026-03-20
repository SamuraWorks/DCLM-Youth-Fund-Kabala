'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { MoreHorizontal, UserCheck, UserX, Shield, Ban } from 'lucide-react'
import type { Member, MemberRole, MemberStatus } from '@/lib/types'

interface MemberActionsProps {
  member: Member
}

export function MemberActions({ member }: MemberActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<MemberRole>(member.role)
  const router = useRouter()
  const supabase = createClient()

  async function updateMemberStatus(status: MemberStatus) {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', member.id)

      if (error) throw error

      // Create notification for the member
      await supabase.from('notifications').insert({
        member_id: member.id,
        type: status === 'approved' ? 'announcement' : 'announcement',
        title: status === 'approved' ? 'Membership Approved' : `Membership ${status}`,
        message: status === 'approved'
          ? 'Welcome to DCLM Youth Fund, Kabala! Your membership has been approved. You can now make contributions.'
          : `Your membership status has been updated to: ${status}`,
      })

      // Dispatch Approval Email (Step 4 of User Flow)
      if (status === 'approved') {
        fetch('/api/email/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: member.email, name: member.full_name })
        }).catch(err => console.error('Failed to trigger approval email:', err))
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating member status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateMemberRole() {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ role: selectedRole, updated_at: new Date().toISOString() })
        .eq('id', member.id)

      if (error) throw error

      setShowRoleDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating member role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            {isLoading ? <Spinner className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {member.status === 'pending' && (
            <>
              <DropdownMenuItem onClick={() => updateMemberStatus('approved')}>
                <UserCheck className="mr-2 h-4 w-4 text-accent" />
                Approve Member
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateMemberStatus('rejected')}>
                <UserX className="mr-2 h-4 w-4 text-destructive" />
                Reject Application
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {member.status === 'approved' && (
            <>
              <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
                <Shield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateMemberStatus('suspended')}>
                <Ban className="mr-2 h-4 w-4 text-warning" />
                Suspend Member
              </DropdownMenuItem>
            </>
          )}

          {member.status === 'suspended' && (
            <DropdownMenuItem onClick={() => updateMemberStatus('approved')}>
              <UserCheck className="mr-2 h-4 w-4 text-accent" />
              Reactivate Member
            </DropdownMenuItem>
          )}

          {member.status === 'rejected' && (
            <DropdownMenuItem onClick={() => updateMemberStatus('approved')}>
              <UserCheck className="mr-2 h-4 w-4 text-accent" />
              Approve Member
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update the role for {member.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as MemberRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="treasurer">Treasurer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateMemberRole} disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
