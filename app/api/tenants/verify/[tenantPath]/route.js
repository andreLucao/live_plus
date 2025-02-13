import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    // Get the tenant path from the route parameter
    const { tenantPath } = params; // This will get 'prismma' from /api/tenant/verify/prismma
    
    if (!tenantPath) {
      return NextResponse.json(
        { error: 'Tenant path is required' },
        { status: 400 }
      );
    }

    // Check if database exists for this tenant
    const dbExists = await verifyDatabase(tenantPath);

    if (!dbExists) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      tenant: tenantPath 
    });
  } catch (error) {
    console.error('Database verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify database' },
      { status: 500 }
    );
  }
}