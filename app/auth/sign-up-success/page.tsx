import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Users } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Users className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">DCLM Youth Fund, Kabala</h1>
        <p className="text-sm text-muted-foreground">Kabala Management System</p>
      </div>

      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            {"We've sent a confirmation link to your email address. Please click the link to verify your account."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After verification, an admin will review and approve your membership. 
            {"You'll"} receive a notification once approved.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
