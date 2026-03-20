import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function fixLedger() {
  console.log('--- Fixing Ledger Entries ---')

  // 1. Fix Princess Conteh
  // Current: ID de5a336f-79c0-4cb4-ab55-9af649ebf90c is 100 Le (type: contribution)
  // Goal: Update to 50 Le and add a 50 Le (type: extra_contribution)
  console.log('\nPrincess Conteh Correction...')
  
  // Update old 100 to 50
  const { error: p1Error } = await supabase
    .from('ledger_entries')
    .update({ amount: 50 })
    .eq('id', 'de5a336f-79c0-4cb4-ab55-9af649ebf90c')
  
  if (p1Error) console.error('✗ Error updating Princess 1:', p1Error.message)
  else console.log('✓ Updated Princess existing entry to 50 Le.')

  // Add new 50 extra
  const { error: p2Error } = await supabase
    .from('ledger_entries')
    .insert({
      type: 'extra_contribution',
      amount: 50,
      description: 'Contribution approved: Princess Conteh (Extra) — March 2026',
      member_id: 'b1f184fe-0750-404b-a1bf-53e82926e6f4',
      member_name: 'Princess Conteh',
      approved_by: 'b1f184fe-0750-404b-a1bf-53e82926e6f4',
      approved_by_name: 'Princess Conteh',
      reference_id: '121322fa-937e-419c-8698-94f96569be29',
      payment_source: 'orange_money',
      created_at: '2026-03-21T17:52:26.217833+00:00' // Same timestamp as the first one
    })

  if (p2Error) console.error('✗ Error adding Princess extra:', p2Error.message)
  else console.log('✓ Added Princess extra entry 50 Le.')

  // 2. Add Brima Conteh (Missing)
  // Goal: Add 50 Le (contribution) and 2 Le (extra_contribution)
  console.log('\nBrima Conteh Insertion...')

  const brimaEntries = [
    {
      type: 'contribution',
      amount: 50,
      description: 'Contribution approved: Brima Conteh — March 2026',
      member_id: 'ae0a3eba-b12d-4fbe-bc78-2c3e34d27d44',
      member_name: 'Brima Conteh',
      approved_by: 'bd985e4e-a900-4b40-a3b7-290ae128b023',
      approved_by_name: 'Samuel Samura',
      reference_id: '5c02183c-a996-4420-9c08-26a5a0cab790',
      payment_source: 'orange_money',
      created_at: '2026-03-21T23:09:29.117+00:00'
    },
    {
      type: 'extra_contribution',
      amount: 2,
      description: 'Contribution approved: Brima Conteh (Extra) — March 2026',
      member_id: 'ae0a3eba-b12d-4fbe-bc78-2c3e34d27d44',
      member_name: 'Brima Conteh',
      approved_by: 'bd985e4e-a900-4b40-a3b7-290ae128b023',
      approved_by_name: 'Samuel Samura',
      reference_id: '5c02183c-a996-4420-9c08-26a5a0cab790',
      payment_source: 'orange_money',
      created_at: '2026-03-21T23:09:29.117+00:00'
    }
  ]

  const { error: brimaError } = await supabase
    .from('ledger_entries')
    .insert(brimaEntries)

  if (brimaError) console.error('✗ Error adding Brima entries:', brimaError.message)
  else console.log('✓ Added Brima entries (50 + 2 Le).')

  console.log('\n--- Ledger Fix Complete ---')
}

fixLedger().catch(console.error)
