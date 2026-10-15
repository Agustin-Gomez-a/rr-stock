import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canEditProduct, canDeleteProduct, canAccessBusiness } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const updateSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  min_stock: z.number().int().min(0).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const rows = await sql`
    SELECT id, business_id, sku, name, description, category, supplier,
           price::float, cost::float, quantity, min_stock, is_active, created_at, updated_at
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  const prod = rows[0] as { business_id: string };

  if (!canAccessBusiness(session, prod.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  return NextResponse.json(rows[0]);
}

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canEditProduct(session)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });

  const { id } = await params;

  // Verificar que el producto pertenece al negocio del usuario
  const existing = await sql`
    SELECT id, business_id, quantity, name, sku FROM products WHERE id = ${id} LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  const currentProd = existing[0] as { id: string; business_id: string; quantity: number; name: string; sku: string };

  if (!canAccessBusiness(session, currentProd.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const d = parsed.data;

  // Al vendedor no se le permite bajar stock
  if (session.role === 'seller' && d.quantity !== undefined && d.quantity < currentProd.quantity) {
    return NextResponse.json({
      error: 'Como vendedor no podés reducir stock de productos existentes, solo cargar stock adicional.',
    }, { status: 403 });
  }

  const rows = await sql`
    UPDATE products SET
      sku = COALESCE(${d.sku ?? null}, sku),
      name = COALESCE(${d.name ?? null}, name),
      description = COALESCE(${d.description ?? null}, description),
      category = COALESCE(${d.category ?? null}, category),
      supplier = COALESCE(${d.supplier ?? null}, supplier),
      price = COALESCE(${d.price ?? null}, price),
      cost = COALESCE(${d.cost ?? null}, cost),
      quantity = COALESCE(${d.quantity ?? null}, quantity),
      min_stock = COALESCE(${d.min_stock ?? null}, min_stock)
    WHERE id = ${id}
    RETURNING id, business_id, sku, name, description, category, supplier,
              price::float, cost::float, quantity, min_stock, is_active, created_at, updated_at
  `;

  await logAudit({
    businessId: currentProd.business_id,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'PRODUCTO_EDITADO',
    details: `Producto "${d.name ?? currentProd.name}" [${d.sku ?? currentProd.sku}] modificado`,
  });

  return NextResponse.json({ product: rows[0] });
}

export async function DELETE(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canDeleteProduct(session)) {
    return NextResponse.json({
      error: 'Permiso denegado: Solo los administradores pueden eliminar repuestos del catálogo.',
    }, { status: 403 });
  }

  const { id } = await params;
  const existing = await sql`SELECT business_id, name, sku FROM products WHERE id = ${id} LIMIT 1`;
  if (!existing[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  const prod = existing[0] as { business_id: string; name: string; sku: string };

  if (!canAccessBusiness(session, prod.business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  // Soft delete
  await sql`UPDATE products SET is_active = FALSE WHERE id = ${id}`;

  await logAudit({
    businessId: prod.business_id,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: 'PRODUCTO_ELIMINADO',
    details: `Repuesto eliminado del catálogo: "${prod.name}" [${prod.sku}]`,
  });

  return NextResponse.json({ message: 'Producto desactivado' });
}
