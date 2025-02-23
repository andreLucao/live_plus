import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';
import { getPatientDetailsModel } from '@/lib/models/PatientDetails';

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
    const PatientDetails = getPatientDetailsModel(connection);

    // Find user and details with tenant-specific paths
    const user = await User.findOne({
      _id: userId,
      tenantPath: tenant
    }).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    const details = await PatientDetails.findOne({
      userId: userId,
      tenantPath: tenant
    });

    // Combine user data with patient details
    const patientData = {
      ...user.toObject(),
      ...(details ? details.toObject() : {
        clinicalHistory: '',
        surgicalHistory: '',
        familyHistory: '',
        habits: '',
        allergies: '',
        medications: '',
        lastDiagnosis: {
          date: new Date(),
          diagnosis: '',
          notes: ''
        }
      })
    };

    return NextResponse.json(patientData);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/patients/[id]:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar detalhes do paciente' },
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
    const PatientDetails = getPatientDetailsModel(connection);

    const body = await request.json();

    // Update patient details with tenant path
    const details = await PatientDetails.findOneAndUpdate(
      { 
        userId: userId,
        tenantPath: tenant 
      },
      { 
        $set: {
          tenantPath: tenant, // Ensure tenantPath is set
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
      },
      { 
        new: true,
        upsert: true
      }
    );

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error in PUT /api/[tenant]/patients/[id]:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar detalhes do paciente' },
      { status: 500 }
    );
  }
}