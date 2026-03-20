import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ONE-TIME SETUP ROUTE: Promotes the currently logged-in user to admin
// Visit /api/admin-setup in your browser while logged in
// DELETE THIS FILE after your first admin account is set up!
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('members')
    .update({ role: 'admin', status: 'approved' })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `✅ ${data.full_name} (${data.email}) is now an admin! Sign out and log back in to access /admin`,
    member: { name: data.full_name, email: data.email, role: data.role, status: data.status }
  })
}
