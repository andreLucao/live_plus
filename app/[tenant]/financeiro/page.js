"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentTransactions } from "@/components/recent-transactions"
import { FinancialMetrics } from "@/components/financial-metrics"
import { ReconciliationTable } from "@/components/reconciliation-table"
import { CustomerMetrics } from "@/components/customer-metrics"
import { CashFlow } from "@/components/cash-flow"
import { CalendarDays, AlertCircle, TrendingUp, TrendingDown, ShieldAlert } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Dashboard component (unchanged)
function FinancialDashboard() {
  const [incomes, setIncomes] = useState([])
  const [bills, setBills] = useState([])
  const [lastMonthIncome, setLastMonthIncome] = useState(0)
  const [lastMonthExpenses, setLastMonthExpenses] = useState(0)
  const [lastMonthProfit, setLastMonthProfit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { tenant } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomesResponse, billsResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !billsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [incomesData, billsData] = await Promise.all([
          incomesResponse.json(),
          billsResponse.json()
        ])

        // Ordena os dados por data
        const sortedIncomes = incomesData.sort((a, b) => new Date(b.date) - new Date(a.date))
        const sortedBills = billsData.sort((a, b) => new Date(b.date) - new Date(a.date))

        // Agrupa por mês
        const incomesByMonth = groupByMonth(sortedIncomes)
        const expensesByMonth = groupByMonth(sortedBills)

        // Pega os meses únicos ordenados
        const months = [...new Set([...Object.keys(incomesByMonth), ...Object.keys(expensesByMonth)])].sort().reverse()

        // Se houver pelo menos dois meses de dados
        if (months.length >= 2) {
          const currentMonth = months[0]
          const previousMonth = months[1]

          // Calcula totais do mês anterior
          setLastMonthIncome(
            (incomesByMonth[previousMonth] || []).reduce((sum, income) => sum + income.amount, 0)
          )
          setLastMonthExpenses(
            (expensesByMonth[previousMonth] || []).reduce((sum, bill) => sum + bill.amount, 0)
          )
          setLastMonthProfit(
            (incomesByMonth[previousMonth] || []).reduce((sum, income) => sum + income.amount, 0) -
            (expensesByMonth[previousMonth] || []).reduce((sum, bill) => sum + bill.amount, 0)
          )
        }

        setIncomes(sortedIncomes)
        setBills(sortedBills)
        setError("")
      } catch (error) {
        setError("Falha ao carregar dados do dashboard. Por favor, tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

  // Função auxiliar para agrupar dados por mês
  const groupByMonth = (data) => {
    return data.reduce((groups, item) => {
      const date = new Date(item.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      groups[monthYear].push(item)
      return groups
    }, {})
  }

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
  const totalExpenses = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const profit = totalIncome - totalExpenses

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4" />
              <span>Período: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <TabsTrigger value="overview" className="text-sm">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="text-sm">
                Fluxo de Caixa
              </TabsTrigger>
              <TabsTrigger value="dre" className="text-sm">
                DRE
              </TabsTrigger>
              <TabsTrigger value="reconciliation" className="text-sm">
                Conciliação
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-sm">
                Indicadores
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {lastMonthIncome > 0 && (
                    <div className="flex items-center mt-1">
                      {totalIncome > lastMonthIncome ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${totalIncome > lastMonthIncome ? "text-green-500" : "text-red-500"}`}>
                        {(((totalIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1)}% mês anterior
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {lastMonthExpenses > 0 && (
                    <div className="flex items-center mt-1">
                      {totalExpenses < lastMonthExpenses ? (
                        <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${totalExpenses < lastMonthExpenses ? "text-green-500" : "text-red-500"}`}>
                        {(((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100).toFixed(1)}% mês anterior
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  {lastMonthProfit !== 0 && (
                    <div className="flex items-center mt-1">
                      {profit > lastMonthProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${profit > lastMonthProfit ? "text-green-500" : "text-red-500"}`}>
                        {(((profit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100).toFixed(1)}% mês anterior
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 shadow-sm">
                <CardHeader>
                  <CardTitle>Visão Geral</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview />
                </CardContent>
              </Card>
              <Card className="col-span-3 shadow-sm">
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentTransactions />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <CashFlow />
          </TabsContent>

          <TabsContent value="dre" className="space-y-4">
            <FinancialMetrics />
          </TabsContent>

          <TabsContent value="reconciliation" className="space-y-4">
            <ReconciliationTable />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <CustomerMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Role protection wrapper
function RoleProtectedDashboard() {
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const { tenant } = useParams()

  useEffect(() => {
    const verifyRole = async () => {
      try {
        const response = await fetch(`/api/${tenant}/auth/verify-role`)
        
        if (!response.ok) {
          // If 401 or 403, redirect to login
          if (response.status === 401 || response.status === 403) {
            router.push(`/${tenant}/login`)
            return
          }
          throw new Error("Failed to verify role")
        }

        const data = await response.json()
        setUserRole(data.role)

        // Redirect if not owner or admin
        if (data.role !== "owner" && data.role !== "admin") {
          router.push(`/${tenant}/unauthorized`)
        }
      } catch (error) {
        console.error("Role verification error:", error)
        setError("Falha ao verificar permissões. Por favor, tente novamente.")
      } finally {
        setLoading(false)
      }
    }

    verifyRole()
  }, [router, tenant])

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Autorização</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // If role is not owner or admin, show unauthorized message (fallback in case redirect fails)
  if (userRole !== "owner" && userRole !== "admin") {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta página. Esta seção é restrita para usuários com permissão de proprietário ou administrador.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // If role is owner, render the dashboard
  return <FinancialDashboard />
}

// Export the protected dashboard as default
export default RoleProtectedDashboard