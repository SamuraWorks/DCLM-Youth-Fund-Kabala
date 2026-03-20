'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'
import { MINIMUM_CONTRIBUTION, PAYMENT_METHODS } from '@/lib/types'
import type { PaymentMethod } from '@/lib/types'

interface ContributionFormProps {
  memberId: string
  availableMonths: string[]
  currentYear: number
}

export function ContributionForm({ memberId, availableMonths, currentYear }: ContributionFormProps) {
  const [month, setMonth] = useState('')
  const [amount, setAmount] = useState(MINIMUM_CONTRIBUTION.toString())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!month || !paymentMethod) {
      setError('Please select a month and payment method')
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < MINIMUM_CONTRIBUTION) {
      setError(`Minimum contribution is ${MINIMUM_CONTRIBUTION} Leones`)
      return
    }

    setIsLoading(true)

    try {
      let proofUrl: string | null = null

      // Upload proof if provided
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${memberId}/${currentYear}-${month}-${Date.now()}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, proofFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          // Continue without proof if upload fails
        } else if (data) {
          const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(data.path)
          proofUrl = urlData.publicUrl
        }
      }

      // Insert contribution
      const totalAmount = numAmount
      const monthly_amount = 50
      const extra_amount = Math.max(0, totalAmount - 50)

      const { error: insertError } = await supabase.from('contributions').insert({
        member_id: memberId,
        monthly_amount,
        extra_amount,
        month,
        year: currentYear,
        payment_method: paymentMethod,
        payment_reference: paymentReference || null,
        proof_url: proofUrl,
        notes: notes || null,
        status: 'pending',
        verified: false,
      })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      setMonth('')
      setAmount(MINIMUM_CONTRIBUTION.toString())
      setPaymentMethod('')
      setPaymentReference('')
      setNotes('')
      setProofFile(null)

      // Refresh the page to update the month status
      router.refresh()
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(`System rejected submission: ${err?.message || JSON.stringify(err)}`)
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
          <AlertDescription className="text-accent">
            Contribution submitted successfully! An admin will verify your payment.
          </AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Field>
          <FieldLabel>Month</FieldLabel>
          <Select value={month} onValueChange={setMonth} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => (
                <SelectItem key={m} value={m}>
                  {m} {currentYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Amount (Leones)</FieldLabel>
          <Input
            type="number"
            min={MINIMUM_CONTRIBUTION}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        <Field>
          <FieldLabel>Payment Method</FieldLabel>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel>Payment Reference (Optional)</FieldLabel>
          <Input
            placeholder="Transaction ID or reference number"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        {/* Payment Proof disabled for now per user request */}
        {/* <Field>
          <FieldLabel>Payment Proof (Optional)</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              disabled={isLoading}
              className="cursor-pointer"
            />
          </div>
          {proofFile && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {proofFile.name}
            </p>
          )}
        </Field> */}

        <Field>
          <FieldLabel>Notes (Optional)</FieldLabel>
          <Textarea
            placeholder="Any additional information"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={2}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
        Submit Contribution
      </Button>
    </form>
  )
}
