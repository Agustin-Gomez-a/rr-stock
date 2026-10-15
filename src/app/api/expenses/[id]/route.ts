import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageExpenses, canAccessBusiness } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageExpenses(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id } = await params;
  const existing = await sql`
    SELECT id, business_id, title, amount, category FROM expenses WHERE id = ${id} LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 });
  const expense = existing[0] as { id: string; business_id: string; title: string; amount: number; category: string };

  if (!canAccessBusiness(session, expense.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  await sql`DELETE FROM expenses WHERE id = ${id}`;

  await logAudit({
    businessId: expense.business_id,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'GASTO_ELIMINADO',
    details: `Gasto eliminado: "${expense.title}" por $${Number(expense.amount).toLocaleString('es-AR')}`,
    amount: Number(expense.amount),
  });

  return NextResponse.json({ message: 'Gasto eliminado correctamente' });
}
