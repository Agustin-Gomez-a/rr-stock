import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const saleItemSchema = z.object({
  product_id: z.string().uuid().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unit_price: z.number().min(0),
});

const saleSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().max(500).nullable().optional(),
  sale_date: z.string(),
  items: z.array(saleItemSchema).min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!['admin', 'manager', 'seller'].includes(session.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const body = await request.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const total = d.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  // Verificar stock disponible para todos los productos
  for (const item of d.items) {
    if (item.product_id) {
      const rows = await sql`
        SELECT quantity, business_id, name
        FROM products
        WHERE id = ${item.product_id}
          AND business_id = ${businessId}
          AND is_active = TRUE
        LIMIT 1
      `;
      const prod = rows[0] as { quantity: number; business_id: string; name: string } | undefined;
      if (!prod) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.sku}` }, { status: 404 });
      }
      if (prod.quantity < item.quantity) {
        return NextResponse.json({
          error: `Stock insuficiente para "${prod.name}". Disponible: ${prod.quantity}, requerido: ${item.quantity}`,
        }, { status: 400 });
      }
    }
  }

  // Insertar venta y descontar stock en transacción
  const saleRows = await sql`
    INSERT INTO sales (business_id, customer_id, seller_id, status, total, notes, sale_date)
    VALUES (
      ${businessId},
      ${d.customer_id ?? null},
      ${session.userId},
      ${d.status},
      ${total},
      ${d.notes ?? null},
      ${d.sale_date}
    )
    RETURNING id, business_id, customer_id, seller_id, status, total::float, notes, sale_date, created_at, updated_at
  `;

  const sale = saleRows[0] as { id: string; [key: string]: unknown };

  // Insertar líneas y descontar stock atómicamente
  for (const item of d.items) {
    await sql`
      INSERT INTO sale_items (sale_id, product_id, sku, name, quantity, unit_price)
      VALUES (${sale.id}, ${item.product_id ?? null}, ${item.sku}, ${item.name}, ${item.quantity}, ${item.unit_price})
    `;

    if (item.product_id) {
      await sql`
        UPDATE products
        SET quantity = quantity - ${item.quantity}
        WHERE id = ${item.product_id}
          AND business_id = ${businessId}
          AND quantity >= ${item.quantity}
      `;
    }
  }

  // Recuperar nombre de cliente para la respuesta
  let customerName: string | null = null;
  if (d.customer_id) {
    const rows = await sql`SELECT name FROM customers WHERE id = ${d.customer_id} LIMIT 1`;
    customerName = (rows[0] as { name: string } | undefined)?.name ?? null;
  }

  return NextResponse.json({
    sale: { ...sale, customer_name: customerName, seller_name: null },
  }, { status: 201 });
}

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const sales = await sql`
    SELECT s.id, s.total::float, s.status, s.sale_date, s.created_at,
           c.name AS customer_name, u.full_name AS seller_name
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
    LEFT JOIN users u ON u.id = s.seller_id
    WHERE s.business_id = ${session.businessId}
    ORDER BY s.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ sales });
}
