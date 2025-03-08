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
    // Don't verify tenant here anymore - just allow access to login page
    return NextResponse.next();
  }

  // For all other tenant routes, check authentication
  if (tenant) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      // Redirect to login page with the tenant path
      return NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
    }

    try {
      // Verify the token using jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // Check if the tenant in the token matches the current tenant path
      if (payload.tenantPath && payload.tenantPath !== tenant) {
        console.log(`Tenant mismatch: Token tenant=${payload.tenantPath}, URL tenant=${tenant}`);
        // Tenant mismatch, redirect to login for the current tenant
        return NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
      }
      
      // Check if the role has expired and needs refreshing
      const now = Math.floor(Date.now() / 1000);
      if (payload.roleExpiry && payload.roleExpiry < now) {
        console.log('Role expiry detected, redirecting to refresh endpoint');
        
        // Instead of refreshing in middleware, redirect to a dedicated API route
        // that will handle the database connection and role refresh
        return NextResponse.redirect(
          new URL(`/api/${tenant}/auth/refresh-role?redirect=${encodeURIComponent(pathname)}`, request.url)
        );
      }
      
      // Add debug logging
      console.log('Authenticated user:', payload);
      
      // User is authenticated and role is still valid, allow access
      const response = NextResponse.next();
      
      // Pass the role to the request headers for potential use in API routes
      response.headers.set('x-user-role', payload.role);
      
      return response;
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Middleware auth error:', error);
      const response = NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};