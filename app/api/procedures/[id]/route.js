//app/api/procedures/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Procedure } from '@/lib/models/Procedures';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await connectDB();
    
    const procedure = await Procedure.findByIdAndDelete(id);
    
    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Procedure deleted successfully' }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete procedure' }, 
      { status: 500 }
    );
  }
}