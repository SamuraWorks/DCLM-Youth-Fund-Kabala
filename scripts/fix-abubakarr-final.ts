import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAbubakarr() {
  console.log('--- Fixing Abubakarr Kamara\'s Contributions ---')

  // 1. Find the member
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, full_name')
    .ilike('full_name', '%Abubakarr Kamara%')

  if (memberError || !members || members.length === 0) {
    console.error('✗ Member Abubakarr Kamara not found.')
    return
  }

  const member = members[0]
  console.log(`✓ Found member: ${member.full_name} (ID: ${member.id})`)

  // 2. Get all contributions for this member in 2026
  const { data: contributions, error: contribError } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', member.id)
    .eq('year', 2026)

  if (contribError || !contributions) {
    console.error('✗ Error fetching contributions:', contribError?.message)
    return
  }

  console.log(`Found ${contributions.length} total entries for 2026.`)

  // 3. Process March and April
  const targetMonths = ['March', 'April']
  const targetAmount = 50

  for (const month of targetMonths) {
    const monthEntries = contributions.filter(c => c.month === month)
    console.log(`\nProcessing ${month}: Found ${monthEntries.length} entries.`)

    if (monthEntries.length === 0) {
      console.log(`! No entry found for ${month}. You might need to add one manually or check if it's under a different year/month name.`)
      continue
    }

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
        // This is our primary entry for the month
        console.log(`- Fixing primary entry for ${month} (ID: ${entry.id})`)
        const { error: updateError } = await supabase
          .from('contributions')
          .update({
            status: 'verified',
            monthly_amount: 50,
            extra_amount: 0,
            verified: true,
            notes: (entry.notes || '') + ' [System corrected to 50 Le verified]'
          })
          .eq('id', entry.id)

        if (updateError) {
          console.error(`  ✗ Failed to update ${entry.id}:`, updateError.message)
        } else {
          console.log(`  ✓ Successfully updated and verified to 50 Le.`)
          verifiedCount++
        }
      } else {
        // Excess entries for the same month - Reject them
        console.log(`- Rejecting excess entry for ${month} (ID: ${entry.id})`)
        const { error: rejectError } = await supabase
          .from('contributions')
          .update({
            status: 'rejected',
            rejection_reason: `Duplicate or excess entry for ${month}. Fixed total to 50 Le per month.`,
            verified: false
          })
          .eq('id', entry.id)

        if (rejectError) {
          console.error(`  ✗ Failed to reject ${entry.id}:`, rejectError.message)
        } else {
          console.log(`  ✓ Successfully rejected.`)
        }
      }
    }
  }

  // 4. Reject any other months that were mistakenly verified (if any)
  const otherVerifiedEntries = contributions.filter(c => !targetMonths.includes(c.month) && c.status === 'verified')
  if (otherVerifiedEntries.length > 0) {
    console.log(`\nRejecting ${otherVerifiedEntries.length} verified entries for other months...`)
    for (const entry of otherVerifiedEntries) {
      const { error: rejectError } = await supabase
        .from('contributions')
        .update({
          status: 'rejected',
          rejection_reason: 'Only March and April should be verified for this member at this time.',
          verified: false
        })
        .eq('id', entry.id)
      
      if (rejectError) {
        console.error(`✗ Failed to reject ${entry.id}:`, rejectError.message)
      } else {
        console.log(`✓ Rejected excess verified entry for ${entry.month} (ID: ${entry.id})`)
      }
    }
  }

  console.log('\n--- Fix Complete ---')
}

fixAbubakarr().catch(console.error)
