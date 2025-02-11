import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { connectDB, getTenantDatabases, getTenantModel } from '@/lib/mongodb';
import User from '@/lib/models/User';

const EMAIL_SECRET = process.env.EMAIL_SECRET || 'your-secret-key';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
    }

    // Verify the email token
    const decoded = jwt.verify(token, EMAIL_SECRET);
    
    // Connect to MongoDB main database
    await connectDB();
    
    const emailDomain = decoded.email.split('@')[1].split('.')[0];
    
    // Get list of existing tenant databases
    const existingDatabases = await getTenantDatabases();
    const isTenantNew = !existingDatabases.includes(emailDomain);
    
    // Connect to tenant's database
    const tenantConnection = await connectDB(emailDomain);
    const User = getTenantModel(tenantConnection, 'User');
    
    // Find or create user
    let user = await User.findOne({ email: decoded.email });
    
    if (user && !user.tenantPath) {
      user.tenantPath = emailDomain;
      await user.save();
    } else if (!user) {
      // Create new user
      const newUser = new User({
        email: decoded.email,
        tenantPath: emailDomain,
        role: isTenantNew ? 'owner' : 'user',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });
      await newUser.save();
      user = newUser;
    }

    // If this is a new tenant, initialize their database
    if (isTenantNew) {
      await connectDB(emailDomain);
      console.log(`Initialized new tenant database: ${emailDomain}`);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Add debug logging
    console.log('User login:', { 
      userId: user._id,
      email: user.email,
      tenantPath: user.tenantPath,
      role: user.role,
      token: token.substring(0, 10) + '...' // Only log part of the token for security
    });
    
    // Create a session token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const sessionToken = await new SignJWT({ 
      email: decoded.email,
      userId: user._id.toString(),
      tenantPath: user.tenantPath,
      role: user.role,
      authenticated: true 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/?error=invalid-token', request.url));
  }
} 