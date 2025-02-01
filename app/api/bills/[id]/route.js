import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/lib/models/Bill';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Ensure params is awaited
    await Bill.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 });
  }
}
