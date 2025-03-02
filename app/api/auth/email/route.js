// File: app/api/auth/email/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const EMAIL_SECRET = process.env.EMAIL_SECRET || 'your-secret-key';

export async function POST(request) {
  // Debug: Log environment variables
  console.log('Environment variables:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    fromEmail: process.env.SMTP_FROM_EMAIL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  try {
    const { email, tenant } = await request.json();
    
    // Validate required fields
    if (!email || !tenant) {
      return NextResponse.json(
        { error: 'Email and tenant are required' },
        { status: 400 }
      );
    }

    // Verify tenant exists before sending email
    try {
      // Ensure proper URL construction without double slashes
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ''); // Remove trailing slash if present
      const verifyUrl = `${baseUrl}/api/tenants/verify/${tenant}`;
      
      console.log('Verifying tenant at URL:', verifyUrl);
      
      const verifyResponse = await fetch(verifyUrl);
      
      if (!verifyResponse.ok) {
        return NextResponse.json(
          { error: 'Invalid tenant' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Tenant verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify tenant', details: error.message },
        { status: 500 }
      );
    }

    // Create a JWT token with both email and tenant
    const token = jwt.sign({ email, tenant }, EMAIL_SECRET, { expiresIn: '1h' });
    
    // Add debug logging
    console.log('Login attempt:', { email, token: token.substring(0, 10) + '...', tenant });
    
    // Create login link with encoded tenant parameter
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}&tenant=${encodeURIComponent(tenant)}`;

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      requireTLS: true,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP Verification Error:', verifyError);
      throw verifyError;
    }

    // Send email
    await transporter.sendMail({
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
    });

    return NextResponse.json({ 
      message: 'Email sent successfully',
      debug: { email, tenant } // Include debug info in development
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}