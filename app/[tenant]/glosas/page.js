"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CalendarIcon,
  Building2,
  DollarSign,
  FileText,
  PieChartIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert
} from "lucide-react"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import Sidebar from "@/components/Sidebar"

// Componente de gráficos
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"

// Componente Calendar inline
const Calendar = ({ mode, selected, onSelect, disabled, initialFocus }) => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const [currentDate, setCurrentDate] = useState(selected || new Date());
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  const handleDateClick = (date) => {
    if (disabled && disabled(date)) return;
    setCurrentDate(date);
    if (onSelect) onSelect(date);
  };
  
  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = selected && 
        date.getDate() === selected.getDate() && 
        date.getMonth() === selected.getMonth() && 
        date.getFullYear() === selected.getFullYear();
      
      const isDisabled = disabled && disabled(date);
      
      calendarDays.push(
        <div 
          key={`day-${day}`} 
          className={`h-9 w-9 rounded-md flex items-center justify-center cursor-pointer ${
            isSelected ? 'bg-primary text-primary-foreground' : 
            isDisabled ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 
            'hover:bg-accent hover:text-accent-foreground'
          }`}
          onClick={() => !isDisabled && handleDateClick(date)}
        >
          {day}
        </div>
      );
    }
    
    return calendarDays;
  };
  
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={handlePrevMonth}
          className="p-1 rounded-md hover:bg-accent"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
        <div>
          {months[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        <button 
          onClick={handleNextMonth}
          className="p-1 rounded-md hover:bg-accent"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map(day => (
          <div key={day} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-muted-foreground">
            {day.substring(0, 1)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
    </div>
  );
};

// Componente principal de Gestão de Glosas
function GlosaManagement() {
  // Implementar useState para armazenar dados das glosas
  const [glosas, setGlosas] = useState([])
  const [convenios, setConvenios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const { tenant } = useParams()
  
  // Dados para o gráfico de rosca
  const [chartData, setChartData] = useState([
    { name: "Recuperado", value: 0, icon: CheckCircle2 },
    { name: "Não Recuperado", value: 0, icon: AlertCircle },
    { name: "Pendente", value: 0, icon: Clock },
  ])
  
  const [activeIndex, setActiveIndex] = useState(0)
  
  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }
  
  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }
  
  // Função para calcular estatísticas
  const calculateStatistics = (data) => {
    // Garantir que todos os valores sejam tratados como números
    const processedData = data.map(g => ({
      ...g,
      valor: typeof g.valor === 'number' ? g.valor : 0,
      valorRecuperado: typeof g.valorRecuperado === 'number' ? g.valorRecuperado : 
                       parseFloat(g.valorRecuperado) || 0
    }))
    
    const totalRecuperado = processedData
      .filter(g => g.status === "recuperado")
      .reduce((acc, g) => acc + (g.valorRecuperado || 0), 0)
      
    const totalNaoRecuperado = processedData
      .filter(g => g.status === "naoRecuperado")
      .reduce((acc, g) => acc + (g.valorRecuperado || 0), 0)
      
    const totalPendente = processedData
      .filter(g => g.status === "pendente")
      .reduce((acc, g) => acc + (g.valorRecuperado || 0), 0)
    
    const newChartData = [
      { name: "Recuperado", value: totalRecuperado, icon: CheckCircle2 },
      { name: "Não Recuperado", value: totalNaoRecuperado, icon: AlertCircle },
      { name: "Pendente", value: totalPendente, icon: Clock },
    ]
    
    setChartData(newChartData)
  }
  
  // Buscar dados do MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [glosaResponse, convenioResponse] = await Promise.all([
          fetch(`/api/${tenant}/glosas`),
          fetch(`/api/${tenant}/convenios`)
        ])
        
        if (!glosaResponse.ok || !convenioResponse.ok) {
          throw new Error('Falha ao buscar dados')
        }
        
        const [glosaData, convenioData] = await Promise.all([
          glosaResponse.json(),
          convenioResponse.json()
        ])
        
        // Garantir que os valores sejam números
        const processedGlosas = glosaData.map(g => ({
          ...g,
          valorRecuperado: typeof g.valorRecuperado === 'number' ? g.valorRecuperado :
                          parseFloat(g.valorRecuperado) || 0
        }))
        
        setGlosas(processedGlosas)
        setConvenios(convenioData)
        calculateStatistics(processedGlosas)
        setError("")
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError("Falha ao carregar dados de glosas. Por favor, tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [tenant])
  
  // Implementar formulário com react-hook-form
  const form = useForm({
    defaultValues: {
      convenio: "",
      valorRecuperado: "",
      status: "parcial",
      dataRecalculo: new Date(),
      observacoes: "",
    },
  })
  
  // Manipulação de submissão do formulário
  const onSubmit = async (values) => {
  try {
    // Garantir que valorRecuperado seja um número
    const submissionData = {
      ...values,
      valorRecuperado: parseFloat(values.valorRecuperado) || 0
    }
    
    const response = await fetch(`/api/${tenant}/glosas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    })
    
    if (!response.ok) {
      throw new Error('Falha ao registrar glosa')
    }
    
    // A resposta foi bem-sucedida, agora busque a lista atualizada de glosas
    const glosaResponse = await fetch(`/api/${tenant}/glosas`)
    
    if (!glosaResponse.ok) {
      throw new Error('Falha ao buscar dados atualizados')
    }
    
    // Obter a lista atualizada de glosas
    const glosaData = await glosaResponse.json()
    
    // Garantir que todos os valores são números
    const processedGlosas = glosaData.map(g => ({
      ...g,
      valorRecuperado: typeof g.valorRecuperado === 'number' ? g.valorRecuperado :
                        parseFloat(g.valorRecuperado) || 0
    }))
    
    setGlosas(processedGlosas)
    calculateStatistics(processedGlosas)
    
    // Resetar formulário
    form.reset()
    
    toast({
      title: "Glosa registrada com sucesso",
      description: "Os dados foram salvos no sistema.",
    })
  } catch (error) {
    console.error("Erro ao registrar glosa:", error)
    toast({
      title: "Erro ao registrar glosa",
      description: "Ocorreu um erro ao salvar os dados. Tente novamente.",
      variant: "destructive"
    })
  }
}
  
  // Funções para o gráfico interativo
  const onPieEnter = (_, index) => {
    setActiveIndex(index)
  }
  
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 5}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }
  
  // Cálculos para métricas - Garantindo que são números
  const totalValue = chartData.reduce((acc, item) => acc + (parseFloat(item.value) || 0), 0)
  const recoveredValue = parseFloat(chartData[0].value) || 0
  const recoveredPercentage = totalValue > 0 ? ((recoveredValue / totalValue) * 100).toFixed(1) : "0.0"
  const pendingValue = parseFloat(chartData[2].value) || 0
  const conveniosCount = convenios.length
  
  // Cores para o gráfico
  const COLORS = ["#0052CC", "#2684FF", "#4C9AFF"]
  
  // Formatar valor para tooltip
  const formatTooltipValue = (value) => {
    value = typeof value === 'number' ? value : parseFloat(value) || 0
    return `${formatCurrency(value)} (${formatNumber(value)})`
  }
  
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
  
  // Interface da página
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestão de Glosas</h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Período: {format(new Date(), "MMMM yyyy", { locale: ptBR })}</span>
            </p>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card className="bg-white">
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-50 p-3 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total em Glosas</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalValue)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="flex items-center p-6">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Recuperação</p>
                <h3 className="text-2xl font-bold text-slate-800">{recoveredPercentage}%</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-50 p-3 rounded-full mr-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Glosas Pendentes</p>
                <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(pendingValue)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="flex items-center p-6">
              <div className="bg-orange-50 p-3 rounded-full mr-4">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Convênios Ativos</p>
                <h3 className="text-2xl font-bold text-slate-800">{conveniosCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Rosca */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-blue-600" />
                <CardTitle>Distribuição das Glosas</CardTitle>
              </div>
              <CardDescription>Visualização por status de recuperação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={chartData}
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatTooltipValue(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Legend formatter={(value, entry) => <span className="text-sm text-slate-700">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Formulário */}
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle>Registro de Glosa</CardTitle>
              </div>
              <CardDescription>Preencha os dados para registrar uma nova glosa</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="convenio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Convênio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50">
                              <SelectValue placeholder="Selecione o convênio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {convenios.map((convenio) => (
                              <SelectItem key={convenio._id} value={convenio._id}>
                                {convenio.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valorRecuperado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Recuperado</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="pl-10 bg-slate-50" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Status de Recuperação</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="total" id="total" />
                              <Label htmlFor="total">Total</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="parcial" id="parcial" />
                              <Label htmlFor="parcial">Parcial</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataRecalculo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Recálculo</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-slate-50",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Digite observações adicionais aqui..."
                            className="resize-none bg-slate-50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Registrar Glosa
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Role protection wrapper
function RoleProtectedGlosaManagement() {
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

        // Redirect if not owner
        if (data.role !== "owner") {
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

  // If role is not owner, show unauthorized message (fallback in case redirect fails)
  if (userRole !== "owner") {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              Você não tem permissão para acessar esta página. Esta seção é restrita para usuários com permissão de proprietário.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  // If role is owner, render the dashboard
  return <GlosaManagement />
}

// Export the protected dashboard as default
export default RoleProtectedGlosaManagement