import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';

export async function GET(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant;
    const userId = id.id;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);
    const User = getUserModel(connection);

    // Find user with tenant-specific path and role='user'
    const user = await User.findOne({
      _id: userId,
      tenantPath: tenant,
      role: 'user'
    }).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant;
    const userId = id.id;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the tenant's specific database
    const connection = await connectDB(tenant);
    const User = getUserModel(connection);

    const body = await request.json();
    console.log('Updating user:', userId, 'with data:', body);

    // Update user with all provided fields
    const updatedUser = await User.findOneAndUpdate(
      { 
        _id: userId,
        tenantPath: tenant
      },
      { 
        $set: {
          email: body.email,
          role: body.role,
          status: body.status,
          // Only update medical details if they exist in the request
          ...(body.medicalDetails && { 
            medicalDetails: body.medicalDetails 
          })
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedUser) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User updated successfully:', updatedUser._id);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error in PUT /api/[tenant]/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update user details: ' + error.message },
      { status: 500 }
    );
  }
}