import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canManageProducts, canAccessBusiness } from '@/lib/permissions';

const stockSchema = z.object({
  adjustment: z.number().int().refine((n) => n !== 0, { message: 'El ajuste no puede ser cero' }),
  reason: z.string().max(300).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canManageProducts(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id } = await params;

  const body = await request.json();
  const parsed = stockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { adjustment } = parsed.data;

  // Transacción atómica para actualizar stock
  const rows = await sql`
    UPDATE products
    SET quantity = quantity + ${adjustment}
    WHERE id = ${id}
      AND business_id = ${session.businessId!}
      AND quantity + ${adjustment} >= 0
    RETURNING id, business_id, sku, name, description, category, supplier,
              price::float, cost::float, quantity, min_stock, is_active, created_at, updated_at
  `;

  if (!rows[0]) {
    // Verificar si es por negocio o por stock negativo
    const existing = await sql`SELECT quantity, business_id FROM products WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    const prod = existing[0] as { quantity: number; business_id: string };
    if (!canAccessBusiness(session, prod.business_id)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }
    return NextResponse.json({ error: 'El stock no puede quedar negativo' }, { status: 400 });
  }

  return NextResponse.json({ product: rows[0] });
}
