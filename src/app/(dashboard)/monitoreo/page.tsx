import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import { canViewMonitoring } from '@/lib/permissions';
import MonitoreoClient from './MonitoreoClient';
import type { AuditLog } from '@/types';

export const metadata: Metadata = { title: 'Monitoreo y Auditoría – Panel' };

export default async function MonitoreoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!canViewMonitoring(session)) redirect('/dashboard');

  const businessId = session.businessId;
  if (!businessId) redirect('/login');

  const logs = await sql`
    SELECT id, business_id, user_id, user_name, user_role, action, details, amount::float, created_at
    FROM audit_logs
    WHERE business_id = ${businessId}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return <MonitoreoClient initialLogs={logs as AuditLog[]} />;
}
