import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();

    // Buscar todos os usuários, excluindo a senha
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/patients:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar usuários' },
      { status: 500 }
    );
  }
}