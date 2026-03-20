'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  Wallet,
  History,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  PiggyBank,
  FileText,
  Bell,
  Building2,
  UserCheck,
  ArrowDownLeft,
  ScrollText,
  Download,
} from 'lucide-react'
import type { Member } from '@/lib/types'

const memberNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'My Contributions', href: '/dashboard/contributions', icon: Wallet },
  { title: 'Payment History', href: '/dashboard/history', icon: History },
  { title: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

const adminNavItems = [
  { title: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Members', href: '/admin/members', icon: Users },
  { title: 'Verify Payments', href: '/admin/verify', icon: UserCheck },
  { title: 'Fund Management', href: '/admin/funds', icon: PiggyBank },
  { title: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowDownLeft },
  { title: 'Bank Deposits', href: '/admin/deposits', icon: Building2 },
  { title: 'Ledger', href: '/admin/ledger', icon: ScrollText },
  { title: 'Reports & Export', href: '/admin/reports', icon: FileText },
]

const coordinatorNavItems = [
  { title: 'Coordinator Dashboard', href: '/youth-coordinator', icon: LayoutDashboard },
  { title: 'Member Status', href: '/admin/members', icon: Users },
  { title: 'Make Contribution', href: '/dashboard/contributions', icon: Wallet },
  { title: 'Fund Management', href: '/admin/funds', icon: PiggyBank },
  { title: 'Financial Reports', href: '/admin/reports', icon: FileText },
]

interface DashboardSidebarProps {
  member: Member
}

export function DashboardSidebar({ member }: DashboardSidebarProps) {
  const pathname = usePathname()
  const isAdmin = member.role === 'admin' || member.role === 'treasurer'
  const initials = member.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white overflow-hidden border border-sidebar-border">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">DCLM Youth Fund, Kabala</span>
            <span className="text-xs text-sidebar-foreground/70">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Member</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

          {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {member.role === 'youth_coordinator' && (
          <SidebarGroup>
            <SidebarGroupLabel>Coordination</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {coordinatorNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <form action="/api/auth/sign-out" method="POST" className="w-full">
                  <SidebarMenuButton type="submit" className="w-full text-destructive hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-left">
                    <span className="truncate text-sm font-medium">{member.full_name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70 capitalize">
                      {member.role}
                    </span>
                  </div>
                  <ChevronUp className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/api/auth/sign-out" method="POST" className="w-full">
                    <button type="submit" className="flex w-full items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
