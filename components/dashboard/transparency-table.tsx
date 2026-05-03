'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MONTHS } from '@/lib/types'

export function TransparencyTable() {
  const [members, setMembers] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  // Starting transparency from March (index 2)
  const transparencyMonths = MONTHS.slice(2, currentMonth + 1)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all approved members
        const { data: membersData } = await supabase
          .from('members')
          .select('id, full_name, status, role')
          .eq('status', 'approved')
          .order('full_name')

        // Fetch all verified contributions for this year
        const { data: contribsData } = await supabase
          .from('contributions')
          .select('id, member_id, month, year, monthly_amount, extra_amount, status')
          .eq('status', 'verified')
          .eq('year', currentYear)

        if (membersData) setMembers(membersData)
        if (contribsData) setContributions(contribsData)
      } catch (error) {
        console.error('Error fetching transparency data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, currentYear])

  // Optimization: Group contributions by member_id for O(1) lookup during render
  const contributionsByMember = new Map<string, any[]>()
  contributions.forEach(c => {
    const list = contributionsByMember.get(c.member_id) || []
    list.push(c)
    contributionsByMember.set(c.member_id, list)
  })

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading transparency records...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Member Transparency Dashboard
            </CardTitle>
            <CardDescription>
              Verified monthly contribution status of all active members
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-background overflow-hidden">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px] font-bold">Member Name</TableHead>
                  {transparencyMonths.map(month => (
                    <TableHead key={month} className="text-center font-bold px-2">
                      {month.slice(0, 3)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold w-[100px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={transparencyMonths.length + 2} className="text-center py-8 text-muted-foreground">
                      No members found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const memberContribs = contributionsByMember.get(member.id) || []
                    const totalPaid = (() => {
        // Ensure each month is counted only once and only verified contributions are summed
        const monthMap = new Map<string, number>();
        memberContribs.forEach((c) => {
          // Only verified contributions are summed
          const isVerified = c.status === 'verified';
          if (!isVerified) return;
          const key = c.month;
          const amount = Number(c.monthly_amount) + Number(c.extra_amount);
          const existing = monthMap.get(key) ?? 0;
          if (amount > existing) monthMap.set(key, amount);
        });
        return Array.from(monthMap.values()).reduce((sum, v) => sum + v, 0);
      })();

                    return (
                      <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap py-4">
                          <div className="flex flex-col">
                            <span>{member.full_name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{member.role.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        {transparencyMonths.map(month => {
                          const isPaid = memberContribs.some(c => c.month === month)
                          return (
                            <TableCell key={month} className="text-center py-4">
                              {isPaid ? (
                                <div className="flex justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-accent" />
                                </div>
                              ) : (
                                <div className="flex justify-center opacity-20">
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                          )
                        })}
                        <TableCell className="text-right font-bold text-accent py-4">
                          {totalPaid.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>func
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            <span>Verified Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 opacity-20" />
            <span>Awaiting Payment or Verification</span>
          </div>
          <div className="ml-auto italic">
            * Displaying records for {currentYear} only
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
