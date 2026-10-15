import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canAccessBusiness, canManageSales } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const patchSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled']),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageSales(session)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;
  const existing = await sql`
    SELECT id, business_id, status FROM sales WHERE id = ${id} LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
  const sale = existing[0] as { id: string; business_id: string; status: string };

  if (!canAccessBusiness(session, sale.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });

  const rows = await sql`
    UPDATE sales SET status = ${parsed.data.status}
    WHERE id = ${id}
    RETURNING id, status, total::float, sale_date, updated_at
  `;

  await logAudit({
    businessId: sale.business_id,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'VENTA_ESTADO',
    details: `Estado de la venta #${id} cambiado de "${sale.status}" a "${parsed.data.status}"`,
  });

  return NextResponse.json({ sale: rows[0] });
}

