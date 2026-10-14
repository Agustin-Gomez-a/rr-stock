import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const customerSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  tax_id: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
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
  if (!['admin', 'manager'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const d = parsed.data;
  const rows = await sql`
    INSERT INTO customers (business_id, name, email, phone, address, tax_id, notes)
    VALUES (${session.businessId}, ${d.name},
            ${d.email || null}, ${d.phone || null},
            ${d.address || null}, ${d.tax_id || null}, ${d.notes || null})
    RETURNING *
  `;

  return NextResponse.json({ customer: rows[0] }, { status: 201 });
}
