import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageExpenses } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/utils';

const expenseSchema = z.object({
  title: z.string().min(2, 'El concepto es requerido').max(150),
  category: z.enum([
    'servicios',
    'insumos',
    'alquiler',
    'sueldos',
    'mantenimiento',
    'impuestos',
    'otros',
    'luz',
    'agua',
    'gas',
  ]),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  expense_date: z.string().optional().default(() => new Date().toISOString().substring(0, 10)),
  notes: z.string().max(500).optional(),
});

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageExpenses(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const expenses = await sql`
    SELECT id, business_id, title, category, amount::float, expense_date, notes,
           created_by_id, created_by_name, created_at, updated_at
    FROM expenses
    WHERE business_id = ${session.businessId}
    ORDER BY expense_date DESC, created_at DESC
  `;

  // Calcular totales del mes
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  const monthlyExpenses = (expenses as Array<{ amount: number; expense_date: string }>).filter(
    (e) => e.expense_date >= startOfMonth
  );
  const totalMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  return NextResponse.json({ expenses, totalMonth });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageExpenses(session)) return NextResponse.json({ error: 'Sin permisos para cargar gastos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { title, category, amount, expense_date, notes } = parsed.data;
    const finalCategory = (category === 'luz' || category === 'agua' || category === 'gas') ? 'servicios' : category;
    const finalDate = expense_date || new Date().toISOString().substring(0, 10);
    const creatorName = session.fullName || session.email;

    const rows = await sql`
      INSERT INTO expenses (business_id, title, category, amount, expense_date, notes, created_by_id, created_by_name)
      VALUES (
        ${session.businessId},
        ${title},
        ${finalCategory},
        ${amount},
        ${finalDate},
        ${notes ?? null},
        ${session.userId},
        ${creatorName}
      )
      RETURNING id, business_id, title, category, amount::float, expense_date, notes, created_by_id, created_by_name, created_at
    `;

    const newExp = rows[0] as { title: string; category: string; amount: number };

    // Registrar en Monitoreo
    await logAudit({
      businessId: session.businessId,
      userId: session.userId,
      userName: creatorName,
      userRole: session.role,
      action: 'GASTO_REGISTRADO',
      details: `Gasto operativo registrado: "${newExp.title}" (${EXPENSE_CATEGORY_LABELS[newExp.category] || newExp.category}) por $${newExp.amount.toLocaleString('es-AR')}`,
      amount: newExp.amount,
    });

    return NextResponse.json({ expense: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/expenses]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
