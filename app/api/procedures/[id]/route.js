//app/api/procedures/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Procedure } from '@/lib/models/Procedures';

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

    const procedure = await Procedure.findOneAndDelete({ _id: id, tenantPath });
    
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