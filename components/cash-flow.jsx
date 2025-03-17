"use client"

import { useState, useEffect } from 'react'
import { useFinance } from "@/app/contexts/FinanceContext"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calculator,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CashFlow() {
  const [data, setData] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const [metrics, setMetrics] = useState({
    entradas: 0,
    entradasPercentage: 0,
    saidas: 0,
    saidasPercentage: 0,
    saldoFinal: 0,
    saldoFinalPercentage: 0
  })
  const [categoryData, setCategoryData] = useState({
    receitas: [],
    despesas: []
  })
  const { incomes, bills, isLoading } = useFinance()

  const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']

  useEffect(() => {
    if (incomes && bills) {
      // Agrupa dados por mês
      const monthlyData = {}
      const today = new Date()
      const currentMonth = today.getMonth()
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const currentYear = today.getFullYear()
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
      
      // Processa receitas
      incomes.forEach(income => {
        const date = new Date(income.date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: date.toLocaleString('pt-BR', { month: 'short' }),
            monthYear,
            inflow: 0,
            outflow: 0
          }
        }
        
        monthlyData[monthYear].inflow += income.amount
      })

      // Processa despesas
      bills.forEach(expense => {
        const date = new Date(expense.date)
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: date.toLocaleString('pt-BR', { month: 'short' }),
            monthYear,
            inflow: 0,
            outflow: 0
          }
        }
        
        monthlyData[monthYear].outflow += expense.amount
      })

      // Converte para array e ordena por data
      const sortedData = Object.values(monthlyData)
        .sort((a, b) => {
          const [aYear, aMonth] = a.monthYear.split('-').map(Number)
          const [bYear, bMonth] = b.monthYear.split('-').map(Number)
          return aYear === bYear ? aMonth - bMonth : aYear - bYear
        })
        .slice(-6) // Últimos 6 meses
        .map(item => ({
          ...item,
          inflow: Number(item.inflow.toFixed(2)),
          outflow: -Number(item.outflow.toFixed(2)), // Valor negativo para visualização
          balance: Number((item.inflow - item.outflow).toFixed(2))
        }))

      setData(sortedData)

      // Current month and previous month for percentage calculations
      const currentMonthData = sortedData.find(item => {
        const [year, month] = item.monthYear.split('-').map(Number)
        return year === currentYear && month === currentMonth + 1
      }) || { inflow: 0, outflow: 0, balance: 0 }

      const previousMonthData = sortedData.find(item => {
        const [year, month] = item.monthYear.split('-').map(Number)
        return year === previousYear && month === previousMonth + 1
      }) || { inflow: 0, outflow: 0, balance: 0 }

      // Calcula métricas
      const currentMonthYearStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`

      // Prepare Category Data for each tab
      const incomeCategories = incomes.reduce((acc, income) => {
        const category = income.category || 'Outros'
        if (!acc[category]) acc[category] = 0
        acc[category] += income.amount
        return acc
      }, {})

      const expenseCategories = bills.reduce((acc, expense) => {
        const category = expense.category || 'Outros'
        if (!acc[category]) acc[category] = 0
        acc[category] += expense.amount
        return acc
      }, {})

      setCategoryData({
        receitas: Object.entries(incomeCategories).map(([name, value]) => ({ name, value })),
        despesas: Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))
      })

      // Entradas (todas as receitas do mês atual)
      const entradas = incomes
        .filter(income => {
          const date = new Date(income.date)
          const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          return itemMonth === currentMonthYearStr
        })
        .reduce((sum, income) => sum + income.amount, 0)

      // Percentual de variação das entradas
      const entradasAnterior = incomes
        .filter(income => {
          const date = new Date(income.date)
          const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          return itemMonth === `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
        })
        .reduce((sum, income) => sum + income.amount, 0)

      const entradasPercentage = entradasAnterior ? 
        ((entradas - entradasAnterior) / entradasAnterior) * 100 : 0

      // Saídas (todas as despesas do mês atual)
      const saidas = bills
        .filter(expense => {
          const date = new Date(expense.date)
          const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          return itemMonth === currentMonthYearStr
        })
        .reduce((sum, expense) => sum + expense.amount, 0)

      // Percentual de variação das saídas
      const saidasAnterior = bills
        .filter(expense => {
          const date = new Date(expense.date)
          const itemMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          return itemMonth === `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}`
        })
        .reduce((sum, expense) => sum + expense.amount, 0)

      const saidasPercentage = saidasAnterior ? 
        ((saidas - saidasAnterior) / saidasAnterior) * 100 : 0

      // Saldo Final (entradas - saídas) do mês atual
      const saldoFinal = entradas - saidas

      // Percentual de variação do saldo final
      const saldoFinalAnterior = entradasAnterior - saidasAnterior
      const saldoFinalPercentage = saldoFinalAnterior ? 
        ((saldoFinal - saldoFinalAnterior) / Math.abs(saldoFinalAnterior)) * 100 : 0

      setMetrics({
        entradas,
        entradasPercentage,
        saidas,
        saidasPercentage,
        saldoFinal,
        saldoFinalPercentage
      })
    }
  }, [incomes, bills])

  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  const renderPercentageChange = (value, inverse = false) => {
    const isPositive = inverse ? value < 0 : value > 0
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-sm animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-[300px] bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Entradas</h3>
              <p className="text-2xl font-bold mt-2 text-green-600">
                R$ {metrics.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </div>
          {renderPercentageChange(metrics.entradasPercentage)}
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Saídas</h3>
              <p className="text-2xl font-bold mt-2 text-red-600">
                R$ {metrics.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>
          {renderPercentageChange(metrics.saidasPercentage, true)}
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Saldo Final</h3>
              <p className={`text-2xl font-bold mt-2 ${metrics.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {metrics.saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Calculator className="h-5 w-5 text-gray-500" />
          </div>
          {renderPercentageChange(metrics.saldoFinalPercentage)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Tabs defaultValue="overview" onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${Math.abs(value / 1000)}k`}
                />
                <Tooltip 
                  formatter={(value) => `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="inflow" name="Entradas" fill="#22c55e" />
                <Bar dataKey="outflow" name="Saídas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="receitas">
            <h3 className="text-lg font-semibold mb-4">Análise de Receitas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="inflow" name="Receitas" stroke="#22c55e" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-md font-medium mb-2">Distribuição por Categoria</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.receitas}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.receitas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="despesas">
            <h3 className="text-lg font-semibold mb-4">Análise de Despesas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${Math.abs(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip 
                      formatter={(value) => `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="outflow" name="Despesas" stroke="#ef4444" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-md font-medium mb-2">Distribuição por Categoria</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData.despesas}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.despesas.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}