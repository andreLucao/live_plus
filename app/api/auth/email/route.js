// File: app/api/auth/email/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const EMAIL_SECRET = process.env.EMAIL_SECRET || 'your-secret-key';

// Create transporter once at module level instead of in each request
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // Auto-detect secure based on port
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  pool: true, // Use connection pooling
  maxConnections: 5, // Limit concurrent connections
  rateDelta: 1000, // Define minimum time between messages
  rateLimit: 5, // Max messages per rateDelta
  // Only use tls settings if needed
  ...(process.env.SMTP_DISABLE_TLS_CHECK ? {
    tls: {
      rejectUnauthorized: false
    }
  } : {})
});

// Verify connection at startup rather than each request
(async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully at startup');
  } catch (error) {
    console.error('SMTP Verification Error at startup:', error);
  }
})();

export async function POST(request) {
  try {
    const { email, tenant } = await request.json();
    
    // Validate required fields
    if (!email || !tenant) {
      return NextResponse.json(
        { error: 'Email and tenant are required' },
        { status: 400 }
      );
    }

    // Store base URL outside of the verification block to avoid redundant calculations
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // Verify tenant in parallel with token creation
    const tenantPromise = verifyTenant(baseUrl, tenant);
    
    // Create a JWT token while tenant is being verified
    const token = jwt.sign({ email, tenant }, EMAIL_SECRET, { expiresIn: '1h' });
    const loginLink = `${baseUrl}/api/auth/verify?token=${token}&tenant=${encodeURIComponent(tenant)}`;

    // Wait for tenant verification to complete
    try {
      await tenantPromise;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid tenant or verification failed', details: error.message },
        { status: 400 }
      );
    }

    // Send email without waiting for delivery confirmation
    const emailPromise = transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Login to Your Platform',
      html: `
        <h1>Login to Your Platform</h1>
        <p>Click the link below to login:</p>
        <a href="${loginLink}">Login Now</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this login link, please ignore this email.</p>
      `,
      // Add priority headers
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    // Return response immediately without waiting for email to be sent
    const response = NextResponse.json({ 
      message: 'Email sending initiated',
      debug: { email, tenant } 
    });

    // Log completion in background (don't block response)
    emailPromise.then(() => {
      console.log('Email sent successfully to:', email);
    }).catch(error => {
      console.error('Failed to send email:', error);
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to process login request', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to verify tenant
async function verifyTenant(baseUrl, tenant) {
  const verifyUrl = `${baseUrl}/api/tenants/verify/${tenant}`;
  
  console.log('Verifying tenant at URL:', verifyUrl);
  
  const verifyResponse = await fetch(verifyUrl, {
    signal: AbortSignal.timeout(5000) // 5 second timeout
  });
  
  if (!verifyResponse.ok) {
    throw new Error(`Tenant verification failed with status: ${verifyResponse.status}`);
  }
  
  return true;
}