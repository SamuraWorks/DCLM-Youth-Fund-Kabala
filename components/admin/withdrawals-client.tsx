'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowDownLeft, CheckCircle } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/types'

interface WithdrawalFormData {
  amount: string
  reason: string
  source: string
}

export default function WithdrawalsClientPage({ 
  withdrawals, 
  fundBalances 
}: { 
  withdrawals: any[]
  fundBalances: any[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<WithdrawalFormData>({ amount: '', reason: '', source: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalFundBalance = fundBalances.reduce((sum: number, b: any) => sum + (b.balance || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!form.reason.trim()) {
      setError('Please provide a reason for the withdrawal')
      return
    }
    if (!form.source) {
      setError('Please select a payment source')
      return
    }
    if (amount > totalFundBalance) {
      setError(`Withdrawal amount exceeds fund balance of ${totalFundBalance.toLocaleString()} Le`)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: form.reason, source: form.source }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record withdrawal')

      setSuccess(`Withdrawal of ${amount.toLocaleString()} Le recorded. Transaction ID: ${data.transaction_id}`)
      setForm({ amount: '', reason: '', source: '' })
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fund Withdrawals</h1>
        <p className="text-muted-foreground">Record and track fund withdrawals</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {fundBalances.map((balance: any) => (
          <Card key={balance.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {balance.category?.name || 'Fund'} Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(balance.balance || 0).toLocaleString()} Le</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-destructive" />
            Record New Withdrawal
          </CardTitle>
          <CardDescription>
            Admin-only. All withdrawals are logged immutably with your name and timestamp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (Leones)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Source (where funds come from)</label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Withdrawal</label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Describe the purpose of this withdrawal..."
                rows={3}
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Total fund balance</span>
              <span className="font-bold">{totalFundBalance.toLocaleString()} Le</span>
            </div>

            <Button type="submit" variant="destructive" disabled={isLoading}>
              {isLoading ? 'Recording...' : 'Record Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>All past withdrawals with admin accountability trail</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No withdrawals recorded yet</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{withdrawal.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      Source: {withdrawal.source.replace('_', ' ')} • Approved by: {withdrawal.approved_by_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">-{withdrawal.amount.toLocaleString()} Le</p>
                    <Badge variant="outline" className="text-xs">Recorded</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
