import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Users } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Users className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">DLKYF</h1>
        <p className="text-sm text-muted-foreground">Deeper Life Kabala Youth Fund</p>
      </div>

      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
