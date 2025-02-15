"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, LayoutDashboard  } from "lucide-react"
import { useParams } from "next/navigation"


import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HospitalDashboardComponent() {
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dateRange, setDateRange] = useState("month") // new state for date range toggle
  const { tenant } = useParams()


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [incomesResponse, expensesResponse] = await Promise.all([
        fetch(`/api/${tenant}/income`),
        fetch(`/api/${tenant}/bills`)
      ])

      if (!incomesResponse.ok || !expensesResponse.ok) 
        throw new Error('Failed to fetch data')

      const [incomesData, expensesData] = await Promise.all([
        incomesResponse.json(),
        expensesResponse.json()
      ])

      setIncomes(incomesData)
      setExpenses(expensesData)
      setError("")
    } catch (error) {
      setError("Falha ao carregar dados do dashboard. Por favor, tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterData = (data) => {
    if (!startDate && !endDate) return data
    
    return data.filter(item => {
      const itemDate = new Date(item.date)
      const start = startDate ? new Date(startDate) : new Date(0)
      const end = endDate ? new Date(endDate) : new Date()
      end.setHours(23, 59, 59, 999)
      
      return itemDate >= start && itemDate <= end
    })
  }

  const filteredIncomes = filterData(incomes)
  const filteredExpenses = filterData(expenses)

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const profit = totalIncome - totalExpenses

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Calculate previous period metrics for comparison
  const getPreviousPeriodData = () => {
    const currentStart = startDate ? new Date(startDate) : new Date()
    const currentEnd = endDate ? new Date(endDate) : new Date()
    const difference = currentEnd - currentStart
    const previousStart = new Date(currentStart - difference)
    
    const previousIncomes = incomes.filter(item => {
      const date = new Date(item.date)
      return date >= previousStart && date < currentStart
    })
    
    const previousExpenses = expenses.filter(item => {
      const date = new Date(item.date)
      return date >= previousStart && date < currentStart
    })

    return {
      income: previousIncomes.reduce((sum, income) => sum + income.amount, 0),
      expenses: previousExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    }
  }

  const previousPeriod = getPreviousPeriodData()
  const incomeChange = getPercentageChange(totalIncome, previousPeriod.income)
  const expensesChange = getPercentageChange(totalExpenses, previousPeriod.expenses)

  const prepareMonthlyData = () => {
    const monthlyData = {}
    
    const allDates = [...filteredIncomes, ...filteredExpenses].map(item => {
      const date = new Date(item.date)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    })
    
    const uniqueMonths = [...new Set(allDates)].sort()
    uniqueMonths.forEach(month => {
      monthlyData[month] = { month, income: 0, expense: 0 }
    })
    
    filteredIncomes.forEach(item => {
      const date = new Date(item.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthYear].income += item.amount
    })
    
    filteredExpenses.forEach(item => {
      const date = new Date(item.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthYear].expense += item.amount
    })
    
    return Object.values(monthlyData).map(item => ({
      ...item,
      income: Number(item.income.toFixed(2)),
      expense: Number(item.expense.toFixed(2)),
      profit: Number((item.income - item.expense).toFixed(2))
    }))
  }

  const chartData = prepareMonthlyData()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <LayoutDashboard size={20} />
          Dashboard Financeiro
      </h1>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Inicial
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Final
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-40"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#1e1e1e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e1e1e]">
              R${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {incomeChange >= 0 ? (
                <span className="text-green-500">+{incomeChange.toFixed(1)}%</span>
              ) : (
                <span className="text-red-500">{incomeChange.toFixed(1)}%</span>
              )}
              {" "}vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Despesa Total
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-[#1e1e1e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e1e1e]">
              R${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {expensesChange >= 0 ? (
                <span className="text-red-500">+{expensesChange.toFixed(1)}%</span>
              ) : (
                <span className="text-green-500">{expensesChange.toFixed(1)}%</span>
              )}
              {" "}vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resultado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-[#1e1e1e]" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-[#1e1e1e]' : 'text-red-500'}`}>
              R${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Margem: {((profit / totalIncome) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Receitas e Despesas
            </CardTitle>
            <CardDescription>Análise comparativa mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-')
                      return `${month}/${year.slice(2)}`
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    labelFormatter={(label) => {
                      const [year, month] = label.split('-')
                      return `${month}/${year}`
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#2196F3" />
                  <Bar dataKey="expense" name="Despesas" fill="#F44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Resultado Mensal
            </CardTitle>
            <CardDescription>Evolução do resultado operacional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-')
                      return `${month}/${year.slice(2)}`
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    labelFormatter={(label) => {
                      const [year, month] = label.split('-')
                      return `${month}/${year}`
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    name="Resultado"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}