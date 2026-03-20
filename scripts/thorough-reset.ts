import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function thoroughDelete() {
  const typoEmail = 'mansaraysmuellahawa@gmail.com'
  
  console.log(`--- Thorough Reset for: ${typoEmail} ---`)

  // 1. Get Member ID
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, user_id')
    .eq('email', typoEmail)
    .maybeSingle()

  if (!member) {
    console.log('No member record found for this email.')
  } else {
    const memberId = member.id
    console.log(`Found Member ID: ${memberId}`)

    // 2. Manually delete from dependent tables
    const tables = ['notifications', 'contributions']
    for (const table of tables) {
      console.log(`Deleting from ${table}...`)
      const { error } = await supabase.from(table).delete().eq('member_id', memberId)
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message)
      } else {
        console.log(`✓ Deleted from ${table}.`)
      }
    }

    // 3. Handle nullable FKs in other tables
    console.log('Clearing references in bank_deposits and transactions...')
    await supabase.from('bank_deposits').update({ deposited_by: null }).eq('deposited_by', memberId)
    await supabase.from('bank_deposits').update({ verified_by: null }).eq('verified_by', memberId)
    await supabase.from('transactions').update({ created_by: null }).eq('created_by', memberId)
    await supabase.from('contributions').update({ verified_by: null }).eq('verified_by', memberId)

    // 4. Delete from members
    console.log('Deleting from public.members...')
    const { error: delMemberError } = await supabase.from('members').delete().eq('id', memberId)
    if (delMemberError) {
      console.error('Error deleting member record:', delMemberError.message)
    } else {
      console.log('✓ Member record deleted.')
    }
  }

  // 5. Delete from auth.users
  console.log('Checking auth.users...')
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  const authUser = usersData.users.find(u => u.email === typoEmail)

  if (authUser) {
    console.log(`Deleting auth user: ${authUser.id}...`)
    const { error: delAuthError } = await supabase.auth.admin.deleteUser(authUser.id)
    if (delAuthError) {
      console.error('Error deleting auth user:', delAuthError.message)
    } else {
      console.log('✓ Auth user deleted.')
    }
  } else {
    console.log('No auth user found.')
  }

  console.log('\n--- THOROUGH RESET COMPLETE ---')
}

thoroughDelete()
