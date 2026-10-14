import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canAccessBusiness } from '@/lib/permissions';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const existing = await sql`
    SELECT id, business_id FROM quotes WHERE id = ${id} LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canAccessBusiness(session, (existing[0] as { business_id: string }).business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();

  // Actualización de estado simple
  if (body.status && Object.keys(body).length === 1) {
    const schema = z.object({ status: z.enum(['draft', 'sent', 'accepted', 'rejected']) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    const rows = await sql`
      UPDATE quotes SET status = ${parsed.data.status} WHERE id = ${id}
      RETURNING id, status, updated_at
    `;
    return NextResponse.json({ quote: rows[0] });
  }

  // Actualización completa
  const quoteItemSchema = z.object({
    product_id: z.string().uuid().optional(),
    sku: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    unit_price: z.number().min(0),
  });

  const schema = z.object({
    customer_id: z.string().uuid().nullable().optional(),
    vehicle_info: z.string().max(200).nullable().optional(),
    vin: z.string().max(50).nullable().optional(),
    vat_rate: z.number().min(0).max(100).optional(),
    notes: z.string().max(1000).nullable().optional(),
    valid_until: z.string().nullable().optional(),
    items: z.array(quoteItemSchema).min(1).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const d = parsed.data;
  let subtotal = 0;
  let vatAmount = 0;
  let total = 0;

  if (d.items) {
    subtotal = d.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    vatAmount = subtotal * ((d.vat_rate ?? 21) / 100);
    total = subtotal + vatAmount;
  }

  const rows = await sql`
    UPDATE quotes SET
      customer_id = COALESCE(${d.customer_id ?? null}, customer_id),
      vehicle_info = COALESCE(${d.vehicle_info ?? null}, vehicle_info),
      vin = COALESCE(${d.vin ?? null}, vin),
      vat_rate = COALESCE(${d.vat_rate ?? null}, vat_rate),
      notes = COALESCE(${d.notes ?? null}, notes),
      valid_until = COALESCE(${d.valid_until ?? null}, valid_until),
      subtotal = CASE WHEN ${d.items ? 1 : 0}::int = 1 THEN ${subtotal} ELSE subtotal END,
      vat_amount = CASE WHEN ${d.items ? 1 : 0}::int = 1 THEN ${vatAmount} ELSE vat_amount END,
      total = CASE WHEN ${d.items ? 1 : 0}::int = 1 THEN ${total} ELSE total END
    WHERE id = ${id}
    RETURNING id, quote_number, status, vehicle_info, vin,
              subtotal::float, vat_rate::float, vat_amount::float, total::float,
              notes, valid_until, created_at, updated_at, customer_id
  `;

  if (d.items) {
    await sql`DELETE FROM quote_items WHERE quote_id = ${id}`;
    for (const item of d.items) {
      await sql`
        INSERT INTO quote_items (quote_id, product_id, sku, name, quantity, unit_price)
        VALUES (${id}, ${item.product_id ?? null}, ${item.sku}, ${item.name}, ${item.quantity}, ${item.unit_price})
      `;
    }
  }

  return NextResponse.json({ quote: rows[0] });
}
