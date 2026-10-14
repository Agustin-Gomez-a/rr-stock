import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const updateUserSchema = z.object({
  full_name: z.string().min(1).max(150).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'manager', 'seller']).optional(),
  is_active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { full_name, email, password, role, is_active } = parsed.data;

  // Si cambia email, verificar duplicado
  if (email) {
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} AND id != ${id} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }
  }

  let password_hash: string | null = null;
  if (password && password.trim().length >= 6) {
    password_hash = await bcrypt.hash(password, 10);
  }

  const updatedRows = await sql`
    UPDATE users
    SET full_name = COALESCE(${full_name ?? null}, full_name),
        email = COALESCE(${email ? email.toLowerCase().trim() : null}, email),
        role = COALESCE(${role ?? null}, role),
        is_active = COALESCE(${is_active ?? null}, is_active),
        password_hash = COALESCE(${password_hash}, password_hash),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, email, full_name, role, is_active, created_at, business_id
  `;

  if (updatedRows.length === 0) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const u = updatedRows[0];
  let business_name: string | null = null;
  if (u.business_id) {
    const b = await sql`SELECT name FROM businesses WHERE id = ${u.business_id} LIMIT 1`;
    business_name = b[0]?.name ?? null;
  }

  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      business_name,
    },
    success: true,
  });
}
