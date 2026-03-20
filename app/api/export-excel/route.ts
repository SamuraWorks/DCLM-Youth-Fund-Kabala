/**
 * NEW ISOLATED API ROUTE: /api/export-excel
 *
 * Completely independent from /api/export (CSV route).
 * Read-only. No mutations. Admin/treasurer only.
 * Returns a clean .xlsx file of all contributions.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildExportRows, generateExcelBuffer } from '@/lib/safe-export'

export async function GET() {
  const supabase = await createClient()

  // Auth check — read only, no mutations
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('members')
    .select('role, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const ADMIN_EMAILS = ['samuel540wisesamura@gmail.com', 'paulannehk@gmail.com', 'princessconteh673@gmail.com']
  const isAdminByEmail = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())
  const effectiveRole = isAdminByEmail ? 'admin' : member?.role

  if (!effectiveRole || !['admin', 'treasurer', 'youth_coordinator'].includes(effectiveRole)) {
    return NextResponse.json({ error: 'Forbidden — Insufficient permissions' }, { status: 403 })
  }

  // Fetch contributions with member info — READ ONLY
  const { data: contributions, error } = await supabase
    .from('contributions')
    .select('*, member:members!contributions_member_id_fkey(full_name, email)')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Safe Excel Export Error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }

  // Transform and generate Excel — all processing is local, no DB writes
  const rows = buildExportRows(contributions ?? [])
  const buffer = generateExcelBuffer(rows)

  const filename = `DLKYF_Contributions_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
