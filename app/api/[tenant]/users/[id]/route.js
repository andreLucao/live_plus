// app/api/[tenant]/users/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';
import { getSubscriptionModel } from '@/lib/models/Subscription';
import { ObjectId } from 'mongodb'; // Importar se necessário para validação de ID

// Helper function to check subscription limits
async function checkSubscriptionLimits(connection, tenant, newRole, currentRole = null) {
  const User = getUserModel(connection);
  const Subscription = getSubscriptionModel(connection);

  // Get active subscription
  const subscription = await Subscription.findOne({
    status: 'active',
    currentPeriodEnd: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return { allowed: true }; // If no subscription, allow the operation
  }

  // Count current doctors and admins
  const currentCount = await User.countDocuments({
    tenantPath: tenant,
    role: { $in: ['doctor', 'admin'] },
    status: { $ne: 'Archived' }
  });

  // If we're updating a user and they're already a doctor/admin
  // and their role isn't changing to doctor/admin, we don't need to check limits
  if (currentRole && ['doctor', 'admin'].includes(currentRole) && 
      !['doctor', 'admin'].includes(newRole)) {
    return { allowed: true };
  }

  // If we're updating a user and their role isn't changing to doctor/admin,
  // we don't need to check limits
  if (currentRole && currentRole === newRole) {
    return { allowed: true };
  }

  // If the new role is doctor or admin, check if we're at the limit
  if (['doctor', 'admin'].includes(newRole)) {
    if (currentCount >= subscription.userCount) {
      return {
        allowed: false,
        error: `Limite de usuários (${subscription.userCount}) atingido para o plano atual. Por favor, atualize seu plano para adicionar mais usuários.`
      };
    }
  }

  return { allowed: true };
}

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

    // Check subscription limits before proceeding
    const currentUser = userId !== 'new' ? await User.findOne({ _id: userId }) : null;
    const currentRole = currentUser ? currentUser.role : null;
    
    const limitCheck = await checkSubscriptionLimits(connection, tenant, body.role, currentRole);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.error },
        { status: 403 }
      );
    }

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
        // Add cellphone and cpf if provided
        ...(body.cellphone && { cellphone: body.cellphone }),
        ...(body.cpf && { cpf: body.cpf }),
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
            cellphone: newUser.cellphone,
            cpf: newUser.cpf,
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
            // Add cellphone and cpf if provided
            ...(body.cellphone !== undefined && { cellphone: body.cellphone }),
            ...(body.cpf !== undefined && { cpf: body.cpf }),
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

export async function DELETE(request, { params }) {
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

    console.log(`Attempting to delete user with ID: ${userId} from tenant: ${tenant}`);

    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({
      _id: userId,
      tenantPath: tenant
    });

    if (!deletedUser) {
      console.log(`User not found: ${userId}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`User deleted successfully: ${userId}`);
    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUserId: userId
    });
  } catch (error) {
    console.error('Error in DELETE /api/[tenant]/users/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete user: ' + error.message },
      { status: 500 }
    );
  }
}