'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { MoreHorizontal, Plus, Minus, Power } from 'lucide-react'
import type { FundCategory } from '@/lib/types'

interface FundCategoryActionsProps {
  category: FundCategory
  currentBalance: number
}

export function FundCategoryActions({ category, currentBalance }: FundCategoryActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function toggleActive() {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('fund_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error toggling category:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function addFunds() {
    if (!amount || parseFloat(amount) <= 0) return

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

      const addAmount = parseFloat(amount)

      // Update balance
      const { error: balanceError } = await supabase
        .from('fund_balances')
        .update({
          balance: currentBalance + addAmount,
          last_updated: new Date().toISOString(),
        })
        .eq('category_id', category.id)

      if (balanceError) throw balanceError

      // Create transaction
      await supabase.from('transactions').insert({
        type: 'deposit',
        amount: addAmount,
        description: description || `Added funds to ${category.name}`,
        category_id: category.id,
        created_by: member.id,
      })

      setShowAddFundsDialog(false)
      setAmount('')
      setDescription('')
      router.refresh()
    } catch (error) {
      console.error('Error adding funds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function withdrawFunds() {
    if (!amount || parseFloat(amount) <= 0) return

    const withdrawAmount = parseFloat(amount)
    if (withdrawAmount > currentBalance) {
      alert('Insufficient funds')
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

      // Update balance
      const { error: balanceError } = await supabase
        .from('fund_balances')
        .update({
          balance: currentBalance - withdrawAmount,
          last_updated: new Date().toISOString(),
        })
        .eq('category_id', category.id)

      if (balanceError) throw balanceError

      // Create transaction
      await supabase.from('transactions').insert({
        type: 'withdrawal',
        amount: withdrawAmount,
        description: description || `Withdrawal from ${category.name}`,
        category_id: category.id,
        created_by: member.id,
      })

      setShowWithdrawDialog(false)
      setAmount('')
      setDescription('')
      router.refresh()
    } catch (error) {
      console.error('Error withdrawing funds:', error)
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
          <DropdownMenuItem onClick={() => setShowAddFundsDialog(true)}>
            <Plus className="mr-2 h-4 w-4 text-accent" />
            Add Funds
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowWithdrawDialog(true)}>
            <Minus className="mr-2 h-4 w-4 text-warning" />
            Withdraw Funds
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleActive}>
            <Power className="mr-2 h-4 w-4" />
            {category.is_active ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to {category.name}</DialogTitle>
            <DialogDescription>
              Current balance: {currentBalance.toLocaleString()} Le
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Amount (Leones)</FieldLabel>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Description (Optional)</FieldLabel>
              <Textarea
                placeholder="Reason for adding funds..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFundsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addFunds} disabled={isLoading || !amount}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw from {category.name}</DialogTitle>
            <DialogDescription>
              Current balance: {currentBalance.toLocaleString()} Le
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Amount (Leones)</FieldLabel>
              <Input
                type="number"
                min="1"
                max={currentBalance}
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Description (Required)</FieldLabel>
              <Textarea
                placeholder="Reason for withdrawal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={withdrawFunds}
              disabled={isLoading || !amount || !description.trim()}
            >
              {isLoading ? <Spinner className="mr-2" /> : null}
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
