import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
  console.error('ERROR: Supabase credentials are missing or placeholders in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const MARCH_DATA = [
  { name: 'Cess', amount: 100 },
  { name: 'Paul', amount: 50 },
  { name: 'Samuel', amount: 50 },
  { name: 'Khadija', amount: 100 },
  { name: 'Isaiah', amount: 100 },
  { name: 'Samuella', amount: 100 },
  { name: 'Brima', amount: 50 },
  { name: 'James', amount: 60 },
  { name: 'John', amount: 50 },
  { name: 'Hannah Faith Kalma', amount: 50 },
  { name: 'Favour', amount: 50 },
  { name: 'Theresa', amount: 50 },
  { name: 'Abubakarr', amount: 50 },
  { name: 'Michael', amount: 50 },
]

const APRIL_DATA = [
  { name: 'Cess', amount: 100 },
  { name: 'Theresa', amount: 50 },
  { name: 'Abubakarr', amount: 50 },
  { name: 'Michael', amount: 50 },
  { name: 'Khadija', amount: 100 },
  { name: 'Samuella', amount: 100 },
  { name: 'Favour', amount: 50 },
]

const ALIASES: Record<string, string> = {
  'Cess': 'Princess',
  'Favour': 'Joshuannah',
}

async function recordContributions() {
  console.log('--- Starting Batch Record Contributions ---')
  
  // 1. Fetch all members for matching
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('id, full_name')
  
  if (memberError || !members) {
    console.error('Error fetching members:', memberError?.message)
    console.log('TIP: Check your Supabase URL and Service Key in .env.local')
    return
  }

  console.log(`Loaded ${members.length} members for matching.`)

  const year = 2026
  const unmatched: { month: string, name: string }[] = []

  const processList = async (data: { name: string, amount: number }[], month: string) => {
    console.log(`\n--- Processing ${month} ${year} ---`)
    
    for (const entry of data) {
      const searchName = ALIASES[entry.name] || entry.name
      
      // Find matching member
      // 1. Try exact match with original or alias
      let match = members.find(m => m.full_name.toLowerCase() === searchName.toLowerCase())
      
      // 2. Try partial match if no exact match
      if (!match) {
        match = members.find(m => 
          m.full_name.toLowerCase().includes(searchName.toLowerCase()) || 
          searchName.toLowerCase().includes(m.full_name.toLowerCase())
        )
      }

      // 3. Last ditch effort: if entry.name is part of full_name (even if alias didn't match)
      if (!match && ALIASES[entry.name]) {
         match = members.find(m => 
          m.full_name.toLowerCase().includes(entry.name.toLowerCase())
        )
      }

      if (!match) {
        console.warn(`[${month}] ✗ No match found for "${entry.name}"${ALIASES[entry.name] ? ` (tried alias: ${ALIASES[entry.name]})` : ''}`)
        unmatched.push({ month, name: entry.name })
        continue
      }

      console.log(`[${month}] ✓ Matched "${entry.name}" to "${match.full_name}" (${match.id})`)

      // Check if contribution already exists
      const { data: existing, error: checkError } = await supabase
        .from('contributions')
        .select('id, amount, status, notes')
        .eq('member_id', match.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle()

      if (checkError) {
        console.error(`  Error checking existing for ${match.full_name}:`, checkError.message)
        continue
      }

      if (existing) {
        if (existing.status === 'verified') {
          console.log(`  ! Already recorded and verified for ${match.full_name}. Skipping.`)
        } else {
          console.log(`  ! Existing ${existing.status} record found for ${match.full_name}. Updating to verified.`)
          const { error: updateError } = await supabase
            .from('contributions')
            .update({
              amount: entry.amount,
              status: 'verified',
              verified_at: new Date().toISOString(),
              notes: (existing.notes || '') + ' [System verified from manual list]'
            } as any)
            .eq('id', existing.id)
          
          if (updateError) console.error(`    ✗ Update failed:`, updateError.message)
          else console.log(`    ✓ Updated.`)
        }
      } else {
        // Create new record
        console.log(`  + Creating new verified record for ${match.full_name} (${entry.amount} Le)`)
        const { error: insertError } = await supabase
          .from('contributions')
          .insert({
            member_id: match.id,
            amount: entry.amount,
            month: month,
            year: year,
            status: 'verified',
            payment_method: 'cash',
            verified_at: new Date().toISOString(),
            notes: 'System recorded from manual list'
          })
        
        if (insertError) console.error(`    ✗ Insert failed:`, insertError.message)
        else console.log(`    ✓ Inserted.`)
      }
    }
  }

  await processList(MARCH_DATA, 'March')
  await processList(APRIL_DATA, 'April')

  if (unmatched.length > 0) {
    console.log('\n--- Unmatched Names Summary ---')
    unmatched.forEach(u => console.log(`[${u.month}] ${u.name}`))
    console.log('\nPlease verify these names in the members table and update them manually or fix the script matching.')
  }

  console.log('\n--- Batch Record Complete ---')
}

recordContributions().catch(console.error)
