import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const ROLE_EXPIRY_TIME = 60; // 1 min in seconds

// Helper function to create session tokens
async function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const sessionToken = await new SignJWT({ 
    email: user.email,
    userId: user.userId || user._id.toString(),
    tenantPath: user.tenantPath,
    role: user.role,
    roleExpiry: now + ROLE_EXPIRY_TIME, // Role expires in 1 min
    authenticated: true 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d') // Full token expires in 7 days
    .sign(secret);

  return sessionToken;
}

export async function middleware(request) {
  // Extract tenant from URL path (e.g., myApp.pro/tenant)
  const pathname = request.nextUrl.pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  const tenant = pathParts[0];

  // Skip middleware for root path and API routes
  if (pathname === '/' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow access to login page without authentication
  if (pathname.endsWith('/login')) {
    return NextResponse.next();
  }

  // For all other routes, simply allow access without verification
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};