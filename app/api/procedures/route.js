//app/api/procedures/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Procedure } from '@/lib/models/Procedures';

export async function GET(request) {
  try {
    await connectDB();
    const tenantPath = request.headers.get('x-tenant-path');
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    const procedures = await Procedure.find({ tenantPath }).sort({ date: -1 });
    return NextResponse.json(procedures);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch procedures' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const tenantPath = request.headers.get('x-tenant-path');
    const data = await request.json();
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Add tenantPath to the data
    const procedureData = { ...data, tenantPath };
    
    if (!procedureData.name || !procedureData.category || !procedureData.date || 
        !procedureData.doctor || !procedureData.patient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const procedure = await Procedure.create(procedureData);
    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create procedure' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const tenantPath = request.headers.get('x-tenant-path');
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    const procedure = await Procedure.findOneAndUpdate(
      { _id: id, tenantPath },
      updateData,
      { new: true }
    );
    
    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(procedure);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update procedure' }, 
      { status: 500 }
    );
  }
}