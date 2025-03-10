import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAppointmentModel } from '@/lib/models/Appointment';

export async function DELETE(request, { params }) {
  try {
    const connection = await connectDB();
    const Appointment = getAppointmentModel(connection);
    const { tenant, id } = params;
    
    if (!tenant || !id) {
      return NextResponse.json(
        { error: 'Tenant path and appointment ID are required' },
        { status: 400 }
      );
    }
    
    // Delete the appointment
    const deletedAppointment = await Appointment.findOneAndDelete({
      _id: id,
      tenantPath: tenant
    });
    
    if (!deletedAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}