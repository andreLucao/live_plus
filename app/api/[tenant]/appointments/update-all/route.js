import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/lib/models/Appointment';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, {params}) {
  try {
    const connection = await connectDB();
    const Appointment = getAppointmentModel(connection);
    const id = await params;
    const tenantPath = id.tenant;
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Encontrar todos os agendamentos que não possuem meetingId ou meetingUrl
    const appointmentsToUpdate = await Appointment.find({
      tenantPath,
      $or: [
        { meetingId: { $exists: false } },
        { meetingUrl: { $exists: false } },
        { meetingId: null },
        { meetingUrl: null },
        { meetingId: "" },
        { meetingUrl: "" }
      ]
    });

    console.log(`Encontrados ${appointmentsToUpdate.length} agendamentos para atualizar`);

    // Atualizar cada agendamento
    const updatedAppointments = [];
    for (const appointment of appointmentsToUpdate) {
      const meetingId = uuidv4();
      const meetingUrl = `https://meet.jit.si/${tenantPath}-${meetingId}`;
      
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointment._id,
        { 
          meetingId,
          meetingUrl
        },
        { new: true }
      );
      
      updatedAppointments.push(updatedAppointment);
    }

    return NextResponse.json({
      message: `${updatedAppointments.length} agendamentos atualizados com sucesso`,
      updatedAppointments
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamentos:', error);
    return NextResponse.json(
      { error: 'Failed to update appointments' },
      { status: 500 }
    );
  }
} 