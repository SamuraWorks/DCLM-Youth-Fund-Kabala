import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function promoteToCoordinator() {
  const email = 'isaiahalberttestimony@gmail.com'
  const newRole = 'youth_coordinator'

  console.log(`--- Promoting User: ${email} to ${newRole} ---`)

  // 1. Find the member
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, user_id, full_name, role, status')
    .eq('email', email)
    .maybeSingle()

  if (memberError) {
    console.error('Error fetching member:', memberError.message)
    return
  }

  if (!member) {
    console.log(`✗ Member with email ${email} not found in database.`)
    console.log("Searching for user in Auth to see if they haven't synced yet...")
    const { data: authData } = await supabase.auth.admin.listUsers()
    const authUser = authData.users.find(u => u.email === email)
    
    if (authUser) {
      console.log(`✓ Found user in Auth: ${authUser.id}. Creating member record...`)
      const { error: insertError } = await supabase.from('members').insert({
        user_id: authUser.id,
        email: email,
        full_name: authUser.user_metadata?.full_name || 'Isaiah Albert Testimony',
        phone: 'N/A',
        role: newRole,
        status: 'approved',
        joined_date: new Date().toISOString().split('T')[0]
      })
      
      if (insertError) {
          console.error('Error creating member record:', insertError.message)
      } else {
          console.log('✓ Member record created and promoted.')
      }
    } else {
      console.log('✗ User not found in Auth either. They must sign up first.')
    }
    return
  }

  console.log(`Found Member: ${member.full_name} (ID: ${member.id}, Current Role: ${member.role})`)

  // 2. Update Role and Status
  console.log(`Updating role to ${newRole} and status to approved...`)
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      role: newRole, 
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', member.id)

  if (updateError) {
    console.error('✗ Error updating role:', updateError.message)
  } else {
    console.log(`✓ Successfully promoted ${member.full_name} to ${newRole}.`)
    console.log(`The change should take effect immediately upon their next page load or refresh.`)
  }

  // 3. Optional: Update Auth User Metadata for consistency (some apps use this for session)
  if (member.user_id) {
    console.log('Updating Auth user metadata...')
    const { error: authError } = await supabase.auth.admin.updateUserById(member.user_id, {
      user_metadata: { role: newRole }
    })
    if (authError) {
      console.error('Warning: Could not update auth user metadata:', authError.message)
    } else {
      console.log('✓ Auth user metadata updated.')
    }
  }

  console.log('--- PROMOTION COMPLETE ---')
}

promoteToCoordinator()
