import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTypoEmail() {
  const typoEmail = 'mansaraysmuellahawa@gmail.com'
  console.log(`Checking auth.users for: ${typoEmail}`)
  
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError.message)
    return
  }

  const user = usersData.users.find(u => u.email === typoEmail)

  if (user) {
    console.log(`Found user in auth: ${user.id} (${user.email})`)
  } else {
    console.log('User not found in first 50 users. Searching full list...')
    let page = 1
    let found = false
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
      if (error || data.users.length === 0) break
      const foundUser = data.users.find(u => u.email === typoEmail)
      if (foundUser) {
        console.log(`Found user in auth: ${foundUser.id} (${foundUser.email})`)
        found = true
        break
      }
      page++
    }
    if (!found) console.log('User not found in any page of auth.users.')
  }
}

checkTypoEmail()
