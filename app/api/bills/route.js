import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/lib/models/Bill';

export async function GET() {
  try {
    await connectDB();
    const bills = await Bill.find().sort({ date: -1 });
    return NextResponse.json(bills);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const bill = await Bill.create(data);
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    const bill = await Bill.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(bill);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}