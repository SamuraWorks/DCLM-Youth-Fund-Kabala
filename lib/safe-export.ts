/**
 * SAFE EXPORT UTILITY — safeExportLedger
 *
 * Isolated, read-only module.
 * No side effects. No state mutations. No DB writes.
 * Used exclusively by /api/export-excel route.
 */

import * as XLSX from 'xlsx'

export interface SafeContributionRow {
  member_name: string
  email: string
  month: string
  monthly_amount: number
  extra_amount: number
  total_amount: number
  status: string
  payment_method: string
  transaction_id: string
  date: string
  verified_total: number
}

/**
 * Transform raw Supabase contributions data into clean export rows.
 * All formatting happens here — no mutation of original data.
 */
export function buildExportRows(contributions: any[]): SafeContributionRow[] {
  // Compute verified totals per member
  const verifiedTotals: Record<string, number> = {};
  contributions.forEach((c) => {
    const isVerified = c.status === 'verified';
    if (isVerified) {
      const memberId = c.member_id ?? c.member?.id ?? 'unknown';
      const monthly = Number(c.monthly_amount) || 0;
      const extra = Number(c.extra_amount) || 0;
      const total = monthly + extra;
      verifiedTotals[memberId] = (verifiedTotals[memberId] || 0) + total;
    }
  });

  return contributions.map((c) => {
    const isVerified = c.status === 'verified';
    const isRejected = c.status === 'rejected';
    
    // If rejected, show 0 in the row totals as requested
    const monthly = !isRejected ? (Number(c.monthly_amount) || 0) : 0;
    const extra = !isRejected ? (Number(c.extra_amount) || 0) : 0;
    const total = monthly + extra;
    
    const memberId = c.member_id ?? c.member?.id ?? 'unknown';
    
    return {
      member_name: c.member?.full_name ?? c.member_name ?? 'Unknown',
      email: c.member?.email ?? c.email ?? '',
      month: c.month ?? '',
      monthly_amount: monthly,
      extra_amount: extra,
      total_amount: total,
      status: (c.status ?? 'pending').charAt(0).toUpperCase() + (c.status ?? 'pending').slice(1),
      payment_method: (c.payment_method ?? '').replace(/_/g, ' '),
      transaction_id: c.payment_reference ?? c.id ?? '',
      date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '',
      verified_total: verifiedTotals[memberId] ?? 0,
    };
  });
}

/**
 * Generate a clean .xlsx buffer from rows.
 * Each contribution = one row. Each field = one column.
 * No merged cells. No JSON. No clustering.
 */
export function generateExcelBuffer(rows: SafeContributionRow[]): Buffer {
  const headers = [
    'Member Name',
    'Email',
    'Month',
    'Monthly Contribution (Le)',
    'Extra Contribution (Le)',
    'Total Contribution (Le)',
    'Status',
    'Payment Method',
    'Transaction ID',
    'Date',
    'Verified Total (Le)',
  ]

  const sheetData = [
    headers,
    ...rows.map((r) => [
      r.member_name,
      r.email,
      r.month,
      r.monthly_amount,
      r.extra_amount,
      r.total_amount,
      r.status,
      r.payment_method,
      r.transaction_id,
      r.date,
      r.verified_total,
    ]),
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

  // Set consistent column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Member Name
    { wch: 30 }, // Email
    { wch: 12 }, // Month
    { wch: 22 }, // Monthly
    { wch: 22 }, // Extra
    { wch: 22 }, // Total
    { wch: 12 }, // Status
    { wch: 18 }, // Payment Method
    { wch: 30 }, // Transaction ID
    { wch: 14 }, // Date
    { wch: 22 }, // Verified Total
  ]

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contributions')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
