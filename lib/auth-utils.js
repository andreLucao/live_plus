// lib/auth-utils.js
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const ROLE_EXPIRY_TIME = 60; // 1 minute for expiring role

export async function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const sessionToken = await new SignJWT({ 
    email: user.email,
    userId: user.userId || user._id.toString(),
    tenantPath: user.tenantPath,
    role: user.role,
    roleExpiry: now + ROLE_EXPIRY_TIME, // Role expires in 1 minute
    authenticated: true 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d') // Full token expires in 7 days
    .sign(secret);

  return sessionToken;
}