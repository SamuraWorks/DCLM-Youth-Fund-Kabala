import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wallet, Shield, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative isolate">
      <div className="watermark" aria-hidden="true" />
      {/* Header */}
      <header className="border-b bg-card relative z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white overflow-hidden border">
              <img src="/logo.jpg" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-foreground">DCLM Youth Fund</span>
              <span className="hidden text-sm text-muted-foreground sm:inline"> | Kabala</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Join Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-16 md:py-24 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            DCLM Youth Fund, Kabala
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
            Building a stronger community through collective savings. 
            Supporting emergencies, events, and charitable causes together.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Become a Member</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Member Login</Link>
            </Button>
          </div>
          {/* Admin Portal — separated from member flow */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/auth/admin-login"
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Shield className="h-4 w-4" />
              Admin Access
            </Link>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Our fund management system makes it easy to contribute and track your impact.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">Easy Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Pay your monthly 50 Leones minimum via Orange Money (+232 74 172197), 
                  Africell Money, bank transfer, or cash.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">Verified Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All payments are verified by administrators with proof of payment 
                  for complete transparency.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View your contribution history, see fund balances, and track 
                  the collective impact of our community.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4">Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Funds support emergency assistance, youth events, and 
                  charitable activities in our community.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Join?</h2>
          <p className="mt-4 text-muted-foreground">
            Sign up today and start contributing to our youth fund.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/sign-up">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 relative z-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>DCLM Youth Fund, Kabala</p>
          <p className="mt-1">Building community through collective savings.</p>
        </div>
      </footer>
    </div>
  )
}
