import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const ADMINS = [
  {
    name: 'Samuel Samura',
    email: 'samuel540wisesamura@gmail.com',
    password: 'S@muR4#9xL!27',
  },
  {
    name: 'Paul Anneh Koroma',
    email: 'paulannehk@gmail.com',
    password: 'P@uL#83vK!2zX',
  },
  {
    name: 'Princess Conteh',
    email: 'princessconteh673@gmail.com',
    password: 'Pr!nC3ss#7Lm@92',
  }
]

async function seedAdmins() {
  console.log('Starting clear and seed process...')
  
  // 1. Fetch all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('Error listing users:', listError)
    process.exit(1)
  }

  // 2. Delete all existing users
  if (users && users.length > 0) {
    console.log(`Deleting ${users.length} existing users...`)
    for (const user of users) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`Error deleting user ${user.email}:`, error)
      } else {
        console.log(`Deleted user: ${user.email}`)
      }
    }
  } else {
    console.log('No existing users to delete.')
  }

  // Note: deleting from auth.users usually cascades to public.members in Supabase, 
  // but let's be absolutely sure by deleting from members too.
  await supabase.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // 3. Create the 3 admins
  for (const admin of ADMINS) {
    console.log(`Creating admin: ${admin.name} (${admin.email})`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: {
        full_name: admin.name
      }
    })

    if (createError) {
      console.error(`Error creating admin ${admin.email}:`, createError)
      continue
    }

    if (newUser.user) {
      // 4. Upsert member record
      const { error: memberError } = await supabase.from('members').upsert({
        id: newUser.user.id,
        user_id: newUser.user.id,
        email: admin.email,
        full_name: admin.name,
        role: 'admin',
        status: 'active', // using active as requested by user, or approved if DB requires
        phone: 'N/A'
      })

      if (memberError) {
        // If 'active' fails, try 'approved' which is what the current codebase uses.
        console.log(`Upserting with 'active' status failed. Trying 'approved' instead...`)
        await supabase.from('members').upsert({
          id: newUser.user.id,
          user_id: newUser.user.id,
          email: admin.email,
          full_name: admin.name,
          role: 'admin',
          status: 'approved',
          phone: 'N/A'
        })
      }
      
      console.log(`Successfully created and configured admin: ${admin.email}`)
    }
  }

  console.log('Seed process completed successfully!')
}

seedAdmins().catch(console.error)
