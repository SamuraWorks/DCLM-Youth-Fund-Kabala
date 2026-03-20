import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCircle2, AlertCircle, Megaphone, Wallet } from 'lucide-react'
import type { Notification } from '@/lib/types'

const notificationIcons: Record<string, any> = {
  payment_verified: CheckCircle2,
  payment_rejected: AlertCircle,
  payment_reminder: Wallet,
  announcement: Megaphone,
  fund_update: Bell,
  withdrawal: Wallet,
}

const notificationColors: Record<string, string> = {
  payment_verified: 'text-accent',
  payment_rejected: 'text-destructive',
  payment_reminder: 'text-warning',
  announcement: 'text-primary',
  fund_update: 'text-primary',
  withdrawal: 'text-accent',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let { data: member } = user ? await supabase.from('members').select('id, role').eq('user_id', user.id).single() : { data: null }

  if (!user || !member) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view notifications.</div>
  }

  // Get notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  const notificationsList = (notifications || []) as Notification[]

  // Mark unread as read
  const unreadIds = notificationsList.filter(n => !n.is_read).map(n => n.id)
  if (unreadIds.length > 0) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on your account activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            {notificationsList.length} notification{notificationsList.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationsList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-30" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">{"You'll"} see updates about your payments here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificationsList.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell
                const iconColor = notificationColors[notification.type] || 'text-muted-foreground'

                return (
                  <div
                    key={notification.id}
                    className={`flex gap-4 rounded-lg border p-4 ${
                      !notification.is_read ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">{notification.title}</p>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="shrink-0">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleDateString()} at{' '}
                        {new Date(notification.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
