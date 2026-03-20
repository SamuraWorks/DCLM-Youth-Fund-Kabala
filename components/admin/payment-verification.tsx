'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Contribution, Member } from '@/lib/types'

interface PaymentVerificationProps {
  contribution: Contribution & { member: Member }
}

export function PaymentVerification({ contribution }: PaymentVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function verifyPayment() {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: verifier } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single()

      if (!verifier) throw new Error('Verifier not found')

      // Update contribution status
      const { error } = await supabase
        .from('contributions')
        .update({
          status: 'verified',
          verified: true,
          verified_by: verifier.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', contribution.id)

      if (error) throw error

      const totalAmount = Number(contribution.monthly_amount) + Number(contribution.extra_amount)

      // Write immutable ledger entry
      await supabase.from('ledger_entries').insert({
        type: contribution.extra_amount > 0 ? 'extra_contribution' : 'contribution',
        amount: totalAmount,
        description: `Contribution approved: ${contribution.member.full_name} — ${contribution.month} ${contribution.year}`,
        member_id: contribution.member_id,
        member_name: contribution.member.full_name,
        approved_by: verifier.id,
        approved_by_name: verifier.full_name,
        reference_id: contribution.id,
        payment_source: contribution.payment_method,
      })

      // Update fund balance
      const { data: generalCategory } = await supabase
        .from('fund_categories')
        .select('id')
        .eq('name', 'general')
        .single()

      if (generalCategory) {
        const { data: balance } = await supabase
          .from('fund_balances')
          .select('id, balance')
          .eq('category_id', generalCategory.id)
          .single()

        if (balance) {
          const newBalance = Number(balance.balance) + totalAmount
          await supabase
            .from('fund_balances')
            .update({
              balance: newBalance,
              last_updated: new Date().toISOString(),
            })
            .eq('id', balance.id)
        }
      }

      // Notify member
      await supabase.from('notifications').insert({
        member_id: contribution.member_id,
        type: 'payment_verified',
        title: '✅ Payment Verified',
        message: `Your contribution of ${totalAmount.toLocaleString()} Le for ${contribution.month} ${contribution.year} has been verified by ${verifier.full_name}. Thank you!`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error verifying payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function rejectPayment() {
    if (!rejectionReason.trim()) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: verifier } = await supabase
        .from('members')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single()

      if (!verifier) throw new Error('Verifier not found')

      // Update contribution status
      const { error } = await supabase
        .from('contributions')
        .update({
          status: 'rejected',
          verified_by: verifier.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contribution.id)

      if (error) throw error

      // Notify member
      await supabase.from('notifications').insert({
        member_id: contribution.member_id,
        type: 'payment_rejected',
        title: '❌ Payment Rejected',
        message: `Your contribution for ${contribution.month} ${contribution.year} was rejected by ${verifier.full_name}. Reason: ${rejectionReason}. Please resubmit.`,
      })

      setShowRejectDialog(false)
      setRejectionReason('')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting payment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={verifyPayment}
          disabled={isLoading}
          className="bg-accent hover:bg-accent/90"
        >
          {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Verify
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isLoading}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The member will be notified.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={rejectPayment}
              disabled={isLoading || !rejectionReason.trim()}
            >
              {isLoading ? <Spinner className="mr-2" /> : null}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
