//app/api/appointments/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Appointment } from '@/lib/models/Appointment';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    const appointment = await Appointment.findByIdAndDelete(id);
    
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