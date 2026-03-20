import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAllUsers() {
  const targetEmail = 'mansaraysamuellahawa@gmail.com'
  let page = 1
  let found = false

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100
    })

    if (error) {
      console.error('Error listing users:', error.message)
      break
    }

    if (data.users.length === 0) break

    const user = data.users.find(u => u.email === targetEmail)
    if (user) {
      console.log(`Found user: ${user.id} (${user.email})`)
      found = true
      break
    }

    page++
  }

  if (!found) {
    console.log('User not found in any page of auth.users.')
  }
}

checkAllUsers()
