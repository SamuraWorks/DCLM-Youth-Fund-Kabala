import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetMembers() {
  const ADMIN_EMAILS = [
    'samuel540wisesamura@gmail.com',
    'paulannehk@gmail.com',
    'princessconteh673@gmail.com'
  ]

  console.log('Fetching all users from auth.users...')
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()
  
  if (fetchError) {
    console.error('Error fetching users:', fetchError)
    return
  }

  console.log(`Found ${users.length} total users. Filtering out the 3 admins...`)

  let deletedCount = 0
  for (const user of users) {
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      console.log(`Deleting non-admin account: ${user.email || user.id}...`)
      
      try {
        // Find the member record to delete associated data
        const { data: member } = await supabase.from('members').select('id').eq('user_id', user.id).single()
        
        if (member) {
          // Delete child records to satisfy any potential foreign key constraints
          await supabase.from('notifications').delete().eq('member_id', member.id)
          await supabase.from('contributions').delete().eq('member_id', member.id)
          await supabase.from('withdrawals').delete().eq('member_id', member.id)
          await supabase.from('ledger_entries').delete().eq('member_id', member.id)
        }

        // Delete the member record itself
        await supabase.from('members').delete().eq('user_id', user.id)
        
        // Finally, completely wipe them from Supabase authentication
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          console.error(`  ⚠️ Failed to delete auth user ${user.email}:`, deleteError.message)
        } else {
          console.log(`  ✅ Successfully purged ${user.email}`)
          deletedCount++
        }
      } catch (e: any) {
        console.error(`  ⚠️ Unexpected error cleaning up ${user.email}:`, e.message)
      }
    } else {
      console.log(`Skipping Admin: ${user.email}`)
    }
  }

  console.log(`\n===========================================`)
  console.log(`✅ RESET COMPLETE`)
  console.log(`Total non-admins deleted: ${deletedCount}`)
  console.log(`The 3 predefined admins remain perfectly intact.`)
  console.log(`===========================================\n`)
}

resetMembers()
