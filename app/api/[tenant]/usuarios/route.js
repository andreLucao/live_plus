import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';



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
    const User = getUserModel(connection);

    // Query the incomes collection for the tenant
    const users = await User.find().sort({ date: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/usuarios:', error);
    return NextResponse.json({ error: 'Failed to fetch income records' }, { status: 500 });
  }
}