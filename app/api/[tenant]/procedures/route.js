import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getProcedureModel } from '@/lib/models/Procedures';

export async function GET(request, {params}) {
  try {
    const id = await params;
    const tenantPath = id.tenant;

    const connection = await connectDB();
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const patient = searchParams.get('patient');
    
    // Build query object
    const query = { tenantPath };
    
    // Add patient filter if provided
    if (patient) {
      // Use regex to make it case insensitive and partial match
      query.patient = { $regex: patient, $options: 'i' };
    }

    const Procedure = getProcedureModel(connection);
    const procedures = await Procedure.find(query).sort({ date: -1 });
    return NextResponse.json(procedures);
  } catch (error) {
    console.error('Error fetching procedures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch procedures' }, 
      { status: 500 }
    );
  }
}

export async function POST(request, {params}) {
  try {
    const connection = await connectDB();
    const id = await params;
    const tenantPath = id.tenant;
    const data = await request.json();
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Add tenantPath to the data
    const procedureData = { ...data, tenantPath };
    
    // Validate required fields based on schema requirements
    if (!procedureData.name || !procedureData.category || !procedureData.date || 
        !procedureData.doctor || !procedureData.patient) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category enum
    const validCategories = [
      'Cirurgia',
      'Consulta',
      'Exame',
      'Procedimento Ambulatorial',
      'Tratamento',
      'Emergência',
      'Internação',
      'Reabilitação',
      'Diagnóstico por Imagem',
      'Outro'
    ];
    
    if (!validCategories.includes(procedureData.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const Procedure = getProcedureModel(connection);
    const procedure = await Procedure.create(procedureData);
    return NextResponse.json(procedure, { status: 201 });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create procedure' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request, {params}) {
  try {
    const connection = await connectDB();
    const id = await params;
    const tenantPath = id.tenant;
    const data = await request.json();
    const { id: procedureId, ...updateData } = data;
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // If category is being updated, validate it
    if (updateData.category) {
      const validCategories = [
        'Cirurgia',
        'Consulta',
        'Exame',
        'Procedimento Ambulatorial',
        'Tratamento',
        'Emergência',
        'Internação',
        'Reabilitação',
        'Diagnóstico por Imagem',
        'Outro'
      ];
      
      if (!validCategories.includes(updateData.category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    const Procedure = getProcedureModel(connection);
    const procedure = await Procedure.findOneAndUpdate(
      { _id: procedureId, tenantPath },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(procedure);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update procedure' }, 
      { status: 500 }
    );
  }
}