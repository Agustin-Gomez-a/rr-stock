import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

const quoteItemSchema = z.object({
  product_id: z.string().min(1).optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().max(100).optional().nullable(),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
});

const quoteSchema = z.object({
  customer_id: z.string().min(1).nullable().optional(),
  vehicle_info: z.string().max(200).nullable().optional(),
  vin: z.string().max(50).nullable().optional(),
  vat_rate: z.number().min(0).max(100).default(21),
  notes: z.string().max(1000).nullable().optional(),
  valid_until: z.string().nullable().optional(),
  items: z.array(quoteItemSchema).min(1),
});

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const quotes = await sql`
    SELECT q.id, q.quote_number, q.status, q.vehicle_info, q.vin,
           q.subtotal::float, q.vat_rate::float, q.vat_amount::float, q.total::float,
           q.notes, q.valid_until, q.created_at, q.updated_at,
           c.name AS customer_name
    FROM quotes q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.business_id = ${session.businessId}
    ORDER BY q.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ quotes });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const subtotal = d.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vatAmount = subtotal * (d.vat_rate / 100);
  const total = subtotal + vatAmount;

  // Número correlativo por negocio
  const countRows = await sql`
    SELECT COUNT(*)::int AS count FROM quotes WHERE business_id = ${businessId}
  `;
  const count = (countRows[0] as { count: number }).count;
  const quoteNumber = `P-${String(count + 1).padStart(5, '0')}`;

  // Obtener template
  const templates = await sql`
    SELECT id FROM quote_templates WHERE business_id = ${businessId} LIMIT 1
  `;
  const templateId = (templates[0] as { id: string } | undefined)?.id ?? null;

  const quoteRows = await sql`
    INSERT INTO quotes (business_id, customer_id, template_id, quote_number, status,
                        vehicle_info, vin, subtotal, vat_rate, vat_amount, total, notes, valid_until)
    VALUES (${businessId}, ${d.customer_id ?? null}, ${templateId}, ${quoteNumber}, 'draft',
            ${d.vehicle_info ?? null}, ${d.vin ?? null}, ${subtotal}, ${d.vat_rate},
            ${vatAmount}, ${total}, ${d.notes ?? null}, ${d.valid_until ?? null})
    RETURNING id, quote_number, status, vehicle_info, vin,
              subtotal::float, vat_rate::float, vat_amount::float, total::float,
              notes, valid_until, created_at, updated_at, customer_id
  `;

  const quote = quoteRows[0] as { id: string; [key: string]: unknown };

  // Insertar ítems
  for (const item of d.items) {
    await sql`
      INSERT INTO quote_items (quote_id, product_id, sku, name, quantity, unit_price)
      VALUES (${quote.id}, ${item.product_id ?? null}, ${item.sku}, ${item.name}, ${item.quantity}, ${item.unit_price})
    `;
  }

  let customerName: string | null = null;
  if (d.customer_id) {
    const rows = await sql`SELECT name FROM customers WHERE id = ${d.customer_id} LIMIT 1`;
    customerName = (rows[0] as { name: string } | undefined)?.name ?? null;
  }

  await logAudit({
    businessId,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'PRESUPUESTO_CREADO',
    details: `Presupuesto ${quoteNumber} creado para ${customerName ?? 'Consumidor'} (${d.items.length} ítems) por $${Number(total).toLocaleString('es-AR')}`,
    amount: Number(total),
  });

  return NextResponse.json({ quote: { ...quote, customer_name: customerName } }, { status: 201 });
}
