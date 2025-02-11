//app/api/procedures/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Procedure } from '@/lib/models/Procedures';

export async function GET() {
  try {
    await connectDB();
    const procedures = await Procedure.find().sort({ date: -1 });
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
    const data = await request.json();
    
    // Validação dos dados
    if (!data.name || !data.category || !data.date || !data.doctor || !data.patient) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const procedure = await Procedure.create(data);
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
    const data = await request.json();
    const { id, ...updateData } = data;
    
    // Validação dos dados
    if (!id || !updateData.name || !updateData.category || 
        !updateData.date || !updateData.doctor || !updateData.patient) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const procedure = await Procedure.findByIdAndUpdate(id, updateData, { new: true });
    
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