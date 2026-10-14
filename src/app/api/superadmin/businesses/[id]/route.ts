import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(100).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { name, slug } = parsed.data;

  if (slug) {
    const existing = await sql`
      SELECT id FROM businesses WHERE slug = ${slug} AND id != ${id} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 400 });
    }
  }

  const updatedRows = await sql`
    UPDATE businesses
    SET name = COALESCE(${name ?? null}, name),
        slug = COALESCE(${slug ?? null}, slug),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, name, slug, created_at
  `;

  if (updatedRows.length === 0) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
  }

  const business = updatedRows[0];

  const sub = await sql`
    SELECT type, status, amount::float, expires_at, last_payment_at
    FROM subscriptions WHERE business_id = ${id} LIMIT 1
  `;

  const counts = await sql`
    SELECT COUNT(*)::int as count FROM users WHERE business_id = ${id}
  `;

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      created_at: business.created_at,
      sub_type: sub[0]?.type ?? null,
      sub_status: sub[0]?.status ?? null,
      sub_amount: sub[0]?.amount ?? null,
      sub_expires_at: sub[0]?.expires_at ?? null,
      sub_last_payment: sub[0]?.last_payment_at ?? null,
      user_count: counts[0]?.count ?? 0,
    },
  });
}
