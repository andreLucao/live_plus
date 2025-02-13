import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export async function middleware(request) {
  // Extract tenant from hostname (e.g., tenant.domain.com)
  const hostname = request.headers.get('host');
  const tenant = hostname.split('.')[0];
  console.log(tenant);

  // First verify if tenant exists
  if (tenant) {
    try {
      const verifyResponse = await fetch(`${request.nextUrl.origin}/api/tenants/verify/${tenant}`);
      
      if (!verifyResponse.ok) {
        // Tenant doesn't exist, redirect to main site or error page
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Tenant verification error:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Check if the route should be protected
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/financeiro')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // Verify the token using jose
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      
      // Check role restrictions for /financeiro
      if (request.nextUrl.pathname.startsWith('/financeiro')) {
        const userRole = payload.role;
        if (userRole !== 'owner' && userRole !== 'admin') {
          // Redirect unauthorized users to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // Add debug logging
      console.log('Authenticated user:', payload);
      return NextResponse.next();
    } catch (error) {
      // Invalid token, redirect to login
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/financeiro/:path*']
}; 