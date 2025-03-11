"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Trash2, Edit2, Save, X, User, Calendar, Tag, AlertCircle, MessageCircle, List, Grid, Video, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Sidebar from "@/components/Sidebar"
import CalendarView from './CalendarView'

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([])
  const [newAppointment, setNewAppointment] = useState({
    status: "Pending", // Mantemos o valor interno em inglês
    date: "",
    professional: "",
    patient: "",
    service: ""
  })
  const [professionalFilter, setProfessionalFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const {tenant} = useParams();
  const [viewMode, setViewMode] = useState('list')
  const [jitsiModalOpen, setJitsiModalOpen] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState(null)
  const [isUpdatingAll, setIsUpdatingAll] = useState(false)
  const [doctors, setDoctors] = useState([])

  const services = [
    "Consulta Médica",
    "Exame Laboratorial",
    "Procedimento",
    "Fisioterapia",
    "Psicologia",
    "Nutrição",
    "Outros"
  ]

  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [])

  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/${tenant}/appointments`)
      if (!response.ok) throw new Error('Failed to fetch appointments')
      const data = await response.json()
      console.log('Agendamentos carregados:', data);
      setAppointments(data)
      setError("")
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setError("Falha ao carregar agendamentos")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`/api/${tenant}/users?role=doctor`)
      if (!response.ok) throw new Error('Failed to fetch doctors')
      const data = await response.json()
      console.log('Doctors loaded:', data)
      const doctorsList = data.filter(user => user.role === "doctor")
      setDoctors(doctorsList)
    } catch (error) {
      console.error("Error loading doctors:", error)
      setError("Failed to load doctors list")
    }
  }

  const addAppointment = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/${tenant}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })

      if (!response.ok) throw new Error('Failed to add appointment')
      
      // Obter o agendamento criado com o meetingUrl
      const createdAppointment = await response.json()
      console.log('Agendamento criado com sucesso:', createdAppointment)
      
      // Verificar se o agendamento tem meetingUrl
      if (!createdAppointment.meetingUrl) {
        console.warn('Agendamento criado sem meetingUrl:', createdAppointment);
      }
      
      await fetchAppointments()
      setNewAppointment({ status: "Pending", date: "", professional: "", patient: "", service: "" })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar agendamento:", error)
      setError("Falha ao adicionar agendamento")
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/${tenant}/appointments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      
      // Atualiza a lista de agendamentos para obter as informações atualizadas
      await fetchAppointments()
      
      // Se o status for alterado para confirmado, verificamos se o agendamento tem link de reunião
      if (newStatus === 'Confirmed') {
        const updatedAppointment = appointments.find(a => a._id === id)
        if (updatedAppointment && !updatedAppointment.meetingUrl) {
          // Se não tiver link, fazemos uma nova chamada para garantir que seja gerado
          await fetch(`/api/${tenant}/appointments`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id,
              status: newStatus
            }),
          })
          await fetchAppointments()
        }
      }
    } catch (error) {
      setError("Falha ao atualizar status")
    }
  }

  const handleDeleteClick = (appointment) => {
    setItemToDelete(appointment)
    setIsDeleteModalOpen(true)
  }

  const deleteAppointment = async (id) => {
    try {
      const response = await fetch(`/api/${tenant}/appointments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete appointment')
      await fetchAppointments()
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (error) {
      setError("Falha ao excluir agendamento")
    }
  }

  const openJitsiMeeting = (appointment) => {
    setCurrentMeeting(appointment)
    setJitsiModalOpen(true)
  }

  const launchJitsiMeeting = async () => {
    try {
      if (!currentMeeting) return;
      
      console.log('Iniciando reunião para agendamento:', currentMeeting);
      
      // Se já tiver uma URL, abre diretamente
      if (currentMeeting.meetingUrl) {
        console.log('Abrindo URL existente:', currentMeeting.meetingUrl);
        window.open(currentMeeting.meetingUrl, '_blank');
        setJitsiModalOpen(false);
        return;
      }
      
      // Se não tiver uma URL de reunião, vamos criar uma
      // Não importa o status do agendamento
      if (currentMeeting._id) {
        console.log('Agendamento sem URL, criando nova:', currentMeeting._id);
        const response = await fetch(`/api/${tenant}/appointments`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentMeeting._id,
            // Não alteramos o status, apenas garantimos que a URL seja criada
          }),
        });
        
        if (response.ok) {
          const updatedAppointment = await response.json();
          console.log('Agendamento atualizado com URL:', updatedAppointment);
          
          // Atualiza o agendamento atual com o link de reunião
          if (updatedAppointment.meetingUrl) {
            console.log('Abrindo nova URL:', updatedAppointment.meetingUrl);
            window.open(updatedAppointment.meetingUrl, '_blank');
            await fetchAppointments(); // Atualiza a lista para refletir as mudanças
            setJitsiModalOpen(false);
            return;
          } else {
            console.error('Agendamento atualizado sem URL:', updatedAppointment);
          }
        } else {
          console.error('Falha ao atualizar agendamento:', await response.text());
        }
      }
      
      // Se chegou aqui, é porque não conseguiu abrir a reunião
      console.error('Não foi possível iniciar a videochamada');
      setError("Não foi possível iniciar a videochamada. Tente novamente mais tarde.");
    } catch (error) {
      console.error("Erro ao iniciar reunião:", error);
      setError("Falha ao iniciar videochamada. Tente novamente.");
    }
    
    setJitsiModalOpen(false);
  }

  const filterAppointments = (appointments) => {
    return appointments.filter(appointment => {
      const statusMatch = currentTab === "all" || appointment.status === currentTab
      const professionalMatch = professionalFilter === "all" || 
        appointment.professional === professionalFilter
      const dateMatch = filterByDateRange(appointment.date)
      return statusMatch && professionalMatch && dateMatch
    })
  }

  const filterByDateRange = (date) => {
    if (!startDate && !endDate) return true
    const appointmentDate = new Date(date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    
    if (start && end) {
      return appointmentDate >= start && appointmentDate <= end
    } else if (start) {
      return appointmentDate >= start
    } else if (end) {
      return appointmentDate <= end
    }
    
    return true
  }

  // Helper function to get doctor name from ID
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (!doctor) return doctorId
    
    if (doctor.name) return doctor.name
    
    // Extract first name from email (before the dot or @ symbol)
    if (doctor.email) {
      const emailParts = doctor.email.split(/[@.]/)[0]
      // Capitalize first letter
      return emailParts.charAt(0).toUpperCase() + emailParts.slice(1)
    }
    
    return doctorId
  }

  const filteredAppointments = filterAppointments(appointments)

  // Função para atualizar todos os agendamentos existentes
  const updateAllAppointments = async () => {
    try {
      setIsUpdatingAll(true);
      const response = await fetch(`/api/${tenant}/appointments/update-all`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to update all appointments');
      
      const result = await response.json();
      console.log('Resultado da atualização:', result);
      
      await fetchAppointments();
      setError("");
    } catch (error) {
      console.error("Erro ao atualizar todos os agendamentos:", error);
      setError("Falha ao atualizar todos os agendamentos");
    } finally {
      setIsUpdatingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamentos</h1>
              <div className="flex gap-4">
                <div className="flex rounded-md shadow-sm" role="group">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                    style={{
                      backgroundColor: viewMode === 'list' ? '#009EE3' : 'white',
                      color: viewMode === 'list' ? 'white' : '#009EE3',
                      borderColor: '#009EE3'
                    }}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    onClick={() => setViewMode('calendar')}
                    className="rounded-l-none"
                    style={{
                      backgroundColor: viewMode === 'calendar' ? '#009EE3' : 'white',
                      color: viewMode === 'calendar' ? 'white' : '#009EE3',
                      borderColor: '#009EE3'
                    }}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Calendário
                  </Button>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#009EE3] hover:bg-[#0080B7]">
                      <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Agendamento</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={addAppointment} className="space-y-4">
                      <div>
                        <Label htmlFor="patient">Paciente</Label>
                        <Input
                          id="patient"
                          required
                          value={newAppointment.patient}
                          onChange={(e) => setNewAppointment({ ...newAppointment, patient: e.target.value })}
                          placeholder="Nome do paciente"
                        />
                      </div>
                      <div>
                        <Label htmlFor="professional">Profissional</Label>
                        <Select
                          required
                          value={newAppointment.professional}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, professional: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length > 0 ? (
                              doctors.map((doctor) => (
                                // Verifica se doctor._id existe e não está vazio
                                doctor._id ? (
                                  <SelectItem key={doctor._id} value={doctor._id}>
                                    {doctor.name || (doctor.email ? 
                                      doctor.email.split(/[@.]/)[0].charAt(0).toUpperCase() + 
                                      doctor.email.split(/[@.]/)[0].slice(1) : 
                                      doctor._id)}
                                  </SelectItem>
                                ) : null
                              )).filter(Boolean) // Remove itens nulos do array
                            ) : (
                              <SelectItem value="no-doctor" disabled>
                                Nenhum médico encontrado
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="service">Serviço</Label>
                        <Select
                          required
                          value={newAppointment.service}
                          onValueChange={(value) => setNewAppointment({ ...newAppointment, service: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Data</Label>
                        <Input
                          id="date"
                          required
                          type="datetime-local"
                          value={newAppointment.date}
                          onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-[#009EE3] hover:bg-[#0080B7]">Agendar</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {viewMode === 'list' ? (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="w-full md:w-auto">
                    <Label>Profissional</Label>
                    <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filtrar por profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {doctors.map((doctor) => (
                          // Verifica se doctor._id existe e não está vazio
                          doctor._id ? (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              {doctor.name || (doctor.email ? 
                                doctor.email.split(/[@.]/)[0].charAt(0).toUpperCase() + 
                                doctor.email.split(/[@.]/)[0].slice(1) : 
                                doctor._id)}
                            </SelectItem>
                          ) : null
                        )).filter(Boolean) // Remove itens nulos do array
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-auto">
                    <Label>Período</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full md:w-auto"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full md:w-auto"
                      />
                    </div>
                  </div>
                </div>

                {/* Tabs and Content */}
                <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
                  <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="Pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="Confirmed">Confirmados</TabsTrigger>
                    <TabsTrigger value="Canceled">Cancelados</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    <AppointmentsList
                      appointments={filteredAppointments}
                      onStatusChange={updateStatus}
                      onDelete={handleDeleteClick}
                      onStartMeeting={openJitsiMeeting}
                      getDoctorName={getDoctorName}
                      doctors={doctors}
                    />
                  </TabsContent>
                  {["Pending", "Confirmed", "Canceled"].map((status) => (
                    <TabsContent key={status} value={status} className="mt-6">
                      <AppointmentsList
                        appointments={filteredAppointments}
                        onStatusChange={updateStatus}
                        onDelete={handleDeleteClick}
                        onStartMeeting={openJitsiMeeting}
                        getDoctorName={getDoctorName}
                        doctors={doctors}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            ) : (
              <CalendarView 
                appointments={filteredAppointments} 
                onStartMeeting={openJitsiMeeting}
                doctors={doctors}
              />
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir este agendamento?</p>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => itemToDelete && deleteAppointment(itemToDelete._id)}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para iniciar reunião */}
      <Dialog open={jitsiModalOpen} onOpenChange={setJitsiModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Videochamada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentMeeting && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Paciente: {currentMeeting.patient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Data: {new Date(currentMeeting.date).toLocaleDateString('pt-BR')} às {new Date(currentMeeting.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Serviço: {currentMeeting.service}</span>
                </div>
                
                {currentMeeting.meetingUrl && (
                  <div className="mt-4 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <a 
                      href={currentMeeting.meetingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {currentMeeting.meetingUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setJitsiModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#009EE3] hover:bg-[#0080B7]"
                onClick={launchJitsiMeeting}
              >
                <Video className="h-4 w-4 mr-1" /> Iniciar Videochamada
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente de lista de agendamentos
function AppointmentsList({ appointments, onStatusChange, onDelete, onStartMeeting, getDoctorName, doctors }) {
  // Fallback implementation of getDoctorName in case it's not provided
  const getDoctor = getDoctorName || ((doctorId) => {
    const doctor = doctors.find(d => d._id === doctorId)
    if (!doctor) return doctorId
    
    if (doctor.name) return doctor.name
    
    // Extract first name from email (before the dot or @ symbol)
    if (doctor.email) {
      const emailParts = doctor.email.split(/[@.]/)[0]
      // Capitalize first letter
      return emailParts.charAt(0).toUpperCase() + emailParts.slice(1)
    }
    
    return doctorId
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Confirmed': return 'bg-green-100 text-green-800'
      case 'Canceled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending': return 'Pendente'
      case 'Confirmed': return 'Confirmado'
      case 'Canceled': return 'Cancelado'
      default: return status
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum agendamento encontrado
            </div>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-white rounded-lg border gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{appointment.patient}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(appointment.date).toLocaleString()}
                    </Badge>
                    <Badge variant="outline">
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getDoctor(appointment.professional)}
                      </div>
                    </Badge>
                    <Badge variant="outline"><Tag className="h-3 w-3 mr-1" />
                      {appointment.service}
                    </Badge>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-[#009EE3] hover:bg-[#0080B7]"
                          onClick={() => onStartMeeting(appointment)}
                        >
                          <Video className="h-4 w-4 mr-1" /> Videochamada
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Iniciar videochamada com {appointment.patient}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select
                    value={appointment.status}
                    onValueChange={(value) => onStatusChange(appointment._id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pendente</SelectItem>
                      <SelectItem value="Confirmed">Confirmado</SelectItem>
                      <SelectItem value="Canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(appointment)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}