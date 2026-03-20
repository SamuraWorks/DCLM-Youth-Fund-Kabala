import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Megaphone } from 'lucide-react'
import { DecisionNotificationForm } from '@/components/admin/decision-notification-form'
import { FundCategoryForm } from '@/components/admin/fund-category-form'
import { FundCategoryActions } from '@/components/admin/fund-category-actions'
import type { FundCategory, FundBalance, Member } from '@/lib/types'

export default async function FundsPage() {
  const supabase = await createClient()

  // Get current user role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentMember } = await supabase
    .from('members')
    .select('role')
    .eq('user_id', user?.id)
    .single()
  
  const role = currentMember?.role || 'member'
  const isManagement = role === 'admin' || role === 'treasurer'
  const isAuthorized = isManagement || role === 'youth_coordinator'

  // Get fund categories with balances
  const { data: categories } = await supabase
    .from('fund_categories')
    .select('*')
    .order('name')

  const { data: balances } = await supabase
    .from('fund_balances')
    .select('*')

  const categoriesList = (categories || []) as FundCategory[]
  const balancesList = (balances || []) as FundBalance[]

  // Map balances to categories
  const balanceMap = new Map(balancesList.map(b => [b.category_id, b.balance]))

  const totalBalance = balancesList.reduce((sum: number, b: any) => sum + b.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fund Management</h1>
          <p className="text-muted-foreground">Manage fund categories and track balances</p>
        </div>
        {!isManagement && (
          <Badge variant="outline" className="text-accent border-accent/30">View Only Access</Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Balance */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Total Fund Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalBalance.toLocaleString()} Le</div>
            <p className="text-sm text-muted-foreground mt-1">
              Across {categoriesList.filter(c => c.is_active).length} active categories
            </p>
          </CardContent>
        </Card>

        {/* Management Decision Notification (Authorized Roles) */}
        {isAuthorized && (
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-accent" />
                Notify Members of Decisions
              </CardTitle>
              <CardDescription>Send a broadcast notification to all approved members</CardDescription>
            </CardHeader>
            <CardContent>
              <DecisionNotificationForm />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Category Form (Admin Only) */}
      {isManagement && (
        <Card>
          <CardHeader>
            <CardTitle>Add Fund Category</CardTitle>
            <CardDescription>Create a new fund category for organizing contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <FundCategoryForm />
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Categories</CardTitle>
          <CardDescription>
            {categoriesList.length} categor{categoriesList.length !== 1 ? 'ies' : 'y'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fund categories yet. Create one above.
            </div>
          ) : (
            <div className="space-y-4">
              {categoriesList.map((category) => {
                const balance = balanceMap.get(category.id) || 0
                const progress = category.target_amount
                  ? Math.min((balance / category.target_amount) * 100, 100)
                  : 0

                return (
                  <div
                    key={category.id}
                    className={`rounded-lg border p-4 ${!category.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{category.name}</h3>
                          {!category.is_active && (
                            <span className="text-xs text-muted-foreground">(Inactive)</span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                        )}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Balance: <span className="font-medium">{balance.toLocaleString()} Le</span></span>
                            {category.target_amount && (
                              <span className="text-muted-foreground">
                                Target: {category.target_amount.toLocaleString()} Le
                              </span>
                            )}
                          </div>
                          {category.target_amount && (
                            <Progress value={progress} className="h-2" />
                          )}
                        </div>
                      </div>
                      {isManagement && (
                        <FundCategoryActions category={category} currentBalance={balance} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
