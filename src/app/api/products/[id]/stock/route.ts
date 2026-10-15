import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canLoadStock, canAccessBusiness } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

const stockSchema = z.object({
  adjustment: z.number().int().refine((n) => n !== 0, { message: 'El ajuste no puede ser cero' }),
  reason: z.string().max(300).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canLoadStock(session)) {
    return NextResponse.json({ error: 'Sin permisos para modificar stock' }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = stockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { adjustment, reason } = parsed.data;

  // Regla estricta: al vendedor NO se le permite borrar/disminuir stock, únicamente cargar stock
  if (session.role === 'seller' && adjustment < 0) {
    return NextResponse.json({
      error: 'Acceso denegado: Como vendedor únicamente podés cargar ingresos de stock (+), no disminuirlo ni borrarlo.',
    }, { status: 403 });
  }

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
    const existing = await sql`SELECT quantity, business_id FROM products WHERE id = ${id} LIMIT 1`;
    if (!existing[0]) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    const prod = existing[0] as { quantity: number; business_id: string };
    if (!canAccessBusiness(session, prod.business_id)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }
    return NextResponse.json({ error: 'El stock no puede quedar negativo' }, { status: 400 });
  }

  const updatedProd = rows[0] as { name: string; sku: string; quantity: number };

  // Registrar en Monitoreo
  await logAudit({
    businessId: session.businessId!,
    userId: session.userId,
    userName: session.fullName || session.email,
    userRole: session.role,
    action: adjustment > 0 ? 'STOCK_CARGADO' : 'STOCK_AJUSTADO',
    details: `${adjustment > 0 ? 'Carga de +' + adjustment : 'Ajuste de ' + adjustment} u. en "${updatedProd.name}" [${updatedProd.sku}]. Stock actual: ${updatedProd.quantity} u.${reason ? ' (Motivo: ' + reason + ')' : ''}`,
  });

  return NextResponse.json({ product: rows[0] });
}

