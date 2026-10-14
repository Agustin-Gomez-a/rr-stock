import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const createUserSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido').max(150),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'seller']),
  business_id: z.string().uuid('ID de negocio inválido'),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { full_name, email, password, role, business_id } = parsed.data;

  // Comprobar email duplicado
  const existing = await sql`
    SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'El email ya se encuentra registrado' }, { status: 400 });
  }

  // Hash contraseña
  const password_hash = await bcrypt.hash(password, 10);

  const userRows = await sql`
    INSERT INTO users (business_id, email, password_hash, full_name, role, is_active)
    VALUES (${business_id}, ${email.toLowerCase().trim()}, ${password_hash}, ${full_name}, ${role}, true)
    RETURNING id, email, full_name, role, is_active, created_at, business_id
  `;

  const newUser = userRows[0];

  const businessRow = await sql`
    SELECT name FROM businesses WHERE id = ${business_id} LIMIT 1
  `;

  return NextResponse.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      is_active: newUser.is_active,
      created_at: newUser.created_at,
      business_name: businessRow[0]?.name ?? null,
    },
  }, { status: 201 });
}
