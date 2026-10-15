import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageSalaries } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const updateSalarySchema = z.object({
  status: z.enum(['pending', 'paid']).optional(),
  payment_method: z.enum(['efectivo', 'transferencia', 'cheque']).optional().nullable(),
  payment_date: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageSalaries(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { id } = await params;
  const existing = await sql`SELECT * FROM salaries WHERE id = ${id} AND business_id = ${session.businessId} LIMIT 1`;
  if (!existing[0]) return NextResponse.json({ error: 'Registro de sueldo no encontrado' }, { status: 404 });
  const current = existing[0] as any;

  try {
    const body = await request.json();
    const parsed = updateSalarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { status, payment_method, payment_date, notes } = parsed.data;
    const finalStatus = status || current.status;
    const finalMethod = payment_method !== undefined ? payment_method : current.payment_method;
    const finalDate = payment_date || (finalStatus === 'paid' ? new Date().toISOString().substring(0, 10) : current.payment_date);

    const updatedRows = await sql`
      UPDATE salaries
      SET status = ${finalStatus},
          payment_method = ${finalMethod},
          payment_date = ${finalDate},
          notes = ${notes !== undefined ? notes : current.notes},
          updated_at = NOW()
      WHERE id = ${id} AND business_id = ${session.businessId}
      RETURNING *
    `;

    // Si cambió de pending a paid, registrar el gasto operativo en 'sueldos'
    if (current.status !== 'paid' && finalStatus === 'paid') {
      const expenseTitle = `Pago de Sueldo: ${current.employee_name} (${current.period})`;
      await sql`
        INSERT INTO expenses (business_id, title, category, amount, expense_date, notes, created_by_id, created_by_name)
        VALUES (
          ${session.businessId},
          ${expenseTitle},
          'sueldos',
          ${current.total_amount},
          ${finalDate},
          ${notes || current.notes || null},
          ${session.userId},
          ${session.fullName || session.email}
        )
      `;
    }

    // Auditoría
    await logAudit({
      businessId: session.businessId,
      userId: session.userId,
      userName: session.fullName || session.email,
      userRole: session.role,
      action: 'SUELDO_PAGADO',
      details: `Sueldo marcado como pagado para "${current.employee_name}" por $${Number(current.total_amount).toLocaleString('es-AR')} (${finalMethod ? 'Método: ' + finalMethod : ''})`,
      amount: current.total_amount,
    });

    return NextResponse.json({ salary: updatedRows[0] });
  } catch (err) {
    console.error('[PATCH /api/salaries/[id]]', err);
    return NextResponse.json({ error: 'Error al actualizar sueldo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageSalaries(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { id } = await params;
  const existing = await sql`SELECT * FROM salaries WHERE id = ${id} AND business_id = ${session.businessId} LIMIT 1`;
  if (!existing[0]) return NextResponse.json({ error: 'Registro de sueldo no encontrado' }, { status: 404 });
  const current = existing[0] as any;

  await sql`DELETE FROM salaries WHERE id = ${id} AND business_id = ${session.businessId}`;

  await logAudit({
    businessId: session.businessId,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'SUELDO_ELIMINADO',
    details: `Liquidación de sueldo eliminada: "${current.employee_name}" (${current.period}) por $${Number(current.total_amount).toLocaleString('es-AR')}`,
    amount: current.total_amount,
  });

  return NextResponse.json({ message: 'Sueldo eliminado' });
}
