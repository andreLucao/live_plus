// app/api/[tenant]/users/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb'; // Importar se necessário para validação de ID

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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/[tenant]/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
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
    const User = getUserModel(connection);

    const body = await request.json();
    console.log('Processing user:', userId, 'with data:', body);

    // Verifica se o ID é 'new' para criar um novo usuário
    if (userId === 'new') {
      // Verificar se o email é fornecido
      if (!body.email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        );
      }

      // Verificar se o usuário já existe
      const existingUser = await User.findOne({
        email: body.email,
        tenantPath: tenant
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Usuário com este email já existe' },
          { status: 400 }
        );
      }

      // Criar um novo usuário
      const newUser = new User({
        email: body.email,
        tenantPath: tenant, // Garantindo que usamos o tenant dos parâmetros da URL
        role: body.role || 'user',
        status: body.status || 'Active',
        // Outros campos padrão podem ser adicionados aqui
      });

      // Salvar no banco de dados
      await newUser.save();

      console.log('User created successfully:', newUser._id);
      return NextResponse.json(
        {
          message: 'Usuário criado com sucesso',
          user: {
            _id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
            tenantPath: newUser.tenantPath,
            createdAt: newUser.createdAt
          }
        },
        { status: 201 }
      );
    } 
    else {
      // Comportamento original - atualizar um usuário existente
      // Update user with all provided fields
      const updatedUser = await User.findOneAndUpdate(
        { 
          _id: userId,
          tenantPath: tenant
        },
        { 
          $set: {
            email: body.email,
            role: body.role,
            status: body.status,
            // Only update medical details if they exist in the request
            ...(body.medicalDetails && { 
              medicalDetails: body.medicalDetails 
            })
          }
        },
        { 
          new: true,
          runValidators: true
        }
      ).select('-password');

      if (!updatedUser) {
        console.error('User not found:', userId);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.log('User updated successfully:', updatedUser._id);
      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    console.error('Error in PUT /api/[tenant]/users/[id]:', error);
    
    // Handle mongo duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Usuário com este email já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process user details: ' + error.message },
      { status: 500 }
    );
  }
}