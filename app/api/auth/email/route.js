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
    const { email } = await request.json();
    
    // Create a JWT token
    const token = jwt.sign({ email }, EMAIL_SECRET, { expiresIn: '1h' });
    
    // Add debug logging
    console.log('Login attempt:', { email, token });
    
    // Create login link
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

    // Configure nodemailer with updated settings
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
      `,
    });

    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}