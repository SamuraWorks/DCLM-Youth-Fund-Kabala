import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function check() {
  console.log('--- CONTRIBUTIONS TABLE ---')
  const { data: contributions, error } = await supabase.from('contributions').select('*').order('created_at', { ascending: false })
  
  if (error) console.error("DB Error:", error)
  console.log(`Total Contributions: ${contributions?.length}`)
  
  if (contributions && contributions.length > 0) {
      console.log('Latest 5 submissions:')
      contributions.slice(0, 5).forEach(c => {
        console.log(` - ID: ${c.id} | Member: ${c.member_id} | Amount: ${c.amount} | Month: ${c.month} | Year: ${c.year} | Status: ${c.status}`)
        console.log(`     -> Pay Method: ${c.payment_method} | Notes: ${c.notes}`)
      })
  }

  console.log('\n--- VERIFYING MEMBER IDs ---')
  const { data: members } = await supabase.from('members').select('id, user_id, full_name, email')
  if (members && contributions) {
      contributions.slice(0, 5).forEach(c => {
         const m_by_id = members.find(x => x.id === c.member_id)
         const m_by_user_id = members.find(x => x.user_id === c.member_id)
         console.log(`Contribution member_id: ${c.member_id}`)
         console.log(` - Match by ID: ${m_by_id ? m_by_id.email : 'NONE'}`)
         console.log(` - Match by User_ID: ${m_by_user_id ? m_by_user_id.email : 'NONE'}`)
      })
  }
}
check()
