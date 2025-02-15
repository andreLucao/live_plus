import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getBillModel } from '@/lib/models/Bill';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tenant = id.tenant 
    
    // Connect to the specific tenant's database
    const connection = await connectDB(tenant);
    
    // Get the Bill model for this specific connection
    const Bill = getBillModel(connection);
    
    // Delete the bill
    await Bill.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete bill error:', error);
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}