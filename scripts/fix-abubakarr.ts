import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAbubakarrRecord() {
  console.log('--- Fixing Abubakarr Kamara\'s Record ---')

  // 1. Find the member
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, full_name')
    .ilike('full_name', '%Abubakarr Kamara%')

  if (memberError || !members || members.length === 0) {
    console.error('✗ Member Abubakarr Kamara not found:', memberError?.message || 'No match')
    return
  }

  const abubakarr = members[0]
  console.log(`✓ Found member: ${abubakarr.full_name} (ID: ${abubakarr.id})`)

  // 2. Get all verified contributions
  const { data: contributions, error: contribError } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', abubakarr.id)
    .eq('status', 'verified')
    .order('created_at', { ascending: true })

  if (contribError) {
    console.error('✗ Error fetching contributions:', contribError.message)
    return
  }

  console.log(`Found ${contributions?.length || 0} verified contributions.`)

  // Target: Ensure only 100 Le total is verified (March + April)
  // Usually this means 50 Le for March and 50 Le for April.
  // If there's an extra mistakenly approved entry, we reject it.
  
  let totalVerified = 0
  for (const c of contributions || []) {
    const amount = Number(c.monthly_amount) + Number(c.extra_amount)
    totalVerified += amount
    
    if (totalVerified > 100) {
      console.log(`! Excess verified amount detected. Rejecting contribution ID: ${c.id} (Amount: ${amount})`)
      const { error: rejectError } = await supabase
        .from('contributions')
        .update({ 
          status: 'rejected', 
          rejection_reason: 'Mistakenly approved extra entry. Total verified corrected to 100 Le.',
          notes: (c.notes || '') + ' [System corrected total to 100 Le]'
        })
        .eq('id', c.id)

      if (rejectError) {
        console.error(`✗ Failed to reject ${c.id}:`, rejectError.message)
      } else {
        console.log(`✓ Successfully rejected excess entry ${c.id}.`)
      }
    } else {
      console.log(`- Keeping verified: ${c.month} ${c.year} - Amount: ${amount} (Running Total: ${totalVerified})`)
    }
  }

  console.log('\n--- Abubakarr Kamara Fix Complete ---')
}

fixAbubakarrRecord().catch(console.error)
