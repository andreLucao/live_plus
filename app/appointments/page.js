//app/appointments/page.js
"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, Save, X, User, Calendar, Tag, AlertCircle, MessageCircle } from "lucide-react"
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([])
  const [newAppointment, setNewAppointment] = useState({
    status: "Pending",
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
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments')
      if (!response.ok) throw new Error('Failed to fetch appointments')
      const data = await response.json()
      setAppointments(data)
      setError("")
    } catch (error) {
      setError("Falha ao carregar os agendamentos")
    } finally {
      setIsLoading(false)
    }
  }

  const addAppointment = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })

      if (!response.ok) throw new Error('Failed to add appointment')
      await fetchAppointments()
      setNewAppointment({ status: "Pending", date: "", professional: "", patient: "", service: "" })
      setIsModalOpen(false)
    } catch (error) {
      setError("Falha ao adicionar agendamento")
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        }),
      })

      if (!response.ok) throw new Error('Failed to update status')
      await fetchAppointments()
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
      const response = await fetch(`/api/appointments/${id}`, {
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
    const start = startDate ? new Date(startDate) : new Date(0)
    const end = endDate ? new Date(endDate) : new Date()
    end.setHours(23, 59, 59, 999)
    return appointmentDate >= start && appointmentDate <= end
  }

  const professionals = [...new Set(appointments.map(a => a.professional))]
  const filteredAppointments = filterAppointments(appointments)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed left-4 top-4">
            Serviços Adicionais
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Serviços Adicionais</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ul className="space-y-2">
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  Relatórios
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  Configurações
                </Button>
              </li>
              <li>
                <Button variant="ghost" className="w-full justify-start">
                  Ajuda
                </Button>
              </li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamentos</h1>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
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
                    <Input
                      id="professional"
                      required
                      value={newAppointment.professional}
                      onChange={(e) => setNewAppointment({ ...newAppointment, professional: e.target.value })}
                      placeholder="Nome do profissional"
                    />
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
                  <Button type="submit" className="w-full">Agendar</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <Label>Profissional</Label>
              <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map((prof) => (
                    <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                  ))}
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
              />
            </TabsContent>
            {["Pending", "Confirmed", "Canceled"].map((status) => (
              <TabsContent key={status} value={status} className="mt-6">
                <AppointmentsList
                  appointments={filteredAppointments}
                  onStatusChange={updateStatus}
                  onDelete={handleDeleteClick}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Chat Button */}
      <Button
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0"
        variant="secondary"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

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
    </div>
  )
}

// Componente de lista de agendamentos
function AppointmentsList({ appointments, onStatusChange, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Confirmed': return 'bg-green-100 text-green-800'
      case 'Canceled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {appointments.map((appointment) => (
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
                    <User className="h-3 w-3 mr-1" />
                    {appointment.professional}
                  </Badge>
                  <Badge variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {appointment.service}</Badge>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}