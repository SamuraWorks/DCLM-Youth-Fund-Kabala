import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Authenticate the caller
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, name } = await request.json()

    // MOCK EMAIL DISPATCH LOGIC
    // Integrating Resend or Nodemailer requires an API key which the project currently lacks in dependencies.
    // This logs the precise requested email template securely on the server.
    console.log('\n=============================================')
    console.log('📧 EMAIL DISPATCH TRIGGERED')
    console.log(`To: ${email}`)
    console.log(`Subject: Membership Approved`)
    console.log(`Body:`)
    console.log(`Congratulations ${name}!`)
    console.log(`Your membership with DCLM Youth Fund, Kabala has been approved.`)
    console.log(`You can now log in using the details you provided during signup.`)
    console.log('=============================================\n')
    
    // TODO: Connect this to Resend when an API key is available
    // await resend.emails.send({ from: 'noreply@dclmkabala.org', to: email, subject: 'Membership Approved', text: '...' })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
