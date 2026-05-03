import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('--- API: Fixing Abubakarr Kamara\'s Contributions ---')
  
  try {
    const supabase = await createAdminClient()

    // 1. Find the member
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, full_name')
      .ilike('full_name', '%Abubakarr Kamara%')

    if (memberError || !members || members.length === 0) {
      return NextResponse.json({ error: 'Member Abubakarr Kamara not found' }, { status: 404 })
    }

    const member = members[0]
    
    // 2. Get all contributions for this member in 2026
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select('*')
      .eq('member_id', member.id)
      .eq('year', 2026)

    if (contribError || !contributions) {
      return NextResponse.json({ error: 'Error fetching contributions', details: contribError?.message }, { status: 500 })
    }

    const results: any[] = []
    const targetMonths = ['March', 'April']

    for (const month of targetMonths) {
      const monthEntries = contributions.filter(c => c.month === month)
      
      // Sort by status (verified first) and then created_at
      monthEntries.sort((a, b) => {
        if (a.status === 'verified' && b.status !== 'verified') return -1
        if (a.status !== 'verified' && b.status === 'verified') return 1
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      let verifiedCount = 0
      for (let i = 0; i < monthEntries.length; i++) {
        const entry = monthEntries[i]
        
        if (verifiedCount === 0) {
          // Fix primary entry
          const { error } = await supabase
            .from('contributions')
            .update({
              status: 'verified',
              monthly_amount: 50,
              extra_amount: 0,
              verified: true,
              notes: (entry.notes || '') + ' [System corrected to 50 Le verified]'
            })
            .eq('id', entry.id)
          
          results.push({ id: entry.id, month, action: 'verified_to_50', error: error?.message })
          if (!error) verifiedCount++
        } else {
          // Reject excess
          const { error } = await supabase
            .from('contributions')
            .update({
              status: 'rejected',
              rejection_reason: `Duplicate/excess entry for ${month}. Fixed total to 50 Le.`,
              verified: false
            })
            .eq('id', entry.id)
          
          results.push({ id: entry.id, month, action: 'rejected_excess', error: error?.message })
        }
      }
    }

    // 3. Reject any other verified months
    const otherVerified = contributions.filter(c => !targetMonths.includes(c.month) && c.status === 'verified')
    for (const entry of otherVerified) {
      const { error } = await supabase
        .from('contributions')
        .update({
          status: 'rejected',
          rejection_reason: 'Only March and April should be verified for this member.',
          verified: false
        })
        .eq('id', entry.id)
      
      results.push({ id: entry.id, month: entry.month, action: 'rejected_other_verified', error: error?.message })
    }

    return NextResponse.json({ 
      success: true, 
      member: member.full_name,
      results 
    })

  } catch (err: any) {
    return NextResponse.json({ error: 'System error', message: err.message }, { status: 500 })
  }
}
