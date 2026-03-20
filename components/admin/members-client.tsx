'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberActions } from '@/components/admin/member-actions'
import type { Member } from '@/lib/types'

const statusColors = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'destructive',
  suspended: 'outline',
} as const

const roleColors = {
  admin: 'default',
  treasurer: 'secondary',
  youth_coordinator: 'secondary' as const,
  member: 'outline',
} as const

interface MembersClientProps {
  initialMembers: Member[]
  defaultTab: string
  currentRole: string
}

export function MembersClient({ initialMembers, defaultTab, currentRole }: MembersClientProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, (payload) => {
        setMembers((current) => {
          if (payload.eventType === 'INSERT') {
            // Add new member if not exists
            if (!current.find(m => m.id === payload.new.id)) {
              return [payload.new as Member, ...current]
            }
            return current
          }
          if (payload.eventType === 'UPDATE') {
            // Update existing member
            return current.map(m => m.id === payload.new.id ? { ...m, ...payload.new } as Member : m)
          }
          if (payload.eventType === 'DELETE') {
            // Remove member
            return current.filter(m => m.id !== payload.old.id)
          }
          return current
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const approvedMembers = members.filter(m => m.status === 'approved')
  const pendingMembers = members.filter(m => m.status === 'pending')
  const rejectedMembers = members.filter(m => m.status === 'rejected')
  const suspendedMembers = members.filter(m => m.status === 'suspended')

  function MemberTable({ memberList, showActions = true }: { memberList: Member[]; showActions?: boolean }) {
    if (memberList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No members found
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {memberList.map((member) => (
          <div
            key={member.id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">{member.full_name}</p>
                <Badge variant={roleColors[member.role]} className="capitalize">
                  {member.role}
                </Badge>
                <Badge variant={statusColors[member.status]} className="capitalize">
                  {member.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                <p>{member.email}</p>
                <p>{member.phone}</p>
                <p>Joined: {new Date(member.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            {showActions && currentRole !== 'youth_coordinator' && (
              <MemberActions member={member} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Members</CardTitle>
        <CardDescription>
          {members.length} total member{members.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2 gap-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="approved">
              Approved ({approvedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingMembers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Suspended ({suspendedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approved">
            <MemberTable memberList={approvedMembers} />
          </TabsContent>

          <TabsContent value="pending">
            <MemberTable memberList={pendingMembers} />
          </TabsContent>

          <TabsContent value="rejected">
            <MemberTable memberList={rejectedMembers} />
          </TabsContent>

          <TabsContent value="suspended">
            <MemberTable memberList={suspendedMembers} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
