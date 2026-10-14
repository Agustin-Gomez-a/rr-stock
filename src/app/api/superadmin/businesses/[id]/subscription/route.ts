import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';

const updateSubSchema = z.object({
  type: z.enum(['monthly', 'fixed']).optional(),
  status: z.enum(['active', 'suspended', 'expired']).optional(),
  amount: z.number().min(0).optional(),
  expires_at: z.string().nullable().optional(),
  last_payment_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues?.[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { type, status, amount, expires_at, last_payment_at, notes } = parsed.data;

  // Verificar si ya tiene fila en subscriptions
  const existing = await sql`SELECT id FROM subscriptions WHERE business_id = ${id} LIMIT 1`;

  if (existing.length === 0) {
    await sql`
      INSERT INTO subscriptions (business_id, type, status, amount, expires_at, last_payment_at, notes)
      VALUES (
        ${id},
        ${type ?? 'monthly'},
        ${status ?? 'active'},
        ${amount ?? 0},
        ${expires_at ? expires_at : null},
        ${last_payment_at ? last_payment_at : null},
        ${notes ?? null}
      )
    `;
  } else {
    await sql`
      UPDATE subscriptions
      SET type = COALESCE(${type ?? null}, type),
          status = COALESCE(${status ?? null}, status),
          amount = COALESCE(${amount ?? null}, amount),
          expires_at = ${expires_at !== undefined ? (expires_at ? expires_at : null) : sql.unsafe('expires_at')},
          last_payment_at = ${last_payment_at !== undefined ? (last_payment_at ? last_payment_at : null) : sql.unsafe('last_payment_at')},
          notes = COALESCE(${notes ?? null}, notes),
          updated_at = NOW()
      WHERE business_id = ${id}
    `;
  }

  const sub = await sql`
    SELECT type, status, amount::float, expires_at, last_payment_at
    FROM subscriptions WHERE business_id = ${id} LIMIT 1
  `;

  return NextResponse.json({
    subscription: sub[0],
    success: true,
  });
}
