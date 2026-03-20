import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BackButton } from '@/components/ui/back-button'
import { ScrollText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ADMIN_EMAILS = ['samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com']
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  let { data: member } = user ? await supabase.from('members').select('role').eq('user_id', user.id).single() : { data: null }

  if (isAdmin) {
    if (!member) member = { role: 'admin' } as any
    else member.role = 'admin'
  }

  if (!user || !member || !['admin', 'treasurer', 'youth_coordinator'].includes(member.role)) {
    return <div className="p-8 text-center text-muted-foreground">Admin or Coordinator access required.</div>
  }

  const { data: entries } = await supabase
    .from('ledger_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const typeColors: Record<string, string> = {
    contribution: 'bg-green-500/10 text-green-700 border-green-200',
    extra_contribution: 'bg-blue-500/10 text-blue-700 border-blue-200',
    withdrawal: 'bg-red-500/10 text-red-700 border-red-200',
    bank_deposit: 'bg-purple-500/10 text-purple-700 border-purple-200',
    expense: 'bg-orange-500/10 text-orange-700 border-orange-200',
    member_approved: 'bg-gray-500/10 text-gray-700 border-gray-200',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ScrollText className="h-6 w-6" />
            Immutable Ledger
          </h1>
          <p className="text-muted-foreground">
            Complete audit trail — every entry is permanent and cannot be edited or deleted
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackButton />
          <a
            href="/api/export-excel"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow transition hover:bg-accent/90"
          >
            Export Excel
          </a>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Ledger Entries ({entries?.length || 0})</CardTitle>
          <CardDescription>
            Showing latest 200 entries. Download CSV for full history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No ledger entries yet. Actions will appear here automatically.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry: any) => (
                <div key={entry.id} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${typeColors[entry.type] || ''}`}
                      >
                        {entry.type.replace('_', ' ')}
                      </Badge>
                      <span className="font-medium text-sm">{entry.description}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {entry.member_name && <span>Member: {entry.member_name}</span>}
                      {entry.approved_by_name && <span>Approved by: <strong>{entry.approved_by_name}</strong></span>}
                      <span className="font-mono">{entry.transaction_id}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {entry.amount != null && (
                      <p className={`font-bold ${entry.type === 'withdrawal' ? 'text-destructive' : 'text-green-600'}`}>
                        {entry.type === 'withdrawal' ? '-' : '+'}{Number(entry.amount).toLocaleString()} Le
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
