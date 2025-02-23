import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import PatientDetails from '@/lib/models/PatientDetails';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const user = await User.findById(params.id).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    const details = await PatientDetails.findOne({ userId: params.id });
    
    // Combinar dados do usuário com detalhes do paciente
    const patientData = {
      ...user.toObject(),
      ...(details ? details.toObject() : {
        clinicalHistory: [],
        surgicalHistory: [],
        familyHistory: [],
        habits: [],
        allergies: [],
        medications: [],
        lastDiagnoses: []
      })
    };

    return NextResponse.json(patientData);
  } catch (error) {
    console.error('Error in GET /api/patients/[id]:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar detalhes do paciente' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const body = await request.json();
    
    // Atualizar detalhes do paciente
    const details = await PatientDetails.findOneAndUpdate(
      { userId: params.id },
      { 
        $set: {
          clinicalHistory: body.clinicalHistory,
          surgicalHistory: body.surgicalHistory,
          familyHistory: body.familyHistory,
          habits: body.habits,
          allergies: body.allergies,
          medications: body.medications,
          lastDiagnoses: body.lastDiagnoses
        }
      },
      { 
        new: true,
        upsert: true
      }
    );

    return NextResponse.json(details);
  } catch (error) {
    console.error('Error in PUT /api/patients/[id]:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar detalhes do paciente' },
      { status: 500 }
    );
  }
}