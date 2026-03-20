import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function check() {
  console.log('--- TESTING COMPLEX JOIN ---')
  const { data, error } = await supabase
    .from('contributions')
    .select('*, member:members(*), verifier:members!contributions_verified_by_fkey(*)')
    .limit(1)
  
  if (error) {
      console.error("Query Error:", error.message)
      console.error("Error Detail:", error.details)
      console.error("Error Hint:", error.hint)
  } else {
      console.log('Query success! Found:', data?.length)
      if (data && data.length > 0) {
          console.log('Sample record member:', data[0].member?.email)
      }
  }

  console.log('\n--- TESTING SIMPLE SELECT ---')
  const { data: simple, error: simpleErr } = await supabase.from('contributions').select('*')
  console.log('Simple select count:', simple?.length || 0)
  if (simpleErr) console.error("Simple error:", simpleErr.message)
}
check()
