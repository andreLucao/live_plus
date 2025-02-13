//app/api/appointments/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Appointment } from '@/lib/models/Appointment';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const tenantPath = request.headers.get('x-tenant-path');
    await connectDB();
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOneAndDelete({ _id: id, tenantPath });
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Appointment deleted successfully' }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}