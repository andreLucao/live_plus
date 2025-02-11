//api/income/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Income } from '@/lib/models/Income';

export async function GET() {
  try {
    await connectDB();
    const incomes = await Income.find().sort({ date: -1 });
    return NextResponse.json(incomes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch income records' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    const income = await Income.create(data);
    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create income record' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const data = await request.json();
    const { id, ...updateData } = data;
    const income = await Income.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(income);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update income record' }, { status: 500 });
  }
}
