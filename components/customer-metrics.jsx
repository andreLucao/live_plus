"use client"

import { useState, useEffect } from 'react'
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart, Bar, Cell, ResponsiveContainer, 
  Tooltip, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line
} from "recharts"
import { Download, BarChart3, CalendarIcon } from "lucide-react"
import { useFinance } from "@/app/contexts/FinanceContext"

export function CustomerMetrics() {
  const [metrics, setMetrics] = useState([])
  const [doctorRevenueData, setDoctorRevenueData] = useState([])
  const [doctorAppointmentsData, setDoctorAppointmentsData] = useState([])
  const [selectedDoctorData, setSelectedDoctorData] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [clientMetricsData, setClientMetricsData] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const { incomes, bills, appointments, doctors, patients, users, isLoading } = useFinance()

  // Definir esquemas de cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]
  const APPOINTMENT_COLORS = ["#4f46e5", "#10b981"]
  const CLIENT_METRICS_COLORS = ["#4f46e5", "#10b981", "#f59e0b"]

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
    if (!incomes || !bills || !appointments || !doctors || !patients || !users) return;

    // Create a map of doctor IDs to their emails for easy lookup
    const doctorEmailMap = doctors.reduce((map, doctor) => {
      map[doctor._id] = doctor.email
      return map
    }, {})

    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    // Calculate active clients
    const activeClients = new Set(
      incomes
        .filter(income => new Date(income.date) >= twoMonthsAgo)
        .map(income => income.patientName)
    ).size

    const lastMonthActiveClients = new Set(
      incomes
        .filter(income => {
          const date = new Date(income.date)
          return date >= twoMonthsAgo && date < lastMonth
        })
        .map(income => income.patientName)
    ).size

    // Calculate average ticket
    const currentMonthTransactions = incomes.filter(
      income => new Date(income.date) >= lastMonth
    )
    
    const ticketMedio = currentMonthTransactions.length > 0
      ? currentMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / currentMonthTransactions.length
      : 0

    const lastMonthTransactions = incomes.filter(
      income => {
        const date = new Date(income.date)
        return date >= twoMonthsAgo && date < lastMonth
      }
    )

    const lastMonthTicketMedio = lastMonthTransactions.length > 0
      ? lastMonthTransactions.reduce((sum, income) => sum + income.amount, 0) / lastMonthTransactions.length
      : 0

    // Calculate retention rate
    const currentMonthClients = new Set(currentMonthTransactions.map(t => t.patientName))
    const lastMonthClients = new Set(lastMonthTransactions.map(t => t.patientName))
    const retainedClients = [...currentMonthClients].filter(id => lastMonthClients.has(id)).length
    const retentionRate = lastMonthClients.size > 0
      ? (retainedClients / lastMonthClients.size) * 100
      : 0

    // Calculate NPS
    const npsScores = patients
      .filter(patient => patient.nps && new Date(patient.npsDate) >= lastMonth)
      .map(patient => patient.nps)
    
    const nps = npsScores.length > 0
      ? Math.round(npsScores.reduce((sum, score) => sum + score, 0) / npsScores.length)
      : 0

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
        change: `${calculateChange(retentionRate, 0)}%`
      },
      {
        label: "NPS",
        value: nps,
        change: `${calculateChange(nps, 0)}%`
      }
    ])

    // Update professional data
    updateProfessionalData(doctorEmailMap)

    // Calculate client metrics
    const newClients = users.filter(user => 
      user.role === "user" && new Date(user.createdAt) >= thirtyDaysAgo
    ).length

    const recurringClients = users.filter(user => {
      if (user.role !== "user") return false
      
      const creationDate = new Date(user.createdAt)
      const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null
      
      if (!lastLoginDate) return false
      
      const diffTime = Math.abs(lastLoginDate - creationDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays > 30
    }).length

    setClientMetricsData([
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
    ])
  }, [incomes, bills, appointments, doctors, patients, users])

  const updateProfessionalData = (doctorEmailMap) => {
    // Process doctor revenue data
    const professionalRevenues = doctors.map(doctor => {
      const doctorIncomes = incomes.filter(income => income.name === doctor._id)
      const totalRevenue = doctorIncomes.reduce((sum, income) => sum + income.amount, 0)
      const uniquePatients = new Set(doctorIncomes.map(income => income.patientName)).size
      const avgTicket = doctorIncomes.length > 0 ? totalRevenue / doctorIncomes.length : 0

      return {
        id: doctor._id,
        name: doctor.email,
        revenue: totalRevenue,
        patients: uniquePatients,
        averageTicket: avgTicket,
        transactionCount: doctorIncomes.length
      }
    }).sort((a, b) => b.revenue - a.revenue)

    setDoctorRevenueData(professionalRevenues)

    // Process doctor appointments data
    const professionalAppointments = doctors.map(doctor => {
      const doctorAppts = appointments.filter(appt => appt.professional === doctor._id)
      
      const pendingAppointments = doctorAppts.filter(appt => appt.status === 'Pending').length
      const confirmedAppointments = doctorAppts.filter(appt => appt.status === 'Confirmed').length
      const canceledAppointments = doctorAppts.filter(appt => appt.status === 'Canceled').length
      
      const consultations = doctorAppts.filter(appt => 
        appt.service?.toLowerCase().includes('consulta')
      ).length
      
      const procedures = doctorAppts.filter(appt => 
        appt.service?.toLowerCase().includes('procedimento') || 
        appt.service?.toLowerCase().includes('exame')
      ).length
      
      const otherServices = doctorAppts.length - consultations - procedures
      
      const revenueData = professionalRevenues.find(doc => doc.id === doctor._id) || {
        revenue: 0,
        patients: 0
      }
      
      return {
        id: doctor._id,
        name: doctor.email,
        consultations,
        procedures,
        otherServices,
        pendingAppointments,
        confirmedAppointments,
        canceledAppointments,
        total: doctorAppts.length,
        revenue: revenueData.revenue,
        patients: revenueData.patients
      }
    }).sort((a, b) => b.total - a.total)

    setDoctorAppointmentsData(professionalAppointments)
  }

  const calculateChange = (current, previous) => {
    if (!previous) return "+0"
    const change = ((current - previous) / previous) * 100
    return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1)
  }

  // Função para abrir modal com detalhes do médico
  const handleDoctorClick = (doctor) => {
    setSelectedDoctorData(doctor);
    setShowModal(true);
  };

  // Função para selecionar médico
  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctor(doctorId);
  };

  // Dados filtrados por médico selecionado
  const filteredDoctorRevenueData = selectedDoctor
    ? doctorRevenueData.filter(doctor => doctor.id === selectedDoctor)
    : doctorRevenueData;

  const filteredDoctorAppointmentsData = selectedDoctor
    ? doctorAppointmentsData.filter(doctor => doctor.id === selectedDoctor)
    : doctorAppointmentsData;

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
            {[...Array(1)].map((_, index) => (
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
    );
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

        {/* Gráficos para a aba de Métricas de Clientes */}
        <div className="grid gap-4 md:grid-cols-1">
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
        </div>
      </TabsContent>
      
      {/* Aba de Métricas por Médico */}
      <TabsContent value="doctors" className="space-y-4">
        <div className="flex justify-end items-center">
          <select
            value={selectedDoctor || ''}
            onChange={(e) => handleDoctorSelect(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Todos os Médicos</option>
            {doctorRevenueData.map(doctor => (
              <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Card de Receita por Médico */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Receita por Médico</CardTitle>
              <CardDescription>Receita gerada por cada médico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredDoctorRevenueData.slice(0, 5)}
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
              </div>
              
              <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Top 3 Médicos</h4>
                <div className="space-y-2">
                  {filteredDoctorRevenueData.slice(0, 3).map((doctor, index) => (
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
          
          {/* Card de Agendamentos por Médico */}
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Agendamentos por Médico</CardTitle>
              <CardDescription>Consultas e procedimentos agendados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredDoctorAppointmentsData.slice(0, 5)}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="consultations" name="Consultas" stackId="a" fill={APPOINTMENT_COLORS[0]} />
                    <Bar dataKey="procedures" name="Procedimentos" stackId="a" fill={APPOINTMENT_COLORS[1]} />
                    <Bar dataKey="otherServices" name="Outros" stackId="a" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Médicos com mais agendamentos</h4>
                  <div className="space-y-2">
                    {filteredDoctorAppointmentsData.slice(0, 3).map((doctor, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-muted-foreground">{doctor.total} agendamentos</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Status dos Agendamentos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pendentes</span>
                      <span className="text-sm font-medium">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.pendingAppointments, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Confirmados</span>
                      <span className="text-sm font-medium">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.confirmedAppointments, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cancelados</span>
                      <span className="text-sm font-medium">
                      {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.canceledAppointments, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Novo Card: Detalhamento de Agendamentos por Médico */}
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalhamento de Agendamentos por Médico</CardTitle>
              <CardDescription>Análise completa dos agendamentos por profissional</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Médico</th>
                      <th className="text-center py-2 font-medium">Total</th>
                      <th className="text-center py-2 font-medium">Consultas</th>
                      <th className="text-center py-2 font-medium">Procedimentos</th>
                      <th className="text-center py-2 font-medium">Outros</th>
                      <th className="text-center py-2 font-medium">Pendentes</th>
                      <th className="text-center py-2 font-medium">Confirmados</th>
                      <th className="text-center py-2 font-medium">Cancelados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctorAppointmentsData.map((doctor, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{doctor.name}</td>
                        <td className="text-center py-2">{formatNumber(doctor.total)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.consultations)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.procedures)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.otherServices)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.pendingAppointments)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.confirmedAppointments)}</td>
                        <td className="text-center py-2">{formatNumber(doctor.canceledAppointments)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium bg-gray-50">
                      <td className="py-2">Total</td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.total, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.consultations, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.procedures, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.otherServices, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.pendingAppointments, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.confirmedAppointments, 0))}
                      </td>
                      <td className="text-center py-2">
                        {formatNumber(filteredDoctorAppointmentsData.reduce((sum, doc) => sum + doc.canceledAppointments, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      {/* Modal para detalhes do médico */}
      {showModal && selectedDoctorData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Detalhes do Médico</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Nome:</span> {selectedDoctorData.name}</p>
              <p><span className="font-medium">Receita Total:</span> {formatCurrency(selectedDoctorData.revenue)}</p>
              <p><span className="font-medium">Pacientes Atendidos:</span> {selectedDoctorData.patients}</p>
              <p><span className="font-medium">Ticket Médio:</span> {formatCurrency(selectedDoctorData.averageTicket || 0)}</p>
              <p><span className="font-medium">Transações:</span> {selectedDoctorData.transactionCount || 0}</p>
              
              {/* Adicionar informações sobre agendamentos se disponíveis */}
              {doctorAppointmentsData.find(d => d.id === selectedDoctorData.id) && (
                <>
                  <p className="mt-4 font-medium">Agendamentos:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-gray-100 p-2 rounded">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-medium">
                        {formatNumber(doctorAppointmentsData.find(d => d.id === selectedDoctorData.id).total)}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <p className="text-sm text-gray-500">Consultas</p>
                      <p className="font-medium">
                        {formatNumber(doctorAppointmentsData.find(d => d.id === selectedDoctorData.id).consultations)}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <p className="text-sm text-gray-500">Procedimentos</p>
                      <p className="font-medium">
                        {formatNumber(doctorAppointmentsData.find(d => d.id === selectedDoctorData.id).procedures)}
                      </p>
                    </div>
                    <div className="bg-gray-100 p-2 rounded">
                      <p className="text-sm text-gray-500">Confirmados</p>
                      <p className="font-medium">
                        {formatNumber(doctorAppointmentsData.find(d => d.id === selectedDoctorData.id).confirmedAppointments)}
                      </p>
                    </div>
                  </div>
                </>
              )}
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