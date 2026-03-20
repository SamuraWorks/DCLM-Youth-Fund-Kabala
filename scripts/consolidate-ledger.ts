import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function consolidateLedger() {
  console.log('--- Consolidating Ledger Entries ---')

  // 1. Princess Conteh (Consolidate 50+50 into 100)
  console.log('\nConsolidating Princess Conteh...')
  const { error: pUpdateError } = await supabase
    .from('ledger_entries')
    .update({ amount: 100 })
    .eq('id', 'de5a336f-79c0-4cb4-ab55-9af649ebf90c')
  
  if (pUpdateError) console.error('✗ Error updating Princess entry:', pUpdateError.message)
  else {
    const { error: pDeleteError } = await supabase
      .from('ledger_entries')
      .delete()
      .eq('id', '618504c9-2281-4bf3-9106-90efec4a3ef0')
    
    if (pDeleteError) console.error('✗ Error deleting Princess duplicate:', pDeleteError.message)
    else console.log('✓ Princess consolidated into 1 entry (100 Le).')
  }

  // 2. Brima Conteh (Consolidate 50+2 into 52)
  console.log('\nConsolidating Brima Conteh...')
  const { error: bUpdateError } = await supabase
    .from('ledger_entries')
    .update({ amount: 52 })
    .eq('id', 'cd95f01a-270b-47c0-a12a-71076b7720a2')

  if (bUpdateError) console.error('✗ Error updating Brima entry:', bUpdateError.message)
  else {
    const { error: bDeleteError } = await supabase
      .from('ledger_entries')
      .delete()
      .eq('id', 'fb87d510-6c50-4814-ab4e-e00e76bcedc7')
    
    if (bDeleteError) console.error('✗ Error deleting Brima duplicate:', bDeleteError.message)
    else console.log('✓ Brima consolidated into 1 entry (52 Le).')
  }

  console.log('\n--- Consolidation Complete ---')
}

consolidateLedger().catch(console.error)
