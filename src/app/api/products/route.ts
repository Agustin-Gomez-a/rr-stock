import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageProducts } from '@/lib/permissions';

const productSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  price: z.number().min(0),
  cost: z.number().min(0),
  quantity: z.number().int().min(0),
  min_stock: z.number().int().min(0),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('q') || '';

  const products = await sql`
    SELECT id, sku, name, description, category, supplier,
           price::float, cost::float, quantity, min_stock, is_active, created_at
    FROM products
    WHERE business_id = ${businessId}
      AND is_active = TRUE
      AND (
        ${search} = ''
        OR name ILIKE ${'%' + search + '%'}
        OR sku ILIKE ${'%' + search + '%'}
      )
    ORDER BY name ASC
    LIMIT 100
  `;

  return NextResponse.json({ products });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageProducts(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const rows = await sql`
      INSERT INTO products (business_id, sku, name, description, category, supplier, price, cost, quantity, min_stock)
      VALUES (${businessId}, ${d.sku}, ${d.name}, ${d.description ?? null}, ${d.category ?? null},
              ${d.supplier ?? null}, ${d.price}, ${d.cost}, ${d.quantity}, ${d.min_stock})
      RETURNING id, business_id, sku, name, description, category, supplier,
                price::float, cost::float, quantity, min_stock, is_active, created_at, updated_at
    `;

    return NextResponse.json({ product: rows[0] }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg.includes('uq_product_sku')) {
      return NextResponse.json({ error: 'Ya existe un producto con ese SKU' }, { status: 409 });
    }
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
