import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function searchSimilar() {
  console.log('Searching for users with similar email...')
  const emailPart = 'mansaray'
  
  const { data, error } = await supabase
    .from('members')
    .select('id, email, full_name')
    .ilike('email', `%${emailPart}%`)

  if (error) {
    console.error('Error searching:', error.message)
    return
  }

  if (data.length === 0) {
    console.log('No members found matching "mansaray" in email.')
  } else {
    data.forEach(m => console.log(`Member found: ${m.full_name} (${m.email})`))
  }
  
  console.log('\nSearching for users with same last name in full_name...')
  const { data: data2, error: error2 } = await supabase
    .from('members')
    .select('id, email, full_name')
    .ilike('full_name', `%${emailPart}%`)

  if (error2) {
    console.error('Error searching names:', error2.message)
    return
  }

  if (data2.length === 0) {
    console.log('No members found matching "mansaray" in full_name.')
  } else {
    data2.forEach(m => console.log(`Member found: ${m.full_name} (${m.email})`))
  }
}

searchSimilar()
