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
  const { tenant } = useParams()

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

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

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
    
    // Obter mês e ano atuais
    const data = new Date()
    const mesAtual = data.toLocaleString('pt-BR', { month: 'long' })
    const anoAtual = data.getFullYear()
    const periodoAtual = `${mesAtual} ${anoAtual}`
    
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
        period: periodoAtual,
      }
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

  // Cálculo de indicadores financeiros
  const financialIndicators = {
    grossMargin: (grossProfit / netRevenue) * 100,
    netMargin: (netProfit / netRevenue) * 100,
    costRatio: (Math.abs(totalCosts) / netRevenue) * 100,
    expenseRatio: (Math.abs(totalExpenses) / netRevenue) * 100,
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Demonstração do Resultado do Exercício</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {dreData.period}
          </p>
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

      {/* Indicadores Financeiros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{financialIndicators.grossMargin.toFixed(1)}%</div>
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
            </div>
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
        </CardContent>
      </Card>
    </div>
  )
}