"use client"

import { useState, useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function CalendarView({ appointments }) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const calendarRef = useRef(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Get unique dates with appointments
  const datesWithAppointments = useMemo(() => {
    const dates = new Set()
    appointments.forEach(appointment => {
      const date = new Date(appointment.date)
      dates.add(format(date, 'yyyy-MM-dd'))
    })
    return dates
  }, [appointments])

  const events = appointments.map(appointment => ({
    id: appointment._id,
    title: `${appointment.patient}\n${appointment.service}`,
    start: appointment.date,
    end: new Date(new Date(appointment.date).getTime() + 60 * 60 * 1000),
    backgroundColor: getStatusColor(appointment.status),
    borderColor: 'transparent',
    textColor: '#1a1a1a',
    extendedProps: {
      professional: appointment.professional,
      status: appointment.status
    }
  }))

  function getStatusColor(status) {
    switch (status) {
      case 'Pending': return 'rgba(251, 191, 36, 0.2)'
      case 'Confirmed': return 'rgba(52, 211, 153, 0.2)'
      case 'Canceled': return 'rgba(248, 113, 113, 0.2)'
      default: return 'rgba(148, 163, 184, 0.2)'
    }
  }

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event
    alert(`
      Paciente: ${event.title.split('\n')[0]}
      Serviço: ${event.title.split('\n')[1]}
      Profissional: ${event.extendedProps.professional}
      Status: ${event.extendedProps.status}
      Data: ${event.start.toLocaleString()}
    `)
  }

  const handleDateSelect = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.gotoDate(date)
      setSelectedDate(date)
      setIsDatePickerOpen(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-end mb-4">
        <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              className="gap-2"
              style={{
                borderColor: '#009EE3',
                color: '#009EE3'
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              Escolher Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Selecionar Data</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                styles={{
                  button_reset: { borderColor: '#009EE3' },
                }}
                modifiers={{
                  hasAppointment: (date) => 
                    datesWithAppointments.has(format(date, 'yyyy-MM-dd')),
                  today: (date) => 
                    format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'),
                }}
                modifiersStyles={{
                  hasAppointment: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: '#009EE3',
                    textDecorationThickness: '2px',
                    textUnderlineOffset: '4px'
                  },
                  today: {
                    color: '#009EE3',
                    fontWeight: 'bold'
                  }
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="h-[600px]">
        <style jsx global>{`
          .fc {
            font-family: system-ui, -apple-system, sans-serif;
          }
          .fc .fc-toolbar.fc-header-toolbar {
            margin-bottom: 1em;
          }
          .fc .fc-button {
            background: white;
            border: 1px solid #e5e7eb;
            color: #374151;
          }
          .fc .fc-button:hover {
            background: #f9fafb;
          }
          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background: #009EE3;
            border-color: #009EE3;
            color: white;
          }
          .fc .fc-button-primary:focus {
            box-shadow: none;
          }
          .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 600;
          }
          .fc .fc-timegrid-slot {
            height: 48px !important;
            border-bottom: none;
          }
          .fc .fc-timegrid-slot-label {
            font-size: 0.875rem;
            color: #6b7280;
          }
          .fc .fc-col-header-cell {
            padding: 8px;
            background: white !important;
            border-bottom: 1px solid #e5e7eb;
          }
          .fc .fc-col-header-cell-cushion {
            color: #374151;
            font-weight: 500;
            text-decoration: none !important;
          }
          .fc .fc-timegrid-now-indicator-line {
            border-color: #009EE3;
          }
          .fc .fc-timegrid-now-indicator-arrow {
            border-color: #009EE3;
            color: #009EE3;
          }
          .fc .fc-event {
            padding: 4px 8px;
            font-size: 0.875rem;
            border-radius: 4px;
            margin: 1px;
          }
          .fc .fc-event-title {
            font-weight: 500;
            white-space: pre-wrap;
          }
          .fc .fc-event-time {
            font-size: 0.75rem;
            opacity: 0.75;
          }
          .fc .fc-day-today {
            background: white !important;
          }
          .fc td {
            border-color: #f3f4f6;
          }
        `}</style>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="timeGridDay"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          eventClick={handleEventClick}
          locale="pt-br"
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          nowIndicator={true}
          height="100%"
          slotDuration="01:00:00"
          slotLabelInterval="01:00"
          expandRows={true}
          dayMaxEvents={false}
          titleFormat={{ day: 'numeric', month: 'long', year: 'numeric' }}
          dayHeaderFormat={{ weekday: 'long', day: 'numeric', month: 'long' }}
        />
      </div>
    </Card>
  )
} 