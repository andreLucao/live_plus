import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Income } from '@/lib/models/Income';

export async function DELETE(request, context) {
  try {
    await connectDB();
    const id = context.params.id;
    await Income.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete income record' }, 
      { status: 500 }
    );
  }
}