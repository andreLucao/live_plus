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
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [availablePeriods, setAvailablePeriods] = useState([])
  const { tenant } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch income and bills data first to extract periods
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          // If API returns error, create default periods
          createDefaultTimeFrames()
          return
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // Extract time frames from actual data
        createTimeFramesFromData(incomesData, expensesData)
        
        // Process all data by default
        processApiData(incomesData, expensesData, 'all')
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
        createDefaultTimeFrames()
      } finally {
        setIsLoading(false)
      }
    }

    // Function to create time frame options from data
    const createTimeFramesFromData = (incomes, expenses) => {
      const allDates = [
        ...incomes.map(income => new Date(income.date)),
        ...expenses.map(expense => new Date(expense.date))
      ]

      if (allDates.length === 0) {
        createDefaultTimeFrames()
        return
      }

      // Sort dates to find min and max
      allDates.sort((a, b) => a - b)
      const oldestDate = allDates[0]
      const newestDate = allDates[allDates.length - 1]
      
      // Create time frame options
      const timeFrames = [
        {
          label: 'Todo o período',
          value: 'all',
          startDate: oldestDate,
          endDate: new Date() // Use current date as end date
        }
      ]
      
      // Current month
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' })
      
      timeFrames.push({
        label: `${currentMonthName} ${now.getFullYear()}`,
        value: 'current-month',
        startDate: currentMonthStart,
        endDate: currentMonthEnd
      })
      
      // Last 3 months
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(now.getMonth() - 3)
      
      timeFrames.push({
        label: 'Últimos 3 meses',
        value: 'last-3-months',
        startDate: threeMonthsAgo,
        endDate: now
      })
      
      // Last 6 months
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      
      timeFrames.push({
        label: 'Últimos 6 meses',
        value: 'last-6-months',
        startDate: sixMonthsAgo,
        endDate: now
      })
      
      // Current year
      const currentYearStart = new Date(now.getFullYear(), 0, 1)
      const currentYearEnd = new Date(now.getFullYear(), 11, 31)
      
      timeFrames.push({
        label: `Ano ${now.getFullYear()}`,
        value: 'current-year',
        startDate: currentYearStart,
        endDate: currentYearEnd
      })
      
      // Previous year if we have data from it
      const previousYearStart = new Date(now.getFullYear() - 1, 0, 1)
      const previousYearEnd = new Date(now.getFullYear() - 1, 11, 31)
      
      // Check if we have data from previous year
      if (oldestDate < previousYearStart) {
        timeFrames.push({
          label: `Ano ${now.getFullYear() - 1}`,
          value: 'previous-year',
          startDate: previousYearStart,
          endDate: previousYearEnd
        })
      }
      
      setAvailablePeriods(timeFrames)
    }

    // Function to create default time frames when no data is available
    const createDefaultTimeFrames = () => {
      const now = new Date()
      
      const timeFrames = [
        {
          label: 'Todo o período',
          value: 'all',
          startDate: new Date(now.getFullYear() - 1, now.getMonth(), 1),
          endDate: now
        },
        {
          label: `${now.toLocaleString('pt-BR', { month: 'long' })} ${now.getFullYear()}`,
          value: 'current-month',
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        {
          label: 'Últimos 3 meses',
          value: 'last-3-months',
          startDate: new Date(now.setMonth(now.getMonth() - 3)),
          endDate: new Date()
        },
        {
          label: 'Últimos 6 meses',
          value: 'last-6-months',
          startDate: new Date(now.setMonth(now.getMonth() - 3)), // -6 total from original date
          endDate: new Date()
        },
        {
          label: `Ano ${now.getFullYear()}`,
          value: 'current-year',
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31)
        }
      ]
      
      setAvailablePeriods(timeFrames)
      processEmptyData()
    }

    fetchData()
  }, [tenant])

  useEffect(() => {
    // Skip if we're already loading or if this is the initial load
    if (isLoading || availablePeriods.length === 0) {
      return
    }
    
    const fetchPeriodData = async () => {
      setIsLoading(true)
      try {
        // Always fetch all data and filter in the frontend
        const [incomesResponse, expensesResponse] = await Promise.all([
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/bills`)
        ])

        if (!incomesResponse.ok || !expensesResponse.ok) {
          processEmptyData()
          return
        }

        const [incomesData, expensesData] = await Promise.all([
          incomesResponse.json(),
          expensesResponse.json()
        ])

        // If "all" is selected, use all data
        if (selectedPeriod === 'all') {
          if (incomesData.length === 0 && expensesData.length === 0) {
            processEmptyData()
          } else {
            processApiData(incomesData, expensesData, 'all')
          }
          setIsLoading(false)
          return
        }
        
        // Find the selected time frame
        const timeFrame = availablePeriods.find(p => p.value === selectedPeriod)
        
        if (!timeFrame) {
          console.error('Período selecionado não encontrado:', selectedPeriod)
          processEmptyData()
          setIsLoading(false)
          return
        }
        
        // Filter data based on the selected time frame
        const startDate = new Date(timeFrame.startDate)
        const endDate = new Date(timeFrame.endDate)
        
        // Set time to beginning and end of day for accurate comparison
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        
        const filteredIncomesData = incomesData.filter(income => {
          const incomeDate = new Date(income.date)
          return incomeDate >= startDate && incomeDate <= endDate
        })
        
        const filteredExpensesData = expensesData.filter(expense => {
          const expenseDate = new Date(expense.date)
          return expenseDate >= startDate && expenseDate <= endDate
        })
        
        if (filteredIncomesData.length === 0 && filteredExpensesData.length === 0) {
          processEmptyData()
        } else {
          processApiData(filteredIncomesData, filteredExpensesData, selectedPeriod)
        }
      } catch (error) {
        console.error('Erro ao buscar dados para o período:', error)
        processEmptyData()
      } finally {
        setIsLoading(false)
      }
    }

    fetchPeriodData()
  }, [tenant, selectedPeriod, availablePeriods])

  // Função para gerar dados vazios quando não há dados para o período
  const processEmptyData = () => {
    // Obter o período selecionado para exibição
    let periodoLabel = 'Todo o período'
    
    if (selectedPeriod !== 'all') {
      const selectedPeriodObj = availablePeriods.find(p => p.value === selectedPeriod)
      periodoLabel = selectedPeriodObj ? selectedPeriodObj.label : 'Período selecionado'
    }
    
    console.log('Gerando dados vazios para o período:', periodoLabel);
    
    // Estruturar dados detalhados zerados
    const emptyDetailedData = {
      current: {
        revenue: {
          procedures: 0,
          appointments: 0,
          otherRevenue: 0,
        },
        deductions: {
          taxes: 0,
          cancellations: 0,
        },
        costs: {
          products: 0, // Materiais Médicos
          services: 0, // Material de Limpeza
          operational: 0, // Outros (Equipamentos, Manutenção)
        },
        expenses: {
          administrative: 0, // Salários
          sales: 0, // Outros (Marketing, Software, Escritório, etc.)
          financial: 0, // Água/Luz/Internet
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
  const processApiData = (incomesData, expensesData, period = 'all') => {
    console.log('Processando dados financeiros para o período:', period);
    console.log('Total de receitas recebidas:', incomesData.length);
    
    // Definir palavras-chave para cada categoria
    const procedureKeywords = [
      'cirurgia', 
      'exame', 
      'procedimento', 
      'tratamento',
      'especializado',
      'laboratorial',
      'imagem',
      'diagnóstico',
      'terapia',
      'intervenção'
    ];
    
    const appointmentKeywords = [
      'consulta', 
      'atendimento', 
      'emergência', 
      'ambulatorial',
      'visita',
      'avaliação',
      'retorno',
      'acompanhamento',
      'telemedicina'
    ];
    
    // Função para calcular a pontuação de correspondência para uma categoria
    const calculateMatchScore = (income, keywords) => {
      let score = 0;
      
      // Verificar correspondências no tipo (peso maior)
      keywords.forEach(keyword => {
        if (income.type?.toLowerCase().includes(keyword.toLowerCase())) {
          score += 3;
        }
      });
      
      // Verificar correspondências na categoria
      keywords.forEach(keyword => {
        if (income.category?.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
      
      // Verificar correspondências na descrição
      keywords.forEach(keyword => {
        if (income.description?.toLowerCase()?.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      
      return score;
    };
    
    // Categorizar cada item de receita com base na pontuação
    const categorizedIncomes = incomesData.map(income => {
      // Compatibilidade com categorias antigas
      if (income.type === 'vendas') {
        return { ...income, category_type: 'procedimento' };
      }
      
      if (income.type === 'servicos') {
        return { ...income, category_type: 'consulta' };
      }
      
      // Calcular pontuações para cada categoria
      const procedureScore = calculateMatchScore(income, procedureKeywords);
      const appointmentScore = calculateMatchScore(income, appointmentKeywords);
      
      // Determinar a categoria com base na pontuação mais alta
      if (procedureScore > appointmentScore) {
        return { ...income, category_type: 'procedimento' };
      } else if (appointmentScore > procedureScore) {
        return { ...income, category_type: 'consulta' };
      } else if (procedureScore > 0) {
        // Se as pontuações forem iguais mas maiores que zero, considerar como procedimento
        return { ...income, category_type: 'procedimento' };
      } else {
        // Se não houver correspondência, considerar como outra receita
        return { ...income, category_type: 'outro' };
      }
    });
    
    // Separar por categoria e calcular totais
    const procedimentosItems = categorizedIncomes.filter(income => income.category_type === 'procedimento');
    const procedimentos = procedimentosItems.reduce((sum, income) => sum + income.amount, 0);
    console.log('Receitas de Procedimentos:', procedimentosItems.length, 'itens, total:', procedimentos);
    
    const consultasItems = categorizedIncomes.filter(income => income.category_type === 'consulta');
    const consultas = consultasItems.reduce((sum, income) => sum + income.amount, 0);
    console.log('Receitas de Consultas:', consultasItems.length, 'itens, total:', consultas);
    
    const outrasReceitasItems = categorizedIncomes.filter(income => income.category_type === 'outro');
    const outrasReceitas = outrasReceitasItems.reduce((sum, income) => sum + income.amount, 0);
    console.log('Outras Receitas:', outrasReceitasItems.length, 'itens, total:', outrasReceitas);
    
    // Calcular receita bruta
    const receitaBruta = procedimentos + consultas + outrasReceitas
    
    // Função auxiliar para verificar se uma despesa é de imposto
    const isTaxExpense = (expense) => {
      if (!expense) return false;
      
      const taxTerms = [
        'imposto', 'impostos', 
        'tax', 'taxes', 
        'tributo', 'tributos',
        'fiscal', 'fiscais',
        'irpf', 'irpj', 'inss', 'iss', 'icms', 'pis', 'cofins',
        'contribuição'
      ];
      
      // Verificar na categoria
      if (expense.category) {
        const categoryLower = expense.category.toLowerCase();
        if (taxTerms.some(term => categoryLower.includes(term))) {
          return true;
        }
      }
      
      // Verificar no nome
      if (expense.name) {
        const nameLower = expense.name.toLowerCase();
        if (taxTerms.some(term => nameLower.includes(term))) {
          return true;
        }
      }
      
      // Verificar na descrição
      if (expense.description) {
        const descriptionLower = expense.description.toLowerCase();
        if (taxTerms.some(term => descriptionLower.includes(term))) {
          return true;
        }
      }
      
      // Verificar no nome do fornecedor
      if (expense.supplierName) {
        const supplierLower = expense.supplierName.toLowerCase();
        if (taxTerms.some(term => supplierLower.includes(term))) {
          return true;
        }
      }
      
      return false;
    };
    
    // Calcular impostos a partir das despesas com categoria de impostos
    const taxExpenses = expensesData.filter(expense => isTaxExpense(expense));
    const impostos = taxExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    console.log('Despesas de impostos encontradas:', taxExpenses.length);
    if (taxExpenses.length > 0) {
      console.log('Exemplos de despesas de impostos:', taxExpenses.slice(0, 3));
      console.log('Categorias de impostos encontradas:', [...new Set(taxExpenses.map(expense => expense.category))]);
    }
    console.log('Total de impostos calculado:', impostos);
    
    // Calcular cancelamentos a partir dos dados de receita
    const cancelamentos = incomesData
      .filter(income => income.deduction_type === 'cancelamentos')
      .reduce((sum, income) => sum + income.deduction_amount, 0)
    
    // Calcular receita líquida
    const receitaLiquida = receitaBruta - Math.abs(impostos) - Math.abs(cancelamentos)
    
    // Separar custos por categoria - excluindo impostos para não contar duas vezes
    const custosMateriais = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'materiais' || 
         expense.category?.toLowerCase() === 'materiais médicos' ||
         expense.category?.toLowerCase().includes('material médico')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const custosLimpeza = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'limpeza' || 
         expense.category?.toLowerCase().includes('material de limpeza')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const custosOutros = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'equipamentos' || 
         expense.category?.toLowerCase() === 'manutencao' ||
         expense.category?.toLowerCase() === 'manutenção' ||
         expense.category?.toLowerCase().includes('equipamento') ||
         expense.category?.toLowerCase().includes('manutençã')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Identificar despesas que não se encaixam em nenhuma categoria específica de custos
    const custosCategorias = ['materiais', 'materiais médicos', 'material médico', 'limpeza', 'material de limpeza', 
                             'equipamentos', 'manutencao', 'manutenção', 'equipamento', 'manutençã'];
    
    const custosNaoCategorizados = expensesData
      .filter(expense => 
        !isTaxExpense(expense) && 
        !custosCategorias.some(cat => 
          expense.category?.toLowerCase() === cat || 
          expense.category?.toLowerCase().includes(cat)
        ) &&
        !['salarios', 'salários', 'salário', 'utilities', 'água', 'luz', 'internet', 'água/luz/internet',
          'marketing', 'software', 'software/sistema', 'escritorio', 'material de escritório', 'outros', 'outro'].some(cat => 
          expense.category?.toLowerCase() === cat || 
          expense.category?.toLowerCase().includes(cat)
        )
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Total de custos
    const custosTotais = custosMateriais + custosLimpeza + custosOutros + custosNaoCategorizados;
    
    console.log('Custos - Materiais Médicos:', custosMateriais);
    console.log('Custos - Material de Limpeza:', custosLimpeza);
    console.log('Custos - Outros (Equipamentos, Manutenção):', custosOutros);
    console.log('Custos - Não Categorizados:', custosNaoCategorizados);
    console.log('Total de Custos:', custosTotais);
    
    // Calcular lucro bruto
    const lucroBruto = receitaLiquida - custosTotais;
    
    // Separar despesas por categoria
    const despesasSalarios = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'salarios' || 
         expense.category?.toLowerCase() === 'salários' ||
         expense.category?.toLowerCase().includes('salário')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const despesasUtilities = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'utilities' || 
         expense.category?.toLowerCase().includes('água') ||
         expense.category?.toLowerCase().includes('luz') ||
         expense.category?.toLowerCase().includes('internet') ||
         expense.category?.toLowerCase().includes('água/luz/internet')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const despesasOutras = expensesData
      .filter(expense => 
        (expense.category?.toLowerCase() === 'marketing' || 
         expense.category?.toLowerCase() === 'software' ||
         expense.category?.toLowerCase().includes('software/sistema') ||
         expense.category?.toLowerCase() === 'escritorio' ||
         expense.category?.toLowerCase().includes('material de escritório') ||
         expense.category?.toLowerCase() === 'outros' ||
         expense.category?.toLowerCase().includes('outro')) &&
        !isTaxExpense(expense)
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Total de despesas
    const despesasTotais = despesasSalarios + despesasUtilities + despesasOutras;
    
    console.log('Despesas - Salários:', despesasSalarios);
    console.log('Despesas - Água/Luz/Internet:', despesasUtilities);
    console.log('Despesas - Outras:', despesasOutras);
    console.log('Total de Despesas:', despesasTotais);
    
    // Calcular lucro líquido
    const lucroLiquido = lucroBruto - despesasTotais;
    
    // Determinar o período para exibição
    let periodoLabel = 'Todo o período'
    
    if (period !== 'all') {
      const selectedPeriodObj = availablePeriods.find(p => p.value === period)
      periodoLabel = selectedPeriodObj ? selectedPeriodObj.label : 'Período selecionado'
    }
    
    // Estruturar dados detalhados
    const detailedData = {
      current: {
        revenue: {
          procedures: procedimentos,
          appointments: consultas,
          otherRevenue: outrasReceitas,
        },
        deductions: {
          taxes: -impostos,
          cancellations: -cancelamentos,
        },
        costs: {
          products: -custosMateriais,     // Materiais Médicos
          services: -custosLimpeza,       // Material de Limpeza
          operational: -(custosOutros + custosNaoCategorizados),  // Outros (Equipamentos, Manutenção, etc.)
        },
        expenses: {
          administrative: -despesasSalarios,  // Salários
          sales: -despesasUtilities,          // Água/Luz/Internet
          financial: -despesasOutras,         // Outros (Marketing, Software, etc.)
        },
        period: periodoLabel,
      },
      hasData: true
    }
    
    // Adicionar informações de debug sobre impostos
    console.log('Dados detalhados - impostos:', detailedData.current.deductions.taxes);
    console.log('Receita bruta:', receitaBruta);
    console.log('Receita líquida após deduções:', receitaLiquida);
    
    setDetailedData(detailedData)
    
    // Preparar dados simplificados para exibição na lista
    setMetrics([
      { category: "Receita Bruta", value: receitaBruta },
      { category: "(-) Deduções", value: -(impostos + cancelamentos) },
      { category: "Receita Líquida", value: receitaLiquida },
      { category: "(-) Custos Totais", value: -(custosMateriais + custosLimpeza + custosOutros + custosNaoCategorizados) },
      { category: "Lucro Bruto", value: lucroBruto },
      { category: "(-) Despesas Totais", value: -(despesasSalarios + despesasUtilities + despesasOutras) },
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
  const grossRevenue = dreData.revenue.procedures + dreData.revenue.appointments + dreData.revenue.otherRevenue
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
                      Total de receitas antes das deduções, incluindo procedimentos, consultas e outras receitas.
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
                <TableCell className="pl-8">Procedimentos</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.revenue.procedures)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.revenue.procedures / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Consultas</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.revenue.appointments)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.revenue.appointments / grossRevenue) * 100).toFixed(1) + '%'}
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
                <TableCell className="pl-8">Materiais Médicos</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.products)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.costs.products / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Material de Limpeza</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(dreData.costs.services)}</TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.costs.services / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Outros</TableCell>
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
                <TableCell className="pl-8">Salários</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.expenses.administrative)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.expenses.administrative / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Água/Luz/Internet</TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(dreData.expenses.sales)}
                </TableCell>
                <TableCell className="text-right">
                  {grossRevenue === 0 ? '0.0%' : ((dreData.expenses.sales / grossRevenue) * 100).toFixed(1) + '%'}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-8">Outros</TableCell>
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