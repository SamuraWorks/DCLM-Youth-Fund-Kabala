'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton({ 
  className, 
  variant = "outline", 
  size = "default" 
}: { 
  className?: string,
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link",
  size?: "default" | "sm" | "lg" | "icon"
}) {
  const handleSignOut = () => {
    localStorage.removeItem('user')
  }

  return (
    <Button 
      type="submit" 
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
    >
      <LogOut className={size === "icon" ? "h-5 w-5" : "mr-2 h-4 w-4"} />
      {size !== "icon" && "Sign Out"}
    </Button>
  )
}
