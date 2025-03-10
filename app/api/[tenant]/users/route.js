import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';

// GET all users with role='user'
export async function GET(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the database
    const connection = await connectDB(tenant);
    const User = getUserModel(connection);

    // Query users for the specific tenant with role='user'
    const users = await User.find({ 
      tenantPath: tenant,
      status: { $ne: 'Archived' } // Optionally exclude archived users
    })
    .select('-password') // Exclude password field
    .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}