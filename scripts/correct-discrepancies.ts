import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function correctDiscrepancies() {
  console.log('--- Starting Ledger Data Correction ---')

  // 1. Correct Princess Conteh (b1f184fe-0750-404b-a1bf-53e82926e6f4)
  // Current: 100 regular, 0 extra. Goal: 50 regular, 50 extra.
  console.log('\nUpdating Princess Conteh...')
  const { data: princessUpdate, error: princessError } = await supabase
    .from('contributions')
    .update({ monthly_amount: 50, extra_amount: 50 })
    .eq('id', '121322fa-937e-419c-8698-94f96569be29')
    .select()

  if (princessError) {
    console.error('✗ Error updating Princess:', princessError.message)
  } else {
    console.log('✓ Updated Princess contribution (ID: 121322fa-937e-419c-8698-94f96569be29) to 50/50.')
  }

  // 2. Correct Brima Conteh (ae0a3eba-b12d-4fbe-bc78-2c3e34d27d44)
  // Current: 50 regular, 50 extra. Goal: 50 regular, 2 extra (Total 52).
  console.log('\nUpdating Brima Conteh...')
  const { data: brimaUpdate, error: brimaError } = await supabase
    .from('contributions')
    .update({ monthly_amount: 50, extra_amount: 2 })
    .eq('id', '5c02183c-a996-4420-9c08-26a5a0cab790')
    .select()

  if (brimaError) {
    console.error('✗ Error updating Brima:', brimaError.message)
  } else {
    console.log('✓ Updated Brima contribution (ID: 5c02183c-a996-4420-9c08-26a5a0cab790) to 50/2.')
  }

  console.log('\n--- Data Correction Complete ---')
}

correctDiscrepancies().catch(console.error)
