import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.AUTH_SECRET || 'repuesto_control_jwt_super_secret_key_default_32chars!';
const encodedKey = new TextEncoder().encode(secretKey);

import type { UserRole } from '@/types';

export interface SessionPayload {
  userId: string;
  email: string;
  fullName?: string;
  role: UserRole;
  businessId: string | null;
  businessName: string | null;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
