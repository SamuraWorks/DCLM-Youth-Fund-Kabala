import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function investigate() {
  const { data: members, error: memberError } = await supabase
    .from('members')
    .select('*')
    .ilike('full_name', '%Abubakarr Kamara%')

  if (memberError || !members || members.length === 0) {
    console.log('Member not found')
    return
  }

  const member = members[0]
  console.log('Member found:', member.full_name, member.id)

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('member_id', member.id)
    .order('created_at', { ascending: true })

  console.log('Contributions:', JSON.stringify(contributions, null, 2))
}

investigate().catch(console.error)
