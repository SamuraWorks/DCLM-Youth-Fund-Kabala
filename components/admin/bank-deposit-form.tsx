'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react'

export function BankDepositForm() {
  const [amount, setAmount] = useState('')
  const [depositDate, setDepositDate] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!amount || !depositDate || !bankName || !accountNumber) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) throw new Error('Member not found')

      let slipUrl: string | null = null

      // Upload deposit slip if provided
      if (slipFile) {
        const fileExt = slipFile.name.split('.').pop()
        const fileName = `deposit-slips/${Date.now()}.${fileExt}`

        const { error: uploadError, data } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, slipFile)

        if (!uploadError && data) {
          const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(data.path)
          slipUrl = urlData.publicUrl
        }
      }

      // Insert deposit record
      const { error: insertError } = await supabase.from('bank_deposits').insert({
        amount: parseFloat(amount),
        deposit_date: depositDate,
        bank_name: bankName,
        account_number: accountNumber,
        deposit_slip_url: slipUrl,
        deposited_by: member.id,
        notes: notes || null,
      })

      if (insertError) throw insertError

      // Create transaction record
      await supabase.from('transactions').insert({
        type: 'deposit',
        amount: parseFloat(amount),
        description: `Bank deposit to ${bankName} (${accountNumber})`,
        created_by: member.id,
      })

      setSuccess(true)
      setAmount('')
      setDepositDate('')
      setBankName('')
      setAccountNumber('')
      setNotes('')
      setSlipFile(null)
      router.refresh()
    } catch (err) {
      console.error('Error recording deposit:', err)
      setError('Failed to record deposit. Please try again.')
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
          <AlertDescription className="text-accent">Deposit recorded successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel>Amount (Leones)</FieldLabel>
          <Input
            type="number"
            min="1"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <FieldLabel>Deposit Date</FieldLabel>
          <Input
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <FieldLabel>Bank Name</FieldLabel>
          <Input
            placeholder="e.g., Sierra Leone Commercial Bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <FieldLabel>Account Number</FieldLabel>
          <Input
            placeholder="Bank account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            disabled={isLoading}
            required
          />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Deposit Slip (Optional)</FieldLabel>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
            disabled={isLoading}
            className="cursor-pointer"
          />
          {slipFile && (
            <p className="text-xs text-muted-foreground mt-1">Selected: {slipFile.name}</p>
          )}
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel>Notes (Optional)</FieldLabel>
          <Textarea
            placeholder="Any additional information..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            rows={2}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Spinner className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
        Record Deposit
      </Button>
    </form>
  )
}
