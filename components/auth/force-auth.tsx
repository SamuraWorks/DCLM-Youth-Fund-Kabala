'use client'

import React, { useEffect, useState } from 'react'

/**
 * ForceAuth (Safe Version)
 * Checks for a session in localStorage on load.
 * Does NOT auto-redirect. Only cleans up invalid sessions.
 */
export function ForceAuth({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const currentPath = window.location.pathname
    
    console.log('ForceAuth (Safe) check:', { currentPath, hasSavedUser: !!savedUser })

    if (savedUser) {
      try {
        JSON.parse(savedUser)
        // No auto-redirect here. We allow the user to stay on the current page.
        // If they are on /auth/login and have a session, they can manually navigate 
        // or the AuthGuard will handle permissions in reverse if needed.
      } catch (e) {
        console.warn('ForceAuth: Invalid session found, clearing...')
        localStorage.removeItem('user')
      }
    }
    
    // Smooth settle delay
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground font-medium italic">Preparing DCLM Youth Fund...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
