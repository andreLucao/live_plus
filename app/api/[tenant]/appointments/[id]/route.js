// app/api/appointments/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/lib/models/Appointment';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tenant = id.tenant;
    
    // Connect to the specific tenant's database
    const connection = await connectDB(tenant);
    
    // Get the Appointment model for this specific connection
    const Appointment = getAppointmentModel(connection);
    
    // Delete the appointment
    await Appointment.findByIdAndDelete(id);
    
    
    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}