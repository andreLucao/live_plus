import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB, getTenantDatabases } from '@/lib/mongodb';
import { getUserModel } from '@/lib/models/User';

const EMAIL_SECRET = process.env.EMAIL_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get all tenant databases
    const tenantDatabases = await getTenantDatabases();
    console.log('Found tenant databases:', tenantDatabases);

    if (!tenantDatabases || tenantDatabases.length === 0) {
      return NextResponse.json(
        { error: 'No tenant databases found' },
        { status: 404 }
      );
    }

    // Check each tenant database for the user
    const tenantsWithUser = [];
    
    for (const tenant of tenantDatabases) {
      try {
        const tenantConnection = await connectDB(tenant);
        const User = getUserModel(tenantConnection);
        
        const user = await User.findOne({ email });
        
        if (user) {
          tenantsWithUser.push(tenant);
        }
      } catch (error) {
        console.error(`Error checking tenant ${tenant}:`, error);
        // Continue with other tenants even if one fails
      }
    }

    console.log('Found user in tenants:', tenantsWithUser);

    if (tenantsWithUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found in any tenant' },
        { status: 404 }
      );
    }

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
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

    // Create login links for each tenant
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }

    // Generate HTML for login links
    let loginLinksHtml = '<ul style="list-style-type: none; padding: 0;">';
    
    for (const tenant of tenantsWithUser) {
      // Create a JWT token with both email and tenant
      const token = jwt.sign({ email, tenant }, EMAIL_SECRET, { expiresIn: '1h' });
      
      // Create login link
      const loginLink = `${baseUrl}/api/auth/verify?token=${token}&tenant=${encodeURIComponent(tenant)}`;
      
      loginLinksHtml += `
        <li style="margin-bottom: 15px;">
          <a href="${loginLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Login to ${tenant}
          </a>
        </li>
      `;
    }
    
    loginLinksHtml += '</ul>';

    // Send email with all login links
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Login to Your Accounts',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Login to Your Accounts</h1>
          <p style="margin-bottom: 20px;">We found your email in the following accounts. Click on the links below to login:</p>
          ${loginLinksHtml}
          <p style="color: #666; font-size: 14px;">These links will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request these login links, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      message: 'Email sent successfully',
      tenantsFound: tenantsWithUser.length
    });
  } catch (error) {
    console.error('Global login error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
} 