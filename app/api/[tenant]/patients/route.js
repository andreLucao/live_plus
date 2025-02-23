import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getPatientDetailsModel } from '@/lib/models/PatientDetails';

export async function GET(request, { params }) {
  try {
    const id = await params;
    const tenant = id.tenant;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant is required' }, { status: 400 });
    }

    // Connect to the database
    const connection = await connectDB(tenant);
    const PatientDetails = getPatientDetailsModel(connection);

    // Query patient details for the specific tenant
    const patientDetails = await PatientDetails.find({ tenantPath: tenant })
      .sort({ createdAt: -1 });

    return NextResponse.json(patientDetails);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/patient-details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient details' },
      { status: 500 }
    );
  }
}