import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function analyze() {
  console.log('--- ALL MEMBERS ---')
  const { data: members, error: memError } = await supabase.from('members').select('id, full_name, email, phone')
  if (memError) {
    console.error("Error fetching members:", memError)
    return
  }
  
  members?.forEach(m => {
    console.log(`[${m.id}] ${m.full_name} (${m.phone})`)
  })

  console.log('\n--- CONTRIBUTIONS FOR MARCH/APRIL ---')
  const { data: contributions, error: contError } = await supabase
    .from('contributions')
    .select('*, members(full_name)')
    .in('month', ['March', 'April'])
    .eq('year', 2025) // Assuming current year is 2026, maybe it's 2025? User didn't specify. 
                      // Wait, current local time is 2026-05-03. March/April of this year? 
                      // Let's check what years are in the DB.

  const { data: years } = await supabase.from('contributions').select('year').limit(10)
  console.log('Existing years in DB:', Array.from(new Set(years?.map(y => y.year))))

  if (contError) {
    console.error("Error fetching contributions:", contError)
  } else {
    contributions?.forEach(c => {
      console.log(`[${c.month} ${c.year}] ${(c as any).members?.full_name}: ${c.amount} (${c.status})`)
    })
  }
}

analyze()
