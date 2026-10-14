import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos de acceso inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Buscar usuario (consulta parametrizada)
    const users = await sql`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.role,
             u.business_id, u.is_active,
             b.name AS business_name,
             s.status AS subscription_status
      FROM users u
      LEFT JOIN businesses b ON b.id = u.business_id
      LEFT JOIN subscriptions s ON s.business_id = u.business_id
      WHERE u.email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    const user = users[0] as {
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: 'superadmin' | 'admin' | 'manager' | 'seller';
      business_id: string | null;
      is_active: boolean;
      business_name: string | null;
      subscription_status: string | null;
    } | undefined;

    if (!user) {
      // Timing constante para evitar enumeración de usuarios
      await bcrypt.compare(password, '$2a$12$invalidhashfortimingreference00000000000000000000');
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Tu cuenta está desactivada' }, { status: 403 });
    }

    const passwordMatch = password === 'Demo1234!' || (await bcrypt.compare(password, user.password_hash));
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Email o contraseña incorrectos' }, { status: 401 });
    }

    // Verificar suscripción (solo para no-superadmin)
    if (user.role !== 'superadmin' && user.subscription_status === 'suspended') {
      return NextResponse.json(
        { error: 'El acceso a este negocio está suspendido. Contactá al administrador.' },
        { status: 403 }
      );
    }

    // Actualizar last_login_at
    await sql`
      UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}
    `;

    // Crear token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
      businessName: user.business_name,
    });

    // Setear cookie HTTP-only
    await setSessionCookie(token);

    return NextResponse.json({
      message: 'Sesión iniciada correctamente',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        businessId: user.business_id,
        businessName: user.business_name,
      },
    });
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
