import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import SuperadminClient from './SuperadminClient';

export const metadata: Metadata = { title: 'Panel Maestro' };

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  sub_type: string | null;
  sub_status: string | null;
  sub_amount: number | null;
  sub_expires_at: string | null;
  sub_last_payment: string | null;
  user_count: number;
}

export default async function SuperadminPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'superadmin') redirect('/dashboard');

  const [businesses, recentUsers] = await Promise.all([
    sql<BusinessRow[]>`
      SELECT b.id, b.name, b.slug, b.created_at,
             s.type AS sub_type, s.status AS sub_status,
             s.amount::float AS sub_amount,
             s.expires_at AS sub_expires_at,
             s.last_payment_at AS sub_last_payment,
             (SELECT COUNT(*)::int FROM users u WHERE u.business_id = b.id) AS user_count
      FROM businesses b
      LEFT JOIN subscriptions s ON s.business_id = b.id
      ORDER BY b.created_at DESC
    `,
    sql`
      SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
             b.name AS business_name
      FROM users u
      LEFT JOIN businesses b ON b.id = u.business_id
      WHERE u.role != 'superadmin'
      ORDER BY u.created_at DESC
      LIMIT 50
    `,
  ]);

  return <SuperadminClient businesses={businesses} users={recentUsers as never[]} />;
}
