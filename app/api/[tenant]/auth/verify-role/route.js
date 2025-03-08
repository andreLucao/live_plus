// app/[tenant]/api/auth/verify-role/route.js
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB, getTenantModel } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { createSessionToken } from '@/app/api/auth/verify/route';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export async function GET(request, { params }) {
  const id = await params;
  const tenant = id.tenant;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Verify tenant matches
    if (payload.tenantPath !== tenant) {
      return NextResponse.json({ error: 'Tenant mismatch' }, { status: 403 });
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check if role needs refreshing
    if (!payload.roleExpiry || payload.roleExpiry < now) {
      // Role has expired, refresh from database
      const tenantConnection = await connectDB(tenant);
      const User = getTenantModel(tenantConnection, 'User');
      
      const freshUserData = await User.findOne({ _id: payload.userId });
      
      if (!freshUserData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Create new token with updated role
      const updatedToken = await createSessionToken({
        email: payload.email,
        userId: payload.userId,
        tenantPath: payload.tenantPath,
        role: freshUserData.role,
        authenticated: true
      });
      
      // Set the updated token
      cookieStore.set('auth_token', updatedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      // Return the updated role
      return NextResponse.json({ 
        role: freshUserData.role,
        refreshed: true
      });
    }
    
    // Role is still valid
    return NextResponse.json({ 
      role: payload.role,
      refreshed: false
    });
    
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}