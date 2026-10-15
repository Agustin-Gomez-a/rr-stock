import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

// El único campo obligatorio es el nombre y apellido. Todo lo demás es 100% opcional y flexible.
const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre y apellido es obligatorio')
    .max(200, 'El nombre no puede superar los 200 caracteres'),
  email: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  address: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  tax_id: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const customers = await sql`
    SELECT id, name, email, phone, address, tax_id, notes, created_at
    FROM customers
    WHERE business_id = ${session.businessId}
    ORDER BY name ASC
  `;

  return NextResponse.json({ customers });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['admin', 'manager', 'seller', 'cashier'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: msg, details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const rows = await sql`
      INSERT INTO customers (business_id, name, email, phone, address, tax_id, notes)
      VALUES (${session.businessId}, ${d.name},
              ${d.email || null}, ${d.phone || null},
              ${d.address || null}, ${d.tax_id || null}, ${d.notes || null})
      RETURNING *
    `;

    await logAudit({
      businessId: session.businessId,
      userId: session.userId,
      userName: session.fullName || session.email,
      userRole: session.role,
      action: 'CLIENTE_CREADO',
      details: `Nuevo cliente registrado: "${d.name}" ${d.phone ? '(' + d.phone + ')' : ''}`.trim(),
    });

    return NextResponse.json({ customer: rows[0] }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/customers]', err);
    return NextResponse.json({ error: err.message || 'Error al guardar cliente' }, { status: 500 });
  }
}
