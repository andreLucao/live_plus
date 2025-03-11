"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line
} from "recharts"
import { Download, BarChart3, PieChartIcon } from "lucide-react"

export function CustomerMetrics() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [doctorRevenueData, setDoctorRevenueData] = useState([])
  const [doctorAppointmentsData, setDoctorAppointmentsData] = useState([])
  const [chartType, setChartType] = useState("bar")
  const [selectedDoctorData, setSelectedDoctorData] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [clientMetricsData, setClientMetricsData] = useState([])
  const { tenant } = useParams()

  // Definir esquemas de cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]
  const APPOINTMENT_COLORS = ["#4f46e5", "#10b981"]
  const CLIENT_METRICS_COLORS = ["#4f46e5", "#10b981", "#f59e0b"]

  // Dados para o gráfico de despesas (exemplo fixo)
  const expenseData = [
    { name: 'Folha de Pagamento', value: 35.2 },
    { name: 'Marketing', value: 25.5 },
    { name: 'Infraestrutura', value: 20.3 },
    { name: 'Outros', value: 20.1 }
  ]

  // Funções de formatação
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca dados de clientes, transações, médicos, atendimentos e usuários
        console.log('Fetching data for tenant:', tenant);
        
        const [clientsResponse, incomesResponse, doctorsResponse, appointmentsResponse, usersResponse] = await Promise.all([
          fetch(`/api/${tenant}/patients`),
          fetch(`/api/${tenant}/income`),
          fetch(`/api/${tenant}/users?role=doctor`),
          fetch(`/api/${tenant}/appointments`),
          fetch(`/api/${tenant}/users?role=user`)
        ]);

        if (!clientsResponse.ok || !incomesResponse.ok || !doctorsResponse.ok || !appointmentsResponse.ok || !usersResponse.ok) {
          console.error('API response not OK:', {
            clients: clientsResponse.status,
            incomes: incomesResponse.status,
            doctors: doctorsResponse.status,
            appointments: appointmentsResponse.status,
            users: usersResponse.status
          });
          throw new Error('Failed to fetch data');
        }

        const [clientsData, incomesData, doctorsData, appointmentsData, usersData] = await Promise.all([
          clientsResponse.json(),
          incomesResponse.json(),
          doctorsResponse.json(),
          appointmentsResponse.json(),
          usersResponse.json()
        ]);

        console.log('API Data received:', {
          clients: clientsData.length,
          incomes: incomesData.length,
          doctors: doctorsData.length,
          appointments: appointmentsData.length,
          users: usersData.length
        });
        
        // Log sample data to verify structure
        if (incomesData.length > 0) console.log('Sample income:', incomesData[0]);
        if (doctorsData.length > 0) console.log('Sample doctor:', doctorsData[0]);
        if (appointmentsData.length > 0) console.log('Sample appointment:', appointmentsData[0]);
        
        const today = new Date()
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1)

        // Calcula clientes ativos (que tiveram transação nos últimos 2 meses)
        const activeClients = new Set(
          incomesData
            .filter(income => new Date(income.date) >= twoMonthsAgo)
            .map(income => income.clientId)
        ).size

        // Calcula clientes ativos do mês passado para comparação
        const lastMonthActiveClients = new Set(
          incomesData
            .filter(income => {
              const date = new Date(income.date)
              return date >= twoMonthsAgo && date < lastMonth
            })
            .map(income => income.clientId)
        ).size

        // Calcula ticket médio
        const currentMonthTransactions = incomesData.filter(
          income => new Date(income.date) >= lastMonth
        )
        
        const ticketMedio = currentMonthTransactions.length > 0
          ? currentMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / currentMonthTransactions.length
          : 0

        const lastMonthTransactions = incomesData.filter(
          income => {
            const date = new Date(income.date)
            return date >= twoMonthsAgo && date < lastMonth
          }
        )

        const lastMonthTicketMedio = lastMonthTransactions.length > 0
          ? lastMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / lastMonthTransactions.length
          : 0

        // Calcula taxa de retenção
        const currentMonthClients = new Set(currentMonthTransactions.map(t => t.clientId))
        const lastMonthClients = new Set(lastMonthTransactions.map(t => t.clientId))
        const retainedClients = [...currentMonthClients].filter(id => lastMonthClients.has(id)).length
        const retentionRate = lastMonthClients.size > 0
          ? (retainedClients / lastMonthClients.size) * 100
          : 0

        const lastRetentionRate = 0 // Você precisará implementar a lógica para o período anterior

        // Calcula NPS (se disponível nos dados do cliente)
        const npsScores = clientsData
          .filter(client => client.nps && new Date(client.npsDate) >= lastMonth)
          .map(client => client.nps)
        
        const nps = npsScores.length > 0
          ? Math.round(npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length)
          : 0

        const lastNps = 0 // Você precisará implementar a lógica para o período anterior

        setMetrics([
          {
            label: "Clientes Ativos",
            value: activeClients,
            change: `${calculateChange(activeClients, lastMonthActiveClients)}%`
          },
          {
            label: "Ticket Médio",
            value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: `${calculateChange(ticketMedio, lastMonthTicketMedio)}%`
          },
          {
            label: "Taxa de Retenção",
            value: `${retentionRate.toFixed(1)}%`,
            change: `${calculateChange(retentionRate, lastRetentionRate)}%`
          },
          {
            label: "NPS",
            value: nps,
            change: `${calculateChange(nps, lastNps)}%`
          }
        ])

        // Processar dados para métricas por médico
        // Filtrar apenas os usuários com role="doctor"
        const doctors = doctorsData.filter(user => user.role === "doctor")
        console.log('Filtered doctors:', doctors.length)

        // Calcular receita por médico
        const doctorRevenues = doctors.map(doctor => {
          // Identificar o ID do médico (no formato ObjectId como string)
          const doctorId = doctor._id.$oid || doctor._id.toString() || doctor._id
          
          // Filtrar transações associadas a este médico usando userId no income
          const doctorIncomes = incomesData.filter(income => {
            const incomeUserId = income.userId?.$oid || income.userId?.toString() || income.userId
            return incomeUserId === doctorId
          })
          
          console.log(`Doctor ${doctor.name || doctor.email} has ${doctorIncomes.length} incomes`)
          
          // Calcular receita total
          const totalRevenue = doctorIncomes.reduce((sum, income) => sum + income.amount, 0)
          
          // Contar pacientes únicos
          const uniquePatients = new Set(doctorIncomes.map(income => income.clientId)).size
          
          return {
            id: doctorId,
            name: doctor.name || `Dr. ${doctor.email?.split('@')[0]}`,
            revenue: totalRevenue,
            patients: uniquePatients
          }
        }).sort((a, b) => b.revenue - a.revenue) // Ordenar por receita, do maior para o menor

        console.log('Doctor revenues calculated:', doctorRevenues)
        setDoctorRevenueData(doctorRevenues)

        // Processar dados de atendimentos por médico
        const doctorAppointments = doctors.map(doctor => {
          const doctorId = doctor._id.$oid || doctor._id.toString() || doctor._id
          
          // Filtrar atendimentos deste médico
          const doctorAppts = appointmentsData.filter(appt => {
            const apptDoctorId = appt.professional?.$oid || appt.professional?.toString() || appt.professional
            return apptDoctorId === doctorId
          })
          
          console.log(`Doctor ${doctor.name || doctor.email} has ${doctorAppts.length} appointments`)
          
          // Contar consultas e procedimentos
          const consultations = doctorAppts.filter(appt => appt.type === 'consultation').length
          const procedures = doctorAppts.filter(appt => appt.type === 'procedure').length
          
          return {
            id: doctorId,
            name: doctor.name || `Dr. ${doctor.email?.split('@')[0]}`,
            consultations,
            procedures,
            total: consultations + procedures
          }
        }).sort((a, b) => b.total - a.total) // Ordenar por total de atendimentos, do maior para o menor

        console.log('Doctor appointments calculated:', doctorAppointments)
        setDoctorAppointmentsData(doctorAppointments)

        // Calcular métricas de clientes para o novo gráfico
        // Novos clientes (usuários com role="user" criados no mês atual)
        const newClients = usersData.filter(user => 
          user.role === "user" && new Date(user.createdAt) >= currentMonth
        ).length

        // Clientes recorrentes (usuários com role="user" criados antes do mês atual)
        const recurringClients = usersData.filter(user => 
          user.role === "user" && new Date(user.createdAt) < currentMonth
        ).length

        console.log('Client metrics calculated:', {
          newClients,
          recurringClients,
          retentionRate: Math.round(retentionRate)
        })

        // Dados para o gráfico de métricas de clientes
        const clientMetricsDataArray = [
          {
            name: "Novos Clientes",
            value: newClients,
            color: CLIENT_METRICS_COLORS[0]
          },
          {
            name: "Clientes Recorrentes",
            value: recurringClients,
            color: CLIENT_METRICS_COLORS[1]
          },
          {
            name: "Taxa de Retenção",
            value: Math.round(retentionRate),
            color: CLIENT_METRICS_COLORS[2]
          }
        ]

        console.log('Setting client metrics data:', clientMetricsDataArray)
        setClientMetricsData(clientMetricsDataArray)

      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [tenant])

  const calculateChange = (current, previous) => {
    if (!previous) return "+0"
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
  }

  // Função para abrir modal com detalhes do médico
  const handleDoctorClick = (doctor) => {
    setSelectedDoctorData(doctor)
    setShowModal(true)
  }

  // Componente de loading
  if (isLoading) {
    return (
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clients">Métricas de Clientes</TabsTrigger>
          <TabsTrigger value="doctors">Métricas por Médico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-sm h-80">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="doctors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-sm h-80">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <Tabs defaultValue="clients" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="clients">Métricas de Clientes</TabsTrigger>
        <TabsTrigger value="doctors">Métricas por Médico</TabsTrigger>
      </TabsList>
      
      {/* Aba de Métricas de Clientes */}
      <TabsContent value="clients" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground">{metric.label}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className={`text-xs ${metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Novos gráficos para a aba de Métricas de Clientes */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico de Métricas de Clientes */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Métricas de Clientes</CardTitle>
              <CardDescription>Novos clientes, recorrentes e taxa de retenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={clientMetricsData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Valor">
                      {clientMetricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Detalhamento</h4>
                <div className="space-y-2">
                  {clientMetricsData.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: metric.color }}
                        ></div>
                        <span>{metric.name}</span>
                      </div>
                      <span className="font-medium">{formatNumber(metric.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Gráfico de Distribuição de Despesas */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribuição de Despesas</CardTitle>
              <CardDescription>Categorias de despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Detalhamento de Despesas</h4>
                <div className="space-y-2">
                  {expenseData.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span>{expense.name}</span>
                      </div>
                      <span className="font-medium">{expense.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* Aba de Métricas por Médico */}
      <TabsContent value="doctors" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card de Receita por Médico */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Receita por Médico</CardTitle>
                <CardDescription>Receita gerada por cada médico</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={chartType === "bar" ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setChartType("bar")}
                  className="h-8 w-8"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={chartType === "pie" ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setChartType("pie")}
                  className="h-8 w-8"
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {chartType === "bar" ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={doctorRevenueData.slice(0, 5)}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tickFormatter={(value) => `R$${value/1000}K`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${formatCurrency(value)}`, 'Receita']}
                        labelFormatter={(label) => `Médico: ${label}`}
                      />
                      <Bar dataKey="revenue" fill="#0088FE" onClick={(data) => handleDoctorClick(data)} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={doctorRevenueData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        onClick={(data) => handleDoctorClick(data.payload)}
                      >
                        {doctorRevenueData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Top 3 Médicos</h4>
                <div className="space-y-2">
                  {doctorRevenueData.slice(0, 3).map((doctor, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{doctor.name}</span>
                      <div className="flex space-x-4">
                        <span className="text-muted-foreground">{doctor.patients} pacientes</span>
                        <span className="font-medium">{formatCurrency(doctor.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Atendimentos por Médico */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Atendimentos por Médico</CardTitle>
              <CardDescription>Consultas e procedimentos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={doctorAppointmentsData.slice(0, 5)}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consultations" name="Consultas" stackId="a" fill={APPOINTMENT_COLORS[0]} />
                    <Bar dataKey="procedures" name="Procedimentos" stackId="a" fill={APPOINTMENT_COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Médicos com mais atendimentos</h4>
                  <div className="space-y-2">
                    {doctorAppointmentsData.slice(0, 3).map((doctor, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-muted-foreground">{doctor.total} atendimentos</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Tipos de Atendimento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Consultas</span>
                      <span className="text-sm font-medium">
                        {formatNumber(doctorAppointmentsData.reduce((sum, doc) => sum + doc.consultations, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Procedimentos</span>
                      <span className="text-sm font-medium">
                        {formatNumber(doctorAppointmentsData.reduce((sum, doc) => sum + doc.procedures, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* Modal para detalhes (implementação básica) */}
      {showModal && selectedDoctorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Detalhes do Médico</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Nome:</span> {selectedDoctorData.name}</p>
              <p><span className="font-medium">Receita Total:</span> {formatCurrency(selectedDoctorData.revenue)}</p>
              <p><span className="font-medium">Pacientes Atendidos:</span> {selectedDoctorData.patients}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowModal(false)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </Tabs>
  )
} 