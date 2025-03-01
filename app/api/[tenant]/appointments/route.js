import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/lib/models/Appointment';

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

    // Add tenantPath to the data
    const appointmentData = { ...data, tenantPath };
    
    if (!appointmentData.patient || !appointmentData.professional || 
        !appointmentData.service || !appointmentData.date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const appointment = await Appointment.create(appointmentData);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
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

    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}