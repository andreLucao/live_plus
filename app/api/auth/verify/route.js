import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { connectDB } from '@/lib/mongodb';
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
    
    // Connect to MongoDB
    await connectDB();

    // Find or create user
    const user = await User.findOneAndUpdate(
      { email: decoded.email },
      { 
        $setOnInsert: { createdAt: new Date() },
        $set: { lastLoginAt: new Date() }
      },
      { upsert: true, new: true }
    );

    // Add debug logging
    console.log('User login:', { 
      userId: user._id,
      email: user.email,
      token: token.substring(0, 10) + '...' // Only log part of the token for security
    });
    
    // Create a session token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const sessionToken = await new SignJWT({ 
      email: decoded.email,
      userId: user._id.toString(),
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