import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyAuthSetup() {
  console.log('--- DCLM Youth Fund: Auth Setup ---')
  
  const email = 'jonathanksenessie@gmail.com'
  const password = 'J0n@th4n#K$S3n!22'
  const fullName = 'Jonathan K Senessie'

  console.log(`Ensuring Auth User exists: ${email}...`)

  // 1. Create User in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  let userId = authUser?.user?.id

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('✓ User already exists in Auth.')
      // Get the existing user ID
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      userId = existingUser?.users.find(u => u.email === email)?.id
    } else {
      console.error('✗ Error creating Auth user:', authError.message)
      return
    }
  } else {
    console.log('✓ Auth user created successfully.')
  }

  if (!userId) {
    console.error('✗ Could not determine User ID.')
    return
  }

  // 2. Sync with Public.Members
  console.log(`Syncing '${fullName}' with public.members table...`)
  const { error: memberError } = await supabase
    .from('members')
    .upsert({
      user_id: userId,
      email: email,
      full_name: fullName,
      role: 'youth_coordinator',
      status: 'approved',
      phone: 'N/A',
      joined_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'email' })

  if (memberError) {
    console.error('✗ Error syncing member record:', memberError.message)
  } else {
    console.log('✓ Public member record synced successfully.')
    console.log('\n--- SETUP COMPLETE ---')
    console.log(`You can now log in with:`)
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  }
}

applyAuthSetup()
