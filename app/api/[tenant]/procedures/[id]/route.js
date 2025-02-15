import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getProcedureModel } from '@/lib/models/Procedures';


export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tenant = id.tenant;
    
    // Connect to the specific tenant's database
    const connection = await connectDB(tenant);
    
    // Get the Procedure model for this specific connection
    const Procedure = getProcedureModel(connection);
    
    // Delete the procedure
    await Procedure.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Procedure deleted successfully' });
  } catch (error) {
    console.error('Delete procedure error:', error);
    return NextResponse.json({ error: 'Failed to delete procedure' }, { status: 500 });
  }
}