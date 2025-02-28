import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Helper to convert the ReadableStream to a Buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// GET endpoint to retrieve all documents for a patient
export async function GET(request, { params }) {
  try {
    const { tenant, id } = params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 });
    }
    
    const tenantConnection = await connectDB(tenant);
    const Document = tenantConnection.model('Document');
    
    // Get all documents for this patient, excluding the actual file data to reduce payload size
    const documents = await Document.find(
      { userId: id }, 
      { data: 0 } // Exclude the binary data
    ).sort({ uploadedAt: -1 });
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint to upload a new document
export async function POST(request, { params }) {
  try {
    const { tenant, id } = params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid patient ID format' }, { status: 400 });
    }
    
    // Check if the request is multipart/form-data
    const requestContentType = request.headers.get('content-type') || '';
    if (!requestContentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Get file details
    const name = formData.get('name') || file.name;
    const description = formData.get('description') || '';
    const fileType = file.name.split('.').pop().toLowerCase();
    const contentType = file.type;
    const size = file.size;
    
    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    // Connect to the tenant database
    const tenantConnection = await connectDB(tenant);
    const Document = tenantConnection.model('Document');
    
    // Create a new document record
    const newDocument = new Document({
      userId: id,
      name,
      description,
      fileType,
      contentType,
      size,
      data: buffer
    });
    
    await newDocument.save();
    
    // Return the document info without the binary data
    const documentInfo = {
      _id: newDocument._id,
      userId: newDocument.userId,
      name: newDocument.name,
      description: newDocument.description,
      fileType: newDocument.fileType,
      contentType: newDocument.contentType,
      size: newDocument.size,
      uploadedAt: newDocument.uploadedAt
    };
    
    return NextResponse.json(documentInfo, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 