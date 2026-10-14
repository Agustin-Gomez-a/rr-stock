import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canAccessBusiness } from '@/lib/permissions';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const quote = await sql`
    SELECT id, business_id FROM quotes WHERE id = ${id} LIMIT 1
  `;
  if (!quote[0]) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!canAccessBusiness(session, (quote[0] as { business_id: string }).business_id)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const items = await sql`
    SELECT id, product_id, sku, name, quantity, unit_price::float, subtotal::float
    FROM quote_items
    WHERE quote_id = ${id}
    ORDER BY rowid ASC
  `;

  return NextResponse.json({ items });
}
