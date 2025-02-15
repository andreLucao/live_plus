//api/income/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Income } from '@/lib/models/Income';

import { getIncomeModel } from '@/lib/models/Income';


export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const tenant = id.tenant

    const connection = await connectDB(tenant)
    
    const Income = getIncomeModel(connection)

    await Income.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete income record' }, 
      { status: 500 }
    );
  }
}