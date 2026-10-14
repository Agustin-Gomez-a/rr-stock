import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canAccessBusiness } from '@/lib/permissions';

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(300).optional(),
  tax_id: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['admin', 'manager'].includes(session.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id } = await params;
  const existing = await sql`SELECT business_id FROM customers WHERE id = ${id} LIMIT 1`;
  if (!existing[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canAccessBusiness(session, (existing[0] as { business_id: string }).business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const d = parsed.data;
  const rows = await sql`
    UPDATE customers SET
      name = COALESCE(${d.name ?? null}, name),
      email = COALESCE(${d.email || null}, email),
      phone = COALESCE(${d.phone || null}, phone),
      address = COALESCE(${d.address || null}, address),
      tax_id = COALESCE(${d.tax_id || null}, tax_id),
      notes = COALESCE(${d.notes || null}, notes)
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json({ customer: rows[0] });
}
