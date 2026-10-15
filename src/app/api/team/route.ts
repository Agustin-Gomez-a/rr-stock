import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageTeam } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { ROLE_LABELS } from '@/lib/utils';

const createMemberSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  email: z.string().email('Email inválido'),
  password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres'),
  role: z.enum(['seller', 'cashier', 'admin', 'vendedor', 'cajero']),
});

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const users = await sql`
    SELECT id, business_id, email, full_name, role, is_active, last_login_at, created_at
    FROM users
    WHERE business_id = ${session.businessId}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(session)) return NextResponse.json({ error: 'Sin permisos para gestionar equipo' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { full_name, email, password } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const role = (parsed.data.role === 'vendedor' ? 'seller' : parsed.data.role === 'cajero' ? 'cashier' : parsed.data.role) as 'seller' | 'cashier' | 'admin';

    // Comprobar email duplicado
    const existing = await sql`
      SELECT id FROM users WHERE email = ${cleanEmail} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya se encuentra registrado' }, { status: 400 });
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    const userRows = await sql`
      INSERT INTO users (business_id, email, password_hash, full_name, role, is_active)
      VALUES (${session.businessId}, ${cleanEmail}, ${password_hash}, ${full_name}, ${role}, true)
      RETURNING id, business_id, email, full_name, role, is_active, created_at
    `;

    const newUser = userRows[0];

    // Registrar en Monitoreo
    await logAudit({
      businessId: session.businessId,
      userId: session.userId,
      userName: session.fullName || session.email,
      userRole: session.role,
      action: 'USUARIO_CREADO',
      details: `Nuevo miembro incorporado: "${full_name}" (${cleanEmail}) con rol de ${ROLE_LABELS[role]}`,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/team]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
