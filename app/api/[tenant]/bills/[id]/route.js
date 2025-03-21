import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getBillModel } from '@/lib/models/Bill';

export async function DELETE(request, { params }) {
  try {
    const { id, tenant } = params;
    
    // Connect to the specific tenant's database
    const connection = await connectDB(tenant);
    
    // Get the Bill model for this specific connection
    const Bill = getBillModel(connection);
    
    // Delete the bill
    const result = await Bill.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Despesa não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Despesa excluída com sucesso',
      deletedId: id
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    return NextResponse.json(
      { error: 'Falha ao excluir a despesa' }, 
      { status: 500 }
    );
  }
}