import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function check() {
  console.log('--- AUTH USERS ---')
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) console.error("Auth Error:", authError)
  console.log(`Total Auth Users: ${users?.length}`)
  if (users) {
      users.forEach(u => console.log(` - ${u.email} (ID: ${u.id})`))
  }

  console.log('\n--- PUBLIC MEMBERS ---')
  const { data: members, error: dbError } = await supabase.from('members').select('*')
  if (dbError) console.error("DB Error:", dbError)
  console.log(`Total Public Members: ${members?.length}`)
  if (members) {
      members.forEach(m => console.log(` - ${m.email} | Role: ${m.role} | Status: ${m.status} | User_ID: ${m.user_id}`))
  }
}
check()
