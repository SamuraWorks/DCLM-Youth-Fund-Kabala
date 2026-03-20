'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Megaphone } from 'lucide-react'

export function DecisionNotificationForm() {
  const [title, setTitle] = useState('Management Decision')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!title.trim() || !message.trim()) {
      setError('Title and message are required')
      return
    }

    setIsLoading(true)

    try {
      // 1. Get all approved members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id')
        .eq('status', 'approved')

      if (membersError) throw membersError

      if (!members || members.length === 0) {
        setError('No approved members found to notify.')
        setIsLoading(false)
        return
      }

      // 2. Create notifications for all of them
      const notifications = members.map(m => ({
        member_id: m.id,
        type: 'announcement',
        title: title.trim(),
        message: message.trim(),
        is_read: false
      }))

      const { error: notifyError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notifyError) throw notifyError

      setSuccess(true)
      setMessage('')
    } catch (err) {
      console.error('Error sending notifications:', err)
      setError('Failed to send notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-accent/50 bg-accent/5">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent text-sm">Decision notification sent to all approved members!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <Field>
          <FieldLabel>Notification Title</FieldLabel>
          <Input
            placeholder="e.g., Change in Contribution Policy"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        <Field>
          <FieldLabel>Decision Details / Message</FieldLabel>
          <Textarea
            placeholder="Describe the decision made by management..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            rows={4}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? <Spinner className="mr-2" /> : <Megaphone className="mr-2 h-4 w-4" />}
        Broadcast to All Members
      </Button>
    </form>
  )
}
