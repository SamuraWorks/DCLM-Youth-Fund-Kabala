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
import { AlertCircle, CheckCircle2, Plus } from 'lucide-react'

export function FundCategoryForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('fund_categories')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          target_amount: targetAmount ? parseFloat(targetAmount) : null,
          is_active: true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Create initial balance record
      if (data) {
        await supabase.from('fund_balances').insert({
          category_id: data.id,
          balance: 0,
        })
      }

      setSuccess(true)
      setName('')
      setDescription('')
      setTargetAmount('')
      router.refresh()
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category. Please try again.')
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
          <AlertDescription className="text-accent">Category created successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel>Category Name</FieldLabel>
          <Input
            placeholder="e.g., Emergency Fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        <Field>
          <FieldLabel>Target Amount (Optional)</FieldLabel>
          <Input
            type="number"
            placeholder="e.g., 5000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            disabled={isLoading}
          />
        </Field>

        <Field className="md:col-span-1">
          <FieldLabel>Description (Optional)</FieldLabel>
          <Input
            placeholder="Brief description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Spinner className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
        Add Category
      </Button>
    </form>
  )
}
