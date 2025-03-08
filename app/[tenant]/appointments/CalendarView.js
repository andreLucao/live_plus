"use client"

import { useState, useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import DatePicker from "react-datepicker" // Replace shadcn Calendar with react-datepicker
import "react-datepicker/dist/react-datepicker.css" // Import the styles
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { registerLocale } from "react-datepicker" // For locale support

// Register the Brazilian Portuguese locale
registerLocale('pt-BR', ptBR)

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

  // ... existing code ...

  const handleDateSelect = (date) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      calendarApi.gotoDate(date)
      setSelectedDate(date)
      setIsDatePickerOpen(false)
    }
  }

  // Custom day rendering for react-datepicker to highlight days with appointments
  const renderDayContents = (day, date) => {
    const hasAppointment = datesWithAppointments.has(format(date, 'yyyy-MM-dd'))
    const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    
    return (
      <div
        style={{
          position: 'relative',
          fontWeight: hasAppointment ? 'bold' : 'normal',
          color: isToday ? '#009EE3' : undefined,
          textDecoration: hasAppointment ? 'underline' : 'none',
          textDecorationColor: '#009EE3',
          textDecorationThickness: '2px',
          textUnderlineOffset: '4px'
        }}
      >
        {day}
      </div>
    )
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
            <div className="py-4 flex justify-center">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateSelect}
                inline
                locale="pt-BR"
                renderDayContents={renderDayContents}
                calendarClassName="custom-datepicker"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="h-[600px]">
        <style jsx global>{`
          // ... existing styles ...
          
          /* Custom styles for react-datepicker */
          .custom-datepicker {
            font-family: system-ui, -apple-system, sans-serif;
            width: 100%;
            border: none;
          }
          .react-datepicker__header {
            background-color: white;
            border-bottom: 1px solid #e5e7eb;
          }
          .react-datepicker__day--selected {
            background-color: #009EE3;
            color: white;
          }
          .react-datepicker__day:hover {
            background-color: #f3f4f6;
          }
          .react-datepicker__day-name {
            color: #6b7280;
          }
          .react-datepicker__current-month {
            color: #374151;
            font-weight: 600;
          }
          .react-datepicker__navigation {
            top: 8px;
          }
        `}</style>
        <FullCalendar
          // ... existing FullCalendar props ...
        />
      </div>
    </Card>
  )
} 