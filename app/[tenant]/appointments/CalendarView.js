"use client"

import { useState, useEffect } from "react"
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CalendarView({ appointments = [] }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Filtra os agendamentos para o dia selecionado
  const dailyAppointments = appointments.filter(appointment => {
    const appointmentDate = typeof appointment.date === 'string' 
      ? parseISO(appointment.date) 
      : appointment.date
    return isSameDay(appointmentDate, selectedDate)
  })

  // Gera os dias do mês atual para o mini calendário
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  // Navega para o dia anterior
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1))
  }

  // Navega para o próximo dia
  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1))
  }

  // Navega para o dia atual
  const goToToday = () => {
    setSelectedDate(new Date())
    setCurrentMonth(new Date())
  }

  // Navega para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  // Navega para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  // Verifica se um dia específico tem agendamentos
  const hasDayAppointments = (day) => {
    return appointments.some(appointment => {
      const appointmentDate = typeof appointment.date === 'string' 
        ? parseISO(appointment.date) 
        : appointment.date
      return isSameDay(appointmentDate, day)
    })
  }

  // Formata as horas para exibição
  const formatTime = (dateString) => {
    if (!dateString) return ""
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, 'HH:mm', { locale: ptBR })
  }

  // Obtém a cor baseada no status do agendamento
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: 'rgba(255, 170, 0, 0.1)', border: '#FFAA00' }; // Amarelo para pendente
      case 'Confirmed':
        return { bg: 'rgba(0, 158, 227, 0.1)', border: '#009EE3' }; // Azul para confirmado
      case 'Canceled':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: '#EF4444' }; // Vermelho para cancelado
      default:
        return { bg: 'rgba(0, 158, 227, 0.1)', border: '#009EE3' }; // Padrão azul
    }
  };

  // Gera os horários para a visualização diária (de 8h às 18h)
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8)

  // Quando o usuário seleciona uma data de um mês diferente, atualiza o mês atual
  useEffect(() => {
    setCurrentMonth(selectedDate)
  }, [selectedDate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousDay}
            style={{ borderColor: '#009EE3', color: '#009EE3' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-lg">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextDay}
            style={{ borderColor: '#009EE3', color: '#009EE3' }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={goToToday}
            style={{ borderColor: '#009EE3', color: '#009EE3' }}
          >
            Hoje
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsCalendarOpen(true)}
            style={{ borderColor: '#009EE3', color: '#009EE3' }}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendário
          </Button>
        </div>
      </div>

      {/* Modal flutuante para navegação entre meses */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#FFFFFF', borderColor: '#009EE3' }}>
          <DialogHeader>
            <DialogTitle className="text-center" style={{ color: '#009EE3' }}>
              Selecione uma data
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between px-4 py-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPreviousMonth}
              style={{ color: '#009EE3' }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-lg font-medium">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth}
              style={{ color: '#009EE3' }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="text-sm font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, i) => {
                const hasAppointments = hasDayAppointments(day)
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-10 w-10 p-0 font-normal rounded-full",
                      isSameDay(day, selectedDate) && "text-white",
                      isToday(day) && !isSameDay(day, selectedDate) && "border"
                    )}
                    style={{
                      backgroundColor: isSameDay(day, selectedDate) ? '#009EE3' : 'transparent',
                      borderColor: isToday(day) && !isSameDay(day, selectedDate) ? '#009EE3' : 'transparent',
                      color: hasAppointments && !isSameDay(day, selectedDate) ? '#009EE3' : 'inherit',
                      fontWeight: hasAppointments && !isSameDay(day, selectedDate) ? 'bold' : 'normal'
                    }}
                    onClick={() => {
                      setSelectedDate(day)
                      setIsCalendarOpen(false)
                    }}
                  >
                    {format(day, "d")}
                    {hasAppointments && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: '#009EE3' }} />
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-md" style={{ backgroundColor: '#FFFFFF', borderColor: '#009EE3' }}>
        <CardHeader className="py-3" style={{ borderBottomColor: '#009EE3' }}>
          <CardTitle style={{ color: '#009EE3' }}>Agenda do Dia</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="space-y-1">
            {timeSlots.map((hour) => {
              const hourAppointments = dailyAppointments.filter(appointment => {
                const appointmentDate = typeof appointment.date === 'string' 
                  ? parseISO(appointment.date) 
                  : appointment.date
                return appointmentDate.getHours() === hour
              })

              return (
                <div key={hour} className="grid grid-cols-12 gap-1 py-1 border-b" style={{ borderBottomColor: '#E5E7EB' }}>
                  <div className="col-span-1 text-right font-medium text-sm pt-1">
                    {`${hour}:00`}
                  </div>
                  <div className="col-span-11">
                    {hourAppointments.length > 0 ? (
                      <div className="space-y-1">
                        {hourAppointments.map((appointment, index) => {
                          const statusColors = getStatusColor(appointment.status);
                          return (
                            <div 
                              key={index} 
                              className="p-2 rounded border transition-all hover:shadow-md"
                              style={{ 
                                backgroundColor: statusColors.bg, 
                                borderColor: statusColors.border,
                                minHeight: '60px'
                              }}
                            >
                              <div className="font-medium text-sm">{appointment.patient}</div>
                              <div className="text-xs" style={{ color: '#4B5563' }}>
                                {appointment.service} com {appointment.professional}
                              </div>
                              <div className="flex justify-end items-center mt-1">
                                <div className="text-xs px-2 py-0.5 rounded-full" style={{ 
                                  backgroundColor: statusColors.border,
                                  color: '#FFFFFF'
                                }}>
                                  {appointment.status === 'Pending' ? 'Pendente' : 
                                   appointment.status === 'Confirmed' ? 'Confirmado' : 
                                   appointment.status === 'Canceled' ? 'Cancelado' : appointment.status}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-2 border border-dashed rounded" style={{ 
                        borderColor: '#E5E7EB', 
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>Sem agendamentos</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
