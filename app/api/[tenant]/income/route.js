//api/income/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getIncomeModel } from '@/lib/models/Income';



export async function GET(request, {params}) {
  try {
    const id  = await params
    const tenant = id.tenant
    //console.log(tenant)

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);
    const Income = getIncomeModel(connection);

    // Query the incomes collection for the tenant
    const incomes = await Income.find().sort({ date: -1 });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/bills:', error);
    return NextResponse.json({ error: 'Failed to fetch income records' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Extract tenant from request headers or query parameters
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get('tenant');

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);

    // Get the Income model for the tenant's connection
    const Income = getIncomeModel(connection);

    const data = await request.json();
    const income = await Income.create(data);
    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create income record' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Extract tenant from request headers or query parameters
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get('tenant');

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);

    // Get the Income model for the tenant's connection
    const Income = getIncomeModel(connection);

    const data = await request.json();
    const { id, ...updateData } = data;
    const income = await Income.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(income);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update income record' }, { status: 500 });
  }
}
