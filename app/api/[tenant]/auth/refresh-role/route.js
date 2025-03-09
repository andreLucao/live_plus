// app/api/[tenant]/auth/refresh-role/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { connectDB } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const ROLE_EXPIRY_TIME = 60; // 1 min in seconds

export async function GET(request, { params }) {
  const id = await params;
  const tenant = id.tenant;
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || `/${tenant}`;
  
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
  }
  
  try {
    // Verify the existing token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Verify tenant matches
    if (payload.tenantPath !== tenant) {
      return NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
    }
    
    // Connect to database and refresh the role
    const tenantConnection = await connectDB(tenant);
    const User = getUserModel(tenantConnection);
    
    // Get fresh user data
    const freshUserData = await User.findOne({ _id: payload.userId });
    
    if (!freshUserData) {
      // User no longer exists
      const response = NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
      response.cookies.delete('auth_token');
      return response;
    }
    
    // Create new token with updated role
    const now = Math.floor(Date.now() / 1000);
    const updatedToken = await new SignJWT({ 
      email: payload.email,
      userId: payload.userId,
      tenantPath: payload.tenantPath,
      role: freshUserData.role, // Updated role from database
      roleExpiry: now + ROLE_EXPIRY_TIME,
      authenticated: true 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    
    // Redirect to the original URL with the new token
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    
    // Set the updated token as a cookie
    response.cookies.set({
      name: 'auth_token',
      value: updatedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Error refreshing token, redirect to login
    const response = NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}