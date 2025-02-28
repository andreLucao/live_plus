import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

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
      
      // Add debug logging
      console.log('Authenticated user:', payload);
      
      // User is authenticated, allow access
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL(`/${tenant}/login`, request.url));
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