import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/lib/models/Appointment';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request, {params}) {
  try {
    const connection = await connectDB();
    const Appointment = getAppointmentModel(connection);
    const id  = await params
    const tenantPath = id.tenant
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    const appointments = await Appointment.find({ tenantPath }).sort({ date: -1 });
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request, {params}) {
  try {
    const connection = await connectDB();
    const Appointment = getAppointmentModel(connection);
    const id = await params;
    const tenantPath = id.tenant;
    const data = await request.json();
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Gerar um ID único para a reunião
    const meetingId = uuidv4();
    const meetingUrl = `https://meet.jit.si/${tenantPath}-${meetingId}`;

    // Add tenantPath and meetingUrl to the data
    const appointmentData = { 
      ...data, 
      tenantPath,
      meetingId,
      meetingUrl
    };
    
    console.log('Criando agendamento com dados:', appointmentData);
    
    if (!appointmentData.patient || !appointmentData.professional || 
        !appointmentData.service || !appointmentData.date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const appointment = await Appointment.create(appointmentData);
    console.log('Agendamento criado:', appointment);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function PUT(request, {params}) {
  try {
    const connection = await connectDB();
    const Appointment = getAppointmentModel(connection);
    const id = await params;
    const tenantPath = id.tenant;
    const data = await request.json();
    const { id: appointmentId, ...updateData } = data;
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Verificar se é necessário gerar um novo link de reunião
    const existingAppointment = await Appointment.findOne({ _id: appointmentId, tenantPath });
    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Sempre garantir que haja um meetingId e meetingUrl
    if (!existingAppointment.meetingId || !existingAppointment.meetingUrl) {
      const meetingId = uuidv4();
      const meetingUrl = `https://meet.jit.si/${tenantPath}-${meetingId}`;
      updateData.meetingId = meetingId;
      updateData.meetingUrl = meetingUrl;
      console.log('Gerando novo link de reunião:', meetingUrl);
    } else {
      // Garantir que os dados da reunião existente sejam mantidos
      if (!updateData.meetingId) updateData.meetingId = existingAppointment.meetingId;
      if (!updateData.meetingUrl) updateData.meetingUrl = existingAppointment.meetingUrl;
    }

    console.log('Atualizando agendamento com dados:', { id: appointmentId, ...updateData });

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, tenantPath },
      updateData,
      { new: true }
    );
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    console.log('Agendamento atualizado:', appointment);
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}