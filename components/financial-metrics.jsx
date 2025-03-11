"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingDown, TrendingUp, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Função para formatação de valores monetários
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Componente de tooltip personalizado para gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white p-3 border rounded-lg shadow-sm">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-xs">
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className="font-medium">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function FinancialMetrics() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailedData, setDetailedData] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [availablePeriods, setAvailablePeriods] = useState([])
  const { tenant } = useParams()

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        // Fetch available periods from API
        const periodsResponse = await fetch(`/api/${tenant}/periods`)
        
        if (periodsResponse.ok) {
          const periodsData = await periodsResponse.json()
          setAvailablePeriods(periodsData)
        } else {
          // If API fails, create default periods (current month and previous 3 months)
          const currentDate = new Date()
          const periods = []
          
          for (let i = 0; i < 4; i++) {
            const date = new Date(currentDate)
            date.setMonth(currentDate.getMonth() - i)
            
            const month = date.toLocaleString('pt-BR', { month: 'long' })
            const year = date.getFullYear()
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            
            periods.push({
              label: `${month} ${year}`,
              value: i === 0 ? 'current' : value
            })
          }
          
          setAvailablePeriods(periods)
        }
      } catch (error) {
        console.error('Erro ao buscar períodos:', error)
      }
    }

    fetchPeriods()
  }, [tenant])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Buscar dados da API com o período selecionado
        const periodParam = selectedPeriod === 'current' ? '' : `?period=${selectedPeriod}`
        
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income${periodParam}`),
          fetch(`/api/${tenant}/bills${periodParam}`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          // Se a API retornar erro, mostrar dados zerados
          processEmptyData()
          return
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // Verificar se os dados estão vazios
        if (!incomesData.length && !expensesData.length) {
          processEmptyData()
          return
        }

        // Verificar se os dados são realmente do período selecionado
        if (selectedPeriod !== 'current') {
          const [year, month] = selectedPeriod.split('-').map(Number)
          
          // Verificar se há pelo menos um registro do período selecionado
          const hasIncomeFromPeriod = incomesData.some(income => {
            const incomeDate = new Date(income.date)
            return incomeDate.getFullYear() === year && incomeDate.getMonth() + 1 === month
          })
          
          const hasExpenseFromPeriod = expensesData.some(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month
          })
          
          // Se não houver dados específicos para o período, mostrar dados zerados
          if (!hasIncomeFromPeriod && !hasExpenseFromPeriod) {
            processEmptyData()
            return
          }
          
          // Filtrar apenas os dados do período selecionado
          const filteredIncomesData = incomesData.filter(income => {
            const incomeDate = new Date(income.date)
            return incomeDate.getFullYear() === year && incomeDate.getMonth() + 1 === month
          })
          
          const filteredExpensesData = expensesData.filter(expense => {
            const expenseDate = new Date(expense.date)
            return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month
          })
          
          // Processar apenas os dados filtrados
          processApiData(filteredIncomesData, filteredExpensesData, selectedPeriod)
          return
        }

        // Processar dados para o período atual
        processApiData(incomesData, expensesData, 'current')

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        // Em caso de erro, mostrar dados zerados
        processEmptyData()
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedPeriod) {
      fetchData()
    }
  }, [tenant, selectedPeriod])

  // Função para gerar dados vazios quando não há dados para o período
  const processEmptyData = () => {
    // Obter o período selecionado para exibição
    let periodoLabel = 'Período atual'
    
    if (selectedPeriod !== 'current') {
      const selectedPeriodObj = availablePeriods.find(p => p.value === selectedPeriod)
      periodoLabel = selectedPeriodObj ? selectedPeriodObj.label : 'Período selecionado'
    }
    
    // Estruturar dados detalhados zerados
    const emptyDetailedData = {
      current: {
        revenue: {
          sales: 0,
          services: 0,
          otherRevenue: 0,
        },
        deductions: {
          taxes: 0,
          cancellations: 0,
        },
        costs: {
          products: 0,
          services: 0,
          operational: 0,
        },
        expenses: {
          administrative: 0,
          sales: 0,
          financial: 0,
        },
        period: periodoLabel,
      },
      hasData: false
    }
    
    setDetailedData(emptyDetailedData)
    
    // Preparar dados simplificados zerados para exibição na lista
    setMetrics([
      { category: "Receita Bruta", value: 0 },
      { category: "(-) Deduções", value: 0 },
      { category: "Receita Líquida", value: 0 },
      { category: "(-) Custos Totais", value: 0 },
      { category: "Lucro Bruto", value: 0 },
      { category: "(-) Despesas Totais", value: 0 },
      { category: "Lucro Líquido", value: 0 },
    ])
  }

  // Função para processar os dados da API
  const processApiData = (incomesData, expensesData, period = 'current') => {
    // Separar receitas por tipo
    const vendas = incomesData
      .filter(income => income.type === 'vendas')
      .reduce((sum, income) => sum + income.amount, 0)
    
    const servicos = incomesData
      .filter(income => income.type === 'servicos')
      .reduce((sum, income) => sum + income.amount, 0)
    
    const outrasReceitas = incomesData
      .filter(income => income.type !== 'vendas' && income.type !== 'servicos')
      .reduce((sum, income) => sum + income.amount, 0)
    
    // Calcular receita bruta
    const receitaBruta = vendas + servicos + outrasReceitas
    
    // Calcular deduções - usando dados reais do banco
    const impostos = incomesData
      .filter(income => income.deduction_type === 'impostos')
      .reduce((sum, income) => sum + income.deduction_amount, 0)
    
    const cancelamentos = incomesData
      .filter(income => income.deduction_type === 'cancelamentos')
      .reduce((sum, income) => sum + income.deduction_amount, 0)
    
    // Calcular receita líquida
    const receitaLiquida = receitaBruta - Math.abs(impostos) - Math.abs(cancelamentos)
    
    // Separar custos por categoria
    const custosProdutos = expensesData
      .filter(expense => expense.type === 'produtos')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const custosServicos = expensesData
      .filter(expense => expense.type === 'servicos')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const custosOperacionais = expensesData
      .filter(expense => expense.type === 'operacional')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    // Calcular lucro bruto
    const lucroBruto = receitaLiquida - custosProdutos - custosServicos - custosOperacionais
    
    // Separar despesas por categoria
    const despesasAdministrativas = expensesData
      .filter(expense => expense.type === 'administrativo')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const despesasVendas = expensesData
      .filter(expense => expense.type === 'vendas')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    const despesasFinanceiras = expensesData
      .filter(expense => expense.type === 'financeiro')
      .reduce((sum, expense) => sum + expense.amount, 0)
    
    // Calcular lucro líquido
    const lucroLiquido = lucroBruto - despesasAdministrativas - despesasVendas - despesasFinanceiras
    
    // Determinar o período para exibição
    let periodoLabel = 'Período atual'
    
    if (period !== 'current') {
      const selectedPeriodObj = availablePeriods.find(p => p.value === period)
      periodoLabel = selectedPeriodObj ? selectedPeriodObj.label : 'Período selecionado'
    } else {
      // Obter mês e ano atuais para o período atual
      const data = new Date()
      const mesAtual = data.toLocaleString('pt-BR', { month: 'long' })
      const anoAtual = data.getFullYear()
      periodoLabel = `${mesAtual} ${anoAtual}`
    }
    
    // Estruturar dados detalhados
    const detailedData = {
      current: {
        revenue: {
          sales: vendas,
          services: servicos,
          otherRevenue: outrasReceitas,
        },
        deductions: {
          taxes: -impostos,
          cancellations: -cancelamentos,
        },
        costs: {
          products: -custosProdutos,
          services: -custosServicos,
          operational: -custosOperacionais,
        },
        expenses: {
          administrative: -despesasAdministrativas,
          sales: -despesasVendas,
          financial: -despesasFinanceiras,
        },
        period: periodoLabel,
      },
      hasData: true
    }
    
    setDetailedData(detailedData)
    
    // Preparar dados simplificados para exibição na lista
    setMetrics([
      { category: "Receita Bruta", value: receitaBruta },
      { category: "(-) Deduções", value: -(impostos + cancelamentos) },
      { category: "Receita Líquida", value: receitaLiquida },
      { category: "(-) Custos Totais", value: -(custosProdutos + custosServicos + custosOperacionais) },
      { category: "Lucro Bruto", value: lucroBruto },
      { category: "(-) Despesas Totais", value: -(despesasAdministrativas + despesasVendas + despesasFinanceiras) },
      { category: "Lucro Líquido", value: lucroLiquido },
    ])
  }

  if (isLoading || !detailedData) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="flex justify-between">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dreData = detailedData.current;

  // Cálculos principais
  const grossRevenue = dreData.revenue.sales + dreData.revenue.services + dreData.revenue.otherRevenue
  const totalDeductions = Object.values(dreData.deductions).reduce((a, b) => a + b, 0)
  const netRevenue = grossRevenue + totalDeductions
  const totalCosts = Object.values(dreData.costs).reduce((a, b) => a + b, 0)
  const grossProfit = netRevenue + totalCosts
  const totalExpenses = Object.values(dreData.expenses).reduce((a, b) => a + b, 0)
  const netProfit = grossProfit + totalExpenses

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Demonstração do Resultado do Exercício</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {detailedData?.current.period || 'Período atual'}
          </p>
        </div>
        
        {/* Filtro de período */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Período:</span>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerta de dados não disponíveis */}
      {detailedData && !detailedData.hasData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Não há dados financeiros disponíveis para o período selecionado. Exibindo valores zerados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Receita Bruta</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Receita Bruta</h4>
                    <p className="text-sm text-muted-foreground">
                      Total de receitas antes das deduções, incluindo vendas, serviços e outras receitas.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(grossRevenue)}</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1.5 bg-blue-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Receita Líquida</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Receita Líquida</h4>
                    <p className="text-sm text-muted-foreground">
                      Receita bruta menos deduções como impostos e cancelamentos.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(netRevenue)}</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1.5 bg-indigo-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Lucro Bruto</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Lucro Bruto</h4>
                    <p className="text-sm text-muted-foreground">
                      Receita líquida menos custos diretos de produtos e serviços.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1.5 bg-violet-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex justify-between">
              <span>Lucro Líquido</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Lucro Líquido</h4>
                    <p className="text-sm text-muted-foreground">
                      Lucro bruto menos todas as despesas operacionais, administrativas e financeiras.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1.5 bg-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Tabela DRE */}
      <Card>
        <CardHeader>
          <CardTitle>Demonstração do Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50%]">Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">AV%</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Receita Bruta */}
              <TableRow className="font-medium bg-muted/20">
                <TableCell>1. Receita Bruta</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(grossRevenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Vendas</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.revenue.sales)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.revenue.sales / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Serviços</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.revenue.services)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.revenue.services / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Outras Receitas</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.revenue.otherRevenue)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.revenue.otherRevenue / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Deduções */}
              <TableRow className="font-medium bg-muted/20">
                <TableCell>2. Deduções</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((totalDeductions / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right text-red-600 font-bold">
                  {formatCurrency(totalDeductions)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Impostos</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.deductions.taxes)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.deductions.taxes / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Cancelamentos</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.deductions.cancellations)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.deductions.cancellations / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Receita Líquida */}
              <TableRow className="font-medium bg-muted/50">
                <TableCell>3. Receita Líquida (1 + 2)</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((netRevenue / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(netRevenue)}</TableCell>
              </TableRow>

              {/* Custos */}
              <TableRow className="font-medium bg-muted/20">
                <TableCell>4. Custos</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((totalCosts / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right text-red-600 font-bold">{formatCurrency(totalCosts)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Custos de Produtos</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.products)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.costs.products / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Custos de Serviços</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.services)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.costs.services / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Custos Operacionais</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.costs.operational)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.costs.operational / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Lucro Bruto */}
              <TableRow className="font-medium bg-muted/50">
                <TableCell>5. Lucro Bruto (3 + 4)</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((grossProfit / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(grossProfit)}</TableCell>
              </TableRow>

              {/* Despesas */}
              <TableRow className="font-medium bg-muted/20">
                <TableCell>6. Despesas</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((totalExpenses / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right text-red-600 font-bold">{formatCurrency(totalExpenses)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Despesas Administrativas</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.expenses.administrative)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.expenses.administrative / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Despesas com Vendas</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(dreData.expenses.sales)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.expenses.sales / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Despesas Financeiras</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.expenses.financial)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.expenses.financial / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Lucro Líquido */}
              <TableRow className="font-medium text-lg bg-muted/50">
                <TableCell>7. Lucro Líquido (5 + 6)</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell className="text-right">{grossRevenue === 0 ? '0.0%' : ((netProfit / grossRevenue) * 100).toFixed(1) + '%'}</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(netProfit)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}