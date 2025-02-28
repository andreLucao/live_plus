import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET endpoint to retrieve a specific document
export async function GET(request, { params }) {
  try {
    const { tenant, id, documentId } = params;
    
    // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const tenantConnection = await connectDB(tenant);
    const Document = tenantConnection.model('Document');
    
    // Find the document
    const document = await Document.findOne({ _id: documentId, userId: id });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Return the document with appropriate headers for download
    return new NextResponse(document.data, {
      headers: {
        'Content-Type': document.contentType,
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': document.size.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE endpoint to remove a document
export async function DELETE(request, { params }) {
  try {
    const { tenant, id, documentId } = params;
    
    // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(documentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    
    const tenantConnection = await connectDB(tenant);
    const Document = tenantConnection.model('Document');
    
    // Find and delete the document
    const result = await Document.findOneAndDelete({ _id: documentId, userId: id });
    
    if (!result) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 