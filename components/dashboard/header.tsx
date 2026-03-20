'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Bell, Shield, Users } from 'lucide-react'
import type { Member } from '@/lib/types'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { usePathname } from 'next/navigation'

interface DashboardHeaderProps {
  member: Member
  unreadCount?: number
}

export function DashboardHeader({ member, unreadCount = 0 }: DashboardHeaderProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Welcome back, {member.full_name.split(' ')[0]}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {member.role === 'admin' && (
            isAdminRoute ? (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex mr-2">
                <Link href="/dashboard">
                  <Users className="mr-2 h-4 w-4" />
                  View Member Dashboard
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="hidden sm:flex mr-2">
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  Go to Admin Dashboard
                </Link>
              </Button>
            )
          )}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/dashboard/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <form action="/api/auth/sign-out" method="POST">
            <SignOutButton size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" />
          </form>
        </div>
      </div>
    </header>
  )
}
