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

    // Update user medical details
    const updatedUser = await User.findOneAndUpdate(
      { 
        _id: userId,
        tenantPath: tenant,
        role: 'user'
      },
      { 
        $set: {
          medicalDetails: {
            clinicalHistory: body.clinicalHistory,
            surgicalHistory: body.surgicalHistory,
            familyHistory: body.familyHistory,
            habits: body.habits,
            allergies: body.allergies,
            medications: body.medications,
            lastDiagnosis: body.lastDiagnosis || {
              date: new Date(),
              diagnosis: '',
              notes: ''
            }
          }
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error in PUT /api/[tenant]/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update user details' },
      { status: 500 }
    );
  }
}