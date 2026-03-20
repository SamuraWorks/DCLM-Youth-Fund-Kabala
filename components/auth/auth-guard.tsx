'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Lock } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user')
      
      if (!savedUser) {
        console.log('AuthGuard: No user found in localStorage')
        setErrorMessage('Please log in to access this page.')
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      try {
        const user = JSON.parse(savedUser)
        
        // Admin authorization check
        if (adminOnly && user.role !== 'admin' && user.role !== 'treasurer' && user.role !== 'youth_coordinator') {
          console.warn('AuthGuard: User is not an admin or coordinator')
          setErrorMessage('Access denied. This area is reserved for administrators and coordinators.')
          setIsAuthorized(false)
          setLoading(false)
          return
        }

        // Pending status check for members
        if (!adminOnly && user.role === 'member' && user.status !== 'approved') {
          if (window.location.pathname !== '/pending-approval') {
            console.log('AuthGuard: Redirecting pending member to /pending-approval')
            window.location.href = '/pending-approval'
            return
          }
        }

        setIsAuthorized(true)
        setLoading(false)
      } catch (e) {
        console.error('AuthGuard: Session parse error', e)
        localStorage.removeItem('user')
        setErrorMessage('Session expired. Please log in again.')
        setLoading(false)
      }
    }

    checkAuth()
  }, [adminOnly])

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-muted-foreground font-medium animate-pulse italic">Verifying access...</p>
      </div>
    )
  }

  if (errorMessage && !isAuthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Restricted</h2>
        <p className="max-w-xs text-muted-foreground mb-8">
          {errorMessage}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          <Button asChild className="w-full">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}
