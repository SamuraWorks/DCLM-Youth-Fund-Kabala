import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetUser() {
  const email = 'mansaraysamuellahawa@gmail.com'
  console.log(`--- Resetting User: ${email} ---`)

  // 1. Find the user ID
  console.log('Searching for user...')
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('✗ Error listing users:', listError.message)
    return
  }

  const user = usersData.users.find(u => u.email === email)

  if (!user) {
    console.log('✓ User not found in auth.users. They may have already been deleted or never existed.')
    
    // Check public.members just in case
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single()

    if (member) {
      console.log('Found stray record in public.members. Deleting...')
      const { error: delMemberError } = await supabase
        .from('members')
        .delete()
        .eq('id', member.id)
      
      if (delMemberError) {
        console.error('✗ Error deleting member record:', delMemberError.message)
      } else {
        console.log('✓ Stray member record deleted.')
      }
    } else {
      console.log('✓ No stray records found in public.members.')
    }
    
    console.log('--- RESET COMPLETE (User did not exist) ---')
    return
  }

  const userId = user.id
  console.log(`Found user ID: ${userId}`)

  // 2. Delete the user
  console.log('Deleting user from auth.users (this should cascade to public.members)...')
  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('✗ Error deleting user:', deleteError.message)
    
    // Fallback: Admin Reset Option
    console.log('Attempting password reset as fallback...')
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'
    const { error: resetError } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword
    })

    if (resetError) {
      console.error('✗ Error resetting password:', resetError.message)
    } else {
      console.log('✓ Password reset successfully.')
      console.log(`Email: ${email}`)
      console.log(`Temporary Password: ${tempPassword}`)
    }
  } else {
    console.log('✓ User deleted successfully from auth.users.')
    
    // Double check public.members (cascade should have handled it)
    const { data: memberAfter, error: memberErrorAfter } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (memberAfter) {
      console.log('⚠️ Warning: Member record still exists. Manual deletion required.')
      const { error: delMemberError } = await supabase
        .from('members')
        .delete()
        .eq('id', memberAfter.id)
      
      if (delMemberError) {
        console.error('✗ Error deleting member record manually:', delMemberError.message)
      } else {
        console.log('✓ Member record deleted manually.')
      }
    } else {
      console.log('✓ Confirmed: Public member record is gone.')
    }

    console.log('\n--- RESET COMPLETE ---')
    console.log(`User with email ${email} can now sign up again.`)
  }
}

resetUser()
