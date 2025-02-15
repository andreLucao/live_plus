import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getBillModel } from '@/lib/models/Bill';

export async function GET(request, { params }) {
  try {
    const id  = await params
    const tenant = id.tenant

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);
    const Bill = getBillModel(connection);

    const bills = await Bill.find().sort({ date: -1 });
    return NextResponse.json(bills);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/bills:', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const tenant = params.tenant;
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    const connection = await connectDB(tenant);
    const Bill = getBillModel(connection);

    const data = await request.json();
    const bill = await Bill.create(data);
    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/[tenant]/bills:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const tenant = params.tenant;
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    const connection = await connectDB(tenant);
    const Bill = getBillModel(connection);

    const data = await request.json();
    const { id, ...updateData } = data;
    const bill = await Bill.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error in PUT /api/[tenant]/bills:', error);
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
  }
}