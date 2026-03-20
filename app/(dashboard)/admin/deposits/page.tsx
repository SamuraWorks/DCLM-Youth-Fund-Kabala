import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BankDepositForm } from '@/components/admin/bank-deposit-form'
import { ExternalLink, Building2 } from 'lucide-react'
import type { BankDeposit, Member } from '@/lib/types'

export default async function DepositsPage() {
  const supabase = await createClient()

  // Get all bank deposits with depositor info
  const { data: deposits } = await supabase
    .from('bank_deposits')
    .select('*, depositor:members!bank_deposits_deposited_by_fkey(*)')
    .order('deposit_date', { ascending: false })

  const depositsList = (deposits || []) as (BankDeposit & { depositor: Member })[]

  const totalDeposited = depositsList.reduce((sum: number, d: any) => sum + d.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bank Deposits</h1>
        <p className="text-muted-foreground">Track bank deposits and upload deposit slips</p>
      </div>

      {/* Total Deposited */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Total Bank Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{totalDeposited.toLocaleString()} Le</div>
          <p className="text-sm text-muted-foreground mt-1">
            {depositsList.length} deposit record{depositsList.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Add Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Record Bank Deposit</CardTitle>
          <CardDescription>Add a new bank deposit record with proof</CardDescription>
        </CardHeader>
        <CardContent>
          <BankDepositForm />
        </CardContent>
      </Card>

      {/* Deposits List */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
          <CardDescription>All recorded bank deposits</CardDescription>
        </CardHeader>
        <CardContent>
          {depositsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bank deposits recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {depositsList.map((deposit) => (
                <div key={deposit.id} className="rounded-lg border p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{deposit.amount.toLocaleString()} Le</p>
                        <Badge variant="outline">{deposit.bank_name}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                        <p>Account: {deposit.account_number}</p>
                        <p>Date: {new Date(deposit.deposit_date).toLocaleDateString()}</p>
                        <p>Deposited by: {deposit.depositor?.full_name}</p>
                        {deposit.notes && <p>Notes: {deposit.notes}</p>}
                      </div>
                    </div>
                    {deposit.deposit_slip_url && (
                      <a
                        href={deposit.deposit_slip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary hover:underline"
                      >
                        View Deposit Slip
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
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
