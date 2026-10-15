import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageSalaries } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const salarySchema = z.object({
  user_id: z.string().optional().nullable(),
  employee_name: z.string().min(2, 'El nombre del empleado es requerido').max(150),
  employee_role: z.string().min(2, 'El puesto o rol es requerido').max(100),
  period: z.string().min(4, 'El período es requerido (ej: 2026-10)'),
  base_amount: z.number().min(0, 'El sueldo básico debe ser igual o mayor a 0'),
  bonus_amount: z.number().min(0).default(0),
  deductions_amount: z.number().min(0).default(0),
  status: z.enum(['pending', 'paid']).default('pending'),
  payment_date: z.string().optional().nullable(),
  payment_method: z.enum(['efectivo', 'transferencia', 'cheque']).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageSalaries(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period');

  const salaries = await sql`
    SELECT id, business_id, user_id, employee_name, employee_role, period,
           base_amount::float, bonus_amount::float, deductions_amount::float, total_amount::float,
           status, payment_date, payment_method, notes, created_at, updated_at
    FROM salaries
    WHERE business_id = ${session.businessId}
    ORDER BY period DESC, created_at DESC
  `;

  const list = (salaries as any[]) || [];
  const filtered = period ? list.filter((s) => s.period === period) : list;

  const currentPeriod = new Date().toISOString().substring(0, 7);
  const currentMonthSalaries = list.filter((s) => s.period === currentPeriod);

  const totalPaidMonth = currentMonthSalaries
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  const totalPendingMonth = currentMonthSalaries
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  return NextResponse.json({
    salaries: filtered,
    totalPaidMonth,
    totalPendingMonth,
    count: filtered.length,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageSalaries(session)) return NextResponse.json({ error: 'Sin permisos para liquidar sueldos' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = salarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const {
      user_id,
      employee_name,
      employee_role,
      period,
      base_amount,
      bonus_amount = 0,
      deductions_amount = 0,
      status,
      payment_date,
      payment_method,
      notes,
    } = parsed.data;

    const total_amount = base_amount + bonus_amount - deductions_amount;
    const finalPaymentDate = status === 'paid' ? payment_date || new Date().toISOString().substring(0, 10) : null;

    const rows = await sql`
      INSERT INTO salaries (
        business_id, user_id, employee_name, employee_role, period,
        base_amount, bonus_amount, deductions_amount, total_amount,
        status, payment_date, payment_method, notes
      ) VALUES (
        ${session.businessId}, ${user_id ?? null}, ${employee_name}, ${employee_role}, ${period},
        ${base_amount}, ${bonus_amount}, ${deductions_amount}, ${total_amount},
        ${status}, ${finalPaymentDate}, ${payment_method ?? null}, ${notes ?? null}
      )
      RETURNING *
    `;

    const newSalary = rows[0] as any;

    // Si se cargó directamente como pagado, registrar el gasto operativo en 'sueldos'
    if (status === 'paid') {
      const expenseTitle = `Pago de Sueldo: ${employee_name} (${period})`;
      await sql`
        INSERT INTO expenses (business_id, title, category, amount, expense_date, notes, created_by_id, created_by_name)
        VALUES (
          ${session.businessId},
          ${expenseTitle},
          'sueldos',
          ${total_amount},
          ${finalPaymentDate},
          ${notes ?? null},
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
      action: status === 'paid' ? 'SUELDO_PAGADO' : 'SUELDO_REGISTRADO',
      details: `Liquidación de ${status === 'paid' ? 'pago de sueldo' : 'sueldo'} para "${employee_name}" (${employee_role}) por $${Number(total_amount).toLocaleString('es-AR')} [Período: ${period}]`,
      amount: total_amount,
    });

    return NextResponse.json({ salary: newSalary }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/salaries]', error);
    return NextResponse.json({ error: 'Error al registrar sueldo' }, { status: 500 });
  }
}
