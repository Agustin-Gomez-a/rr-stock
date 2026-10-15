import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageTeam, canAccessBusiness } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const updateMemberSchema = z.object({
  is_active: z.boolean().optional(),
  password: z.string().min(4).optional(),
  role: z.enum(['seller', 'cashier', 'admin']).optional(),
  full_name: z.string().min(2).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageTeam(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id } = await params;

  // Evitar que el admin se desactive a sí mismo
  if (id === session.userId) {
    return NextResponse.json({ error: 'No podés modificar tu propia cuenta desde el panel de equipo' }, { status: 400 });
  }

  const existing = await sql`
    SELECT id, business_id, full_name, email, role, is_active FROM users WHERE id = ${id} LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  const user = existing[0] as {
    id: string;
    business_id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };

  if (!canAccessBusiness(session, user.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const d = parsed.data;
  let newPassHash: string | null = null;
  if (d.password) {
    newPassHash = await bcrypt.hash(d.password, 10);
  }

  const rows = await sql`
    UPDATE users SET
      is_active = COALESCE(${d.is_active ?? null}, is_active),
      role = COALESCE(${d.role ?? null}, role),
      full_name = COALESCE(${d.full_name ?? null}, full_name),
      password_hash = COALESCE(${newPassHash}, password_hash),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, business_id, email, full_name, role, is_active, updated_at
  `;

  await logAudit({
    businessId: user.business_id,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'USUARIO_ESTADO',
    details: `Modificación de usuario: "${user.full_name}" (${user.email}) ${d.is_active !== undefined ? (d.is_active ? 'activado' : 'desactivado') : ''}${d.password ? ' (contraseña restablecida)' : ''}`,
  });

  return NextResponse.json({ user: rows[0] });
}
