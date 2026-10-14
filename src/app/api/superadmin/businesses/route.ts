import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const createBusinessSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  slug: z.string().min(1, 'El slug es requerido').max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
  sub_type: z.enum(['monthly', 'fixed']).default('monthly'),
  sub_amount: z.number().min(0).default(0),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const rows = await sql`
    SELECT b.id, b.name, b.slug, b.created_at,
           s.type AS sub_type, s.status AS sub_status,
           s.amount::float AS sub_amount,
           s.expires_at AS sub_expires_at,
           s.last_payment_at AS sub_last_payment,
           (SELECT COUNT(*)::int FROM users u WHERE u.business_id = b.id) AS user_count
    FROM businesses b
    LEFT JOIN subscriptions s ON s.business_id = b.id
    ORDER BY b.created_at DESC
  `;

  return NextResponse.json({ businesses: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { name, slug, address, phone, tax_id, sub_type, sub_amount } = parsed.data;

  // Verificar si el slug ya existe
  const existing = await sql`SELECT id FROM businesses WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'El slug ya está registrado por otro negocio' }, { status: 400 });
  }

  const businessRows = await sql`
    INSERT INTO businesses (name, slug, address, phone, tax_id)
    VALUES (${name}, ${slug}, ${address || null}, ${phone || null}, ${tax_id || null})
    RETURNING id, name, slug, created_at
  `;
  const newBusiness = businessRows[0];

  const subRows = await sql`
    INSERT INTO subscriptions (business_id, type, status, amount, starts_at, expires_at)
    VALUES (
      ${newBusiness.id},
      ${sub_type},
      'active',
      ${sub_amount},
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days'
    )
    RETURNING type, status, amount::float, expires_at, last_payment_at
  `;
  const sub = subRows[0];

  // Crear plantilla inicial de presupuestos
  await sql`
    INSERT INTO quote_templates (business_id, title, vat_rate)
    VALUES (${newBusiness.id}, 'PRESUPUESTO', 21.00)
  `;

  return NextResponse.json({
    business: {
      id: newBusiness.id,
      name: newBusiness.name,
      slug: newBusiness.slug,
      created_at: newBusiness.created_at,
      sub_type: sub?.type ?? sub_type,
      sub_status: sub?.status ?? 'active',
      sub_amount: sub?.amount ?? sub_amount,
      sub_expires_at: sub?.expires_at ?? null,
      sub_last_payment: sub?.last_payment_at ?? null,
      user_count: 0,
    },
  }, { status: 201 });
}
