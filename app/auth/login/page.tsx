'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ChevronLeft, Users } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // 1. Auto-redirect on load
  useEffect(() => {
    // Redirect handled by global ForceAuth component in root layout
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    console.log('Attempting sign in for:', email)
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError.message)
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    if (!user) {
      console.error('No user returned after sign in')
      setError('Unexpected error: User not found.')
      setIsLoading(false)
      return
    }

    const ADMIN_EMAILS = [
      'samuel540wisesamura@gmail.com',
      'paulannehk@gmail.com',
      'princessconteh673@gmail.com'
    ]

    // Fast-path for predefined admins to skip unnecessary queries and ensure instant access
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      const sessionData = { 
        id: user.id, 
        email: user.email, 
        role: 'admin', 
        status: 'active' 
      }
      localStorage.setItem('user', JSON.stringify(sessionData))
      window.location.href = '/admin'
      return
    }

    console.log('Checking standard member profile...')

    // Role/Status Redirection Logic for Normal Members
    try {
      // Use maybeSingle() to handle missing profiles gracefully without throwing
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('role, status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError) {
        console.warn('Error fetching member profile:', memberError.message)
      }

      if (!member) {
        console.log('No member profile found')
        alert("Account partially created but awaiting approval.")
        setIsLoading(false)
        return
      }

      console.log('Member profile found:', member.role, member.status)
      // 2. Store user session immediately
      const sessionData = { 
        id: user.id, 
        email: user.email, 
        role: member.role, 
        status: member.status 
      }
      console.log('Committing session to localStorage:', sessionData)
      localStorage.setItem('user', JSON.stringify(sessionData))

      // 3. Force Redirect with window.location.href to bypass any stalls
      console.log('Forcing window.location.href redirect...')
      if (member.role === 'admin' || member.role === 'treasurer') {
        window.location.href = '/admin'
      } else if (member.status === 'approved' || member.status === 'active') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/pending-approval'
      }
    } catch (err) {
      console.error('Unexpected error during redirection:', err)
      // If profile fetch fails, fallback to dashboard anyway
      window.location.href = '/dashboard'
    } finally {
      // Ensure loading state stops eventually
      console.log('Login submission complete')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <Button variant="ghost" asChild className="absolute left-4 top-4">
        <Link href="/">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white overflow-hidden border shadow-sm">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">DCLM Youth Fund, Kabala</h1>
        <p className="text-sm text-muted-foreground">Kabala Management System</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
            </FieldGroup>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{"Don't have an account? "}</span>
            <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
