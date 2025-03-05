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
  const [historicalData, setHistoricalData] = useState([])
  const [projectedData, setProjectedData] = useState([])
  const { tenant } = useParams()
  
  // Estados para controles de UI
  const [selectedPeriod, setSelectedPeriod] = useState("current")
  const [activeTab, setActiveTab] = useState("overview")
  const [comparisonPeriod, setComparisonPeriod] = useState("previous")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados da API
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // Processar dados para o período atual
        processApiData(incomesData, expensesData)
        
        // Gerar dados históricos e projeções com base nos dados reais
        generateHistoricalAndProjectedData(incomesData, expensesData)

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant, selectedPeriod])

  // Função para processar os dados da API
  const processApiData = (incomesData, expensesData) => {
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
    
    // Calcular deduções
    const impostos = incomesData
      .reduce((sum, income) => sum + (income.amount * 0.08), 0) // Simula 8% de impostos
    
    const cancelamentos = incomesData
      .reduce((sum, income) => sum + (income.amount * 0.02), 0) // Simula 2% de cancelamentos
    
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
    
    // Obter mês e ano atuais
    const data = new Date()
    const mesAtual = data.toLocaleString('pt-BR', { month: 'long' })
    const anoAtual = data.getFullYear()
    const periodoAtual = `${mesAtual} ${anoAtual}`
    
    // Simular dados do período anterior (10% menor)
    const simulatePreviousPeriod = (value) => value * 0.9
    
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
        previousPeriod: {
          grossRevenue: simulatePreviousPeriod(receitaBruta),
          netRevenue: simulatePreviousPeriod(receitaLiquida),
          grossProfit: simulatePreviousPeriod(lucroBruto),
          netProfit: simulatePreviousPeriod(lucroLiquido),
        },
        period: periodoAtual,
      },
      // Simular período anterior (mês anterior)
      previous: {
        revenue: {
          sales: simulatePreviousPeriod(vendas),
          services: simulatePreviousPeriod(servicos),
          otherRevenue: simulatePreviousPeriod(outrasReceitas),
        },
        deductions: {
          taxes: -simulatePreviousPeriod(impostos),
          cancellations: -simulatePreviousPeriod(cancelamentos),
        },
        costs: {
          products: -simulatePreviousPeriod(custosProdutos),
          services: -simulatePreviousPeriod(custosServicos),
          operational: -simulatePreviousPeriod(custosOperacionais),
        },
        expenses: {
          administrative: -simulatePreviousPeriod(despesasAdministrativas),
          sales: -simulatePreviousPeriod(despesasVendas),
          financial: -simulatePreviousPeriod(despesasFinanceiras),
        },
        previousPeriod: {
          grossRevenue: simulatePreviousPeriod(simulatePreviousPeriod(receitaBruta)),
          netRevenue: simulatePreviousPeriod(simulatePreviousPeriod(receitaLiquida)),
          grossProfit: simulatePreviousPeriod(simulatePreviousPeriod(lucroBruto)),
          netProfit: simulatePreviousPeriod(simulatePreviousPeriod(lucroLiquido)),
        },
        period: 'Mês anterior',
      },
      // Simular mesmo período do ano anterior (80% do atual)
      lastYear: {
        revenue: {
          sales: vendas * 0.8,
          services: servicos * 0.8,
          otherRevenue: outrasReceitas * 0.8,
        },
        deductions: {
          taxes: -impostos * 0.8,
          cancellations: -cancelamentos * 0.8,
        },
        costs: {
          products: -custosProdutos * 0.8,
          services: -custosServicos * 0.8,
          operational: -custosOperacionais * 0.8,
        },
        expenses: {
          administrative: -despesasAdministrativas * 0.8,
          sales: -despesasVendas * 0.8,
          financial: -despesasFinanceiras * 0.8,
        },
        previousPeriod: {
          grossRevenue: receitaBruta * 0.75,
          netRevenue: receitaLiquida * 0.75,
          grossProfit: lucroBruto * 0.75,
          netProfit: lucroLiquido * 0.75,
        },
        period: `${mesAtual} ${anoAtual - 1}`,
      },
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

  // Função para gerar dados históricos e projetados
  const generateHistoricalAndProjectedData = (incomesData, expensesData) => {
    // Obter a soma total de receitas e despesas para uso como base
    const totalReceitas = incomesData.reduce((sum, income) => sum + income.amount, 0)
    const totalDespesas = expensesData.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Calcular lucro bruto e líquido aproximados
    const lucroAproximado = totalReceitas - totalDespesas
    
    // Gerar dados históricos (6 meses)
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const dataAtual = new Date()
    const mesAtual = dataAtual.getMonth()
    
    const history = []
    
    // Gerar 6 meses de histórico (decrescendo com alguma variação)
    for (let i = 5; i >= 0; i--) {
      const mesIndice = (mesAtual - i + 12) % 12
      const fatorVariacao = 0.9 + (i * 0.02) // Simula crescimento gradual
      
      history.push({
        month: meses[mesIndice],
        grossRevenue: totalReceitas * fatorVariacao * (0.95 + Math.random() * 0.1),
        netRevenue: totalReceitas * fatorVariacao * 0.85 * (0.95 + Math.random() * 0.1),
        grossProfit: totalReceitas * fatorVariacao * 0.5 * (0.95 + Math.random() * 0.1),
        netProfit: lucroAproximado * fatorVariacao * (0.95 + Math.random() * 0.1),
      })
    }
    
    setHistoricalData(history)
    
    // Gerar projeções para os próximos 3 meses
    const projections = []
    
    for (let i = 1; i <= 3; i++) {
      const mesIndice = (mesAtual + i) % 12
      const fatorCrescimento = 1 + (i * 0.03) // Projeção de crescimento de 3% ao mês
      
      projections.push({
        month: meses[mesIndice],
        grossRevenue: totalReceitas * fatorCrescimento,
        netRevenue: totalReceitas * fatorCrescimento * 0.85,
        grossProfit: totalReceitas * fatorCrescimento * 0.5,
        netProfit: lucroAproximado * fatorCrescimento,
        projected: true,
      })
    }
    
    setProjectedData(projections)
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

  const dreData = detailedData[selectedPeriod]
  const comparisonData = detailedData[comparisonPeriod]

  // Cálculos principais
  const grossRevenue = dreData.revenue.sales + dreData.revenue.services + dreData.revenue.otherRevenue
  const totalDeductions = Object.values(dreData.deductions).reduce((a, b) => a + b, 0)
  const netRevenue = grossRevenue + totalDeductions
  const totalCosts = Object.values(dreData.costs).reduce((a, b) => a + b, 0)
  const grossProfit = netRevenue + totalCosts
  const totalExpenses = Object.values(dreData.expenses).reduce((a, b) => a + b, 0)
  const netProfit = grossProfit + totalExpenses

  // Cálculos para o período de comparação
  const compGrossRevenue =
    comparisonData.revenue.sales + comparisonData.revenue.services + comparisonData.revenue.otherRevenue
  const compTotalDeductions = Object.values(comparisonData.deductions).reduce((a, b) => a + b, 0)
  const compNetRevenue = compGrossRevenue + compTotalDeductions
  const compTotalCosts = Object.values(comparisonData.costs).reduce((a, b) => a + b, 0)
  const compGrossProfit = compNetRevenue + compTotalCosts
  const compTotalExpenses = Object.values(comparisonData.expenses).reduce((a, b) => a + b, 0)
  const compNetProfit = compGrossProfit + compTotalExpenses

  // Cálculo das variações percentuais
  const getVariation = (current, previous) => {
    const variation = ((current - previous) / previous) * 100
    return {
      value: variation.toFixed(1),
      isPositive: variation > 0,
    }
  }

  // Variações em relação ao período anterior
  const variations = {
    grossRevenue: getVariation(grossRevenue, dreData.previousPeriod.grossRevenue),
    netRevenue: getVariation(netRevenue, dreData.previousPeriod.netRevenue),
    grossProfit: getVariation(grossProfit, dreData.previousPeriod.grossProfit),
    netProfit: getVariation(netProfit, dreData.previousPeriod.netProfit),
  }

  // Variações em relação ao período de comparação
  const comparisonVariations = {
    grossRevenue: getVariation(grossRevenue, compGrossRevenue),
    netRevenue: getVariation(netRevenue, compNetRevenue),
    grossProfit: getVariation(grossProfit, compGrossProfit),
    netProfit: getVariation(netProfit, compNetProfit),
  }

  // Cálculo de indicadores financeiros
  const financialIndicators = {
    grossMargin: (grossProfit / netRevenue) * 100,
    netMargin: (netProfit / netRevenue) * 100,
    costRatio: (Math.abs(totalCosts) / netRevenue) * 100,
    expenseRatio: (Math.abs(totalExpenses) / netRevenue) * 100,
  }

  // Comparação de indicadores financeiros
  const compFinancialIndicators = {
    grossMargin: (compGrossProfit / compNetRevenue) * 100,
    netMargin: (compNetProfit / compNetRevenue) * 100,
    costRatio: (Math.abs(compTotalCosts) / compNetRevenue) * 100,
    expenseRatio: (Math.abs(compTotalExpenses) / compNetRevenue) * 100,
  }

  // Variações dos indicadores
  const indicatorVariations = {
    grossMargin: getVariation(financialIndicators.grossMargin, compFinancialIndicators.grossMargin),
    netMargin: getVariation(financialIndicators.netMargin, compFinancialIndicators.netMargin),
    costRatio: getVariation(financialIndicators.costRatio, compFinancialIndicators.costRatio),
    expenseRatio: getVariation(financialIndicators.expenseRatio, compFinancialIndicators.expenseRatio),
  }

  // Combinação de dados históricos e projeções para gráficos
  const combinedData = [...historicalData, ...projectedData]

  return (
    <div className="space-y-8">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Demonstração do Resultado do Exercício</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {dreData.period}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedPeriod}
            onValueChange={(value) => setSelectedPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Período Atual</SelectItem>
              <SelectItem value="previous">Período Anterior</SelectItem>
              <SelectItem value="lastYear">Mesmo Período Ano Anterior</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={comparisonPeriod}
            onValueChange={(value) => setComparisonPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Comparar com" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Mês Anterior</SelectItem>
              <SelectItem value="lastYear">Mesmo mês ano anterior</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

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
                <div className="flex items-center mt-1">
                  {variations.grossRevenue.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${variations.grossRevenue.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {variations.grossRevenue.value}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  vs {comparisonPeriod === "previous" ? "Mês Anterior" : "Ano Anterior"}
                </span>
                <span
                  className={`text-sm font-medium flex items-center ${comparisonVariations.grossRevenue.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {comparisonVariations.grossRevenue.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {comparisonVariations.grossRevenue.value}%
                </span>
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
                <div className="flex items-center mt-1">
                  {variations.netRevenue.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${variations.netRevenue.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {variations.netRevenue.value}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  vs {comparisonPeriod === "previous" ? "Mês Anterior" : "Ano Anterior"}
                </span>
                <span
                  className={`text-sm font-medium flex items-center ${comparisonVariations.netRevenue.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {comparisonVariations.netRevenue.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {comparisonVariations.netRevenue.value}%
                </span>
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
                <div className="flex items-center mt-1">
                  {variations.grossProfit.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${variations.grossProfit.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {variations.grossProfit.value}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  vs {comparisonPeriod === "previous" ? "Mês Anterior" : "Ano Anterior"}
                </span>
                <span
                  className={`text-sm font-medium flex items-center ${comparisonVariations.grossProfit.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {comparisonVariations.grossProfit.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {comparisonVariations.grossProfit.value}%
                </span>
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
                <div className="flex items-center mt-1">
                  {variations.netProfit.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${variations.netProfit.isPositive ? "text-green-500" : "text-red-500"}`}>
                    {variations.netProfit.value}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">
                  vs {comparisonPeriod === "previous" ? "Mês Anterior" : "Ano Anterior"}
                </span>
                <span
                  className={`text-sm font-medium flex items-center ${comparisonVariations.netProfit.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {comparisonVariations.netProfit.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {comparisonVariations.netProfit.value}%
                </span>
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-1.5 bg-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Indicadores Financeiros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{financialIndicators.grossMargin.toFixed(1)}%</div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-medium flex items-center ${indicatorVariations.grossMargin.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {indicatorVariations.grossMargin.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {indicatorVariations.grossMargin.value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{financialIndicators.netMargin.toFixed(1)}%</div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-medium flex items-center ${indicatorVariations.netMargin.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {indicatorVariations.netMargin.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {indicatorVariations.netMargin.value}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custos/Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{financialIndicators.costRatio.toFixed(1)}%</div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-medium flex items-center ${!indicatorVariations.costRatio.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {!indicatorVariations.costRatio.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(Number.parseFloat(indicatorVariations.costRatio.value))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas/Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{financialIndicators.expenseRatio.toFixed(1)}%</div>
              <div className="flex flex-col items-end">
                <span
                  className={`text-sm font-medium flex items-center ${!indicatorVariations.expenseRatio.isPositive ? "text-green-500" : "text-red-500"}`}
                >
                  {!indicatorVariations.expenseRatio.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(Number.parseFloat(indicatorVariations.expenseRatio.value))}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Visualização */}
      <Card className="border-none shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Análise Financeira</CardTitle>
              <CardDescription>Visualize e analise os resultados financeiros</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="p-6" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Tabela DRE */}
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
                      {((dreData.revenue.sales / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Serviços</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.revenue.services)}</TableCell>
                    <TableCell className="text-right">
                      {((dreData.revenue.services / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Outras Receitas</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.revenue.otherRevenue)}</TableCell>
                    <TableCell className="text-right">
                      {((dreData.revenue.otherRevenue / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Deduções */}
                  <TableRow className="font-medium bg-muted/20">
                    <TableCell>2. Deduções</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((totalDeductions / grossRevenue) * 100).toFixed(1)}%</TableCell>
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
                      {((dreData.deductions.taxes / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Cancelamentos</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(dreData.deductions.cancellations)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((dreData.deductions.cancellations / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Receita Líquida */}
                  <TableRow className="font-medium bg-muted/50">
                    <TableCell>3. Receita Líquida (1 + 2)</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((netRevenue / grossRevenue) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(netRevenue)}</TableCell>
                  </TableRow>

                  {/* Custos */}
                  <TableRow className="font-medium bg-muted/20">
                    <TableCell>4. Custos</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((totalCosts / grossRevenue) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-red-600 font-bold">{formatCurrency(totalCosts)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Custos de Produtos</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.products)}</TableCell>
                    <TableCell className="text-right">
                      {((dreData.costs.products / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Custos de Serviços</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.services)}</TableCell>
                    <TableCell className="text-right">
                      {((dreData.costs.services / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Custos Operacionais</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(dreData.costs.operational)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((dreData.costs.operational / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Lucro Bruto */}
                  <TableRow className="font-medium bg-muted/50">
                    <TableCell>5. Lucro Bruto (3 + 4)</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((grossProfit / grossRevenue) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(grossProfit)}</TableCell>
                  </TableRow>

                  {/* Despesas */}
                  <TableRow className="font-medium bg-muted/20">
                    <TableCell>6. Despesas</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((totalExpenses / grossRevenue) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right text-red-600 font-bold">{formatCurrency(totalExpenses)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Despesas Administrativas</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(dreData.expenses.administrative)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((dreData.expenses.administrative / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Despesas com Vendas</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(dreData.expenses.sales)}</TableCell>
                    <TableCell className="text-right">
                      {((dreData.expenses.sales / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-8">Despesas Financeiras</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(dreData.expenses.financial)}
                    </TableCell>
                    <TableCell className="text-right">
                      {((dreData.expenses.financial / grossRevenue) * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>

                  {/* Lucro Líquido */}
                  <TableRow className="font-medium text-lg bg-muted/50">
                    <TableCell>7. Lucro Líquido (5 + 6)</TableCell>
                    <TableCell className="text-right"></TableCell>
                    <TableCell className="text-right">{((netProfit / grossRevenue) * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(netProfit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Comparação com período anterior */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Comparação com {comparisonPeriod === "previous" ? "Mês Anterior" : "Ano Anterior"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Receita Bruta</p>
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${comparisonVariations.grossRevenue.isPositive ? "text-green-500" : "text-red-500"}`}
                        >
                          {comparisonVariations.grossRevenue.value}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(grossRevenue - compGrossRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Receita Líquida</p>
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${comparisonVariations.netRevenue.isPositive ? "text-green-500" : "text-red-500"}`}
                        >
                          {comparisonVariations.netRevenue.value}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(netRevenue - compNetRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Lucro Bruto</p>
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${comparisonVariations.grossProfit.isPositive ? "text-green-500" : "text-red-500"}`}
                        >
                          {comparisonVariations.grossProfit.value}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(grossProfit - compGrossProfit)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Lucro Líquido</p>
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium ${comparisonVariations.netProfit.isPositive ? "text-green-500" : "text-red-500"}`}
                        >
                          {comparisonVariations.netProfit.value}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatCurrency(netProfit - compNetProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="mt-4 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Evolução e Projeção dos Resultados</CardTitle>
                  <CardDescription className="text-xs">
                    Histórico de 6 meses e projeção para os próximos 3 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${formatCurrency(value)}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="grossRevenue"
                          name="Receita Bruta"
                          stroke="#0088FE"
                          strokeWidth={2}
                          dot={(props) => {
                            const { cx, cy, payload } = props
                            if (payload.projected) {
                              return (
                                <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="#0088FE" viewBox="0 0 10 10">
                                  <circle cx="5" cy="5" r="4" strokeWidth="1" stroke="#fff" />
                                </svg>
                              )
                            }
                            return <circle cx={cx} cy={cy} r={4} fill="#0088FE" />
                          }}
                          strokeDasharray={(props) => (props.payload && props.payload.projected ? "5 5" : "0")}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netRevenue"
                          name="Receita Líquida"
                          stroke="#00C49F"
                          strokeWidth={2}
                          dot={(props) => {
                            const { cx, cy, payload } = props
                            if (payload.projected) {
                              return (
                                <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="#00C49F" viewBox="0 0 10 10">
                                  <circle cx="5" cy="5" r="4" strokeWidth="1" stroke="#fff" />
                                </svg>
                              )
                            }
                            return <circle cx={cx} cy={cy} r={4} fill="#00C49F" />
                          }}
                          strokeDasharray={(props) => (props.payload && props.payload.projected ? "5 5" : "0")}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Lucro Líquido"
                          stroke="#FF8042"
                          strokeWidth={2}
                          dot={(props) => {
                            const { cx, cy, payload } = props
                            if (payload.projected) {
                              return (
                                <svg x={cx - 5} y={cy - 5} width={10} height={10} fill="#FF8042" viewBox="0 0 10 10">
                                  <circle cx="5" cy="5" r="4" strokeWidth="1" stroke="#fff" />
                                </svg>
                              )
                            }
                            return <circle cx={cx} cy={cy} r={4} fill="#FF8042" />
                          }}
                          strokeDasharray={(props) => (props.payload && props.payload.projected ? "5 5" : "0")}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-end mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center mr-4">
                      <div className="w-3 h-0.5 bg-gray-400 mr-1"></div>
                      <span>Histórico</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-0.5 bg-gray-400 mr-1 border-dashed border-t border-gray-400"></div>
                      <span>Projeção</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Projeção de Crescimento</CardTitle>
                  <CardDescription className="text-xs">Tendência de crescimento para os próximos meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={combinedData.map((item) => ({
                          month: item.month,
                          receita: item.grossRevenue,
                          lucro: item.netProfit,
                          projected: item.projected,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${formatCurrency(value)}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                          dataKey="receita"
                          name="Receita"
                          fill="#0088FE"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={(entry) => (entry.projected ? 0.6 : 1)}
                        />
                        <Bar
                          dataKey="lucro"
                          name="Lucro"
                          fill="#FF8042"
                          radius={[4, 4, 0, 0]}
                          fillOpacity={(entry) => (entry.projected ? 0.6 : 1)}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}