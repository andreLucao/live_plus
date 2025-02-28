import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';
import { jsPDF } from 'jspdf';

export async function POST(request, { params }) {
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

    // Create a PDF document
    const doc = new jsPDF();
    
    // Helper function to add text with line breaks
    const addWrappedText = (text, x, y, maxWidth) => {
      const lines = doc.splitTextToSize(text || 'No information available', maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * 7); // Return the new Y position
    };
    
    // Add content to the PDF
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text('Patient Medical Record', 105, yPos, { align: 'center' });
    yPos += 15;
    
    // Patient info
    doc.setFontSize(16);
    doc.text('Patient Information', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Email: ${user.email || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Last Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}`, 20, yPos);
    yPos += 15;
    
    // Medical details
    const medicalDetails = user.medicalDetails || {};
    
    // Clinical History
    doc.setFontSize(16);
    doc.text('Clinical History', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.clinicalHistory, 20, yPos, 170);
    yPos += 10;
    
    // Surgical History
    doc.setFontSize(16);
    doc.text('Surgical History', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.surgicalHistory, 20, yPos, 170);
    yPos += 10;
    
    // Add a new page if we're running out of space
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Family History
    doc.setFontSize(16);
    doc.text('Family History', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.familyHistory, 20, yPos, 170);
    yPos += 10;
    
    // Habits
    doc.setFontSize(16);
    doc.text('Habits', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.habits, 20, yPos, 170);
    yPos += 10;
    
    // Add a new page if we're running out of space
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Allergies
    doc.setFontSize(16);
    doc.text('Allergies', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.allergies, 20, yPos, 170);
    yPos += 10;
    
    // Medications
    doc.setFontSize(16);
    doc.text('Current Medications', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    yPos = addWrappedText(medicalDetails.medications, 20, yPos, 170);
    yPos += 10;
    
    // Add a new page if we're running out of space
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Latest Diagnosis
    if (medicalDetails.lastDiagnosis) {
      doc.setFontSize(16);
      doc.text('Latest Diagnosis', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(medicalDetails.lastDiagnosis.date).toLocaleDateString()}`, 20, yPos);
      yPos += 7;
      doc.text(`Diagnosis: ${medicalDetails.lastDiagnosis.diagnosis || 'No diagnosis title'}`, 20, yPos);
      yPos += 7;
      yPos = addWrappedText(`Notes: ${medicalDetails.lastDiagnosis.notes || 'No notes available'}`, 20, yPos, 170);
    }
    
    // Get the PDF as a buffer
    const pdfOutput = doc.output('arraybuffer');
    
    return new NextResponse(Buffer.from(pdfOutput), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="patient_${userId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: `Failed to generate PDF: ${error.message}` },
      { status: 500 }
    );
  }
} 