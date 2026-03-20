import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteTypoUser() {
  const typoEmail = 'mansaraysmuellahawa@gmail.com'
  const targetEmail = 'mansaraysamuellahawa@gmail.com'
  
  console.log(`--- Resetting User Account ---`)
  console.log(`Requested Email: ${targetEmail}`)
  console.log(`Found Typo Email: ${typoEmail}`)

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  const user = usersData.users.find(u => u.email === typoEmail)

  if (!user) {
    console.log('✓ Typo user not found in auth.users. They might have been deleted already.')
  } else {
    console.log(`Deleting user: ${user.id} (${user.email})...`)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('✗ Error deleting user:', deleteError.message)
    } else {
      console.log('✓ User deleted successfully from auth.users.')
    }
  }

  // Ensure public.members is clean for BOTH emails
  const emailsToCheck = [typoEmail, targetEmail]
  for (const email of emailsToCheck) {
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('email', email)
      .maybeSingle()

    if (member) {
      console.log(`Found member record for ${email}: ${member.full_name}. Deleting...`)
      const { error: delError } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)
      
      if (delError) {
        console.error(`✗ Error deleting member record for ${email}:`, delError.message)
      } else {
        console.log(`✓ Member record for ${email} deleted.`)
      }
    } else {
      console.log(`✓ No member record found for ${email}.`)
    }
  }

  console.log('\n--- RESET COMPLETE ---')
  console.log(`The user can now sign up again with ${targetEmail}.`)
}

deleteTypoUser()
