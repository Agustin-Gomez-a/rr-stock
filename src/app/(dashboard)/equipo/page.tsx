import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import { canManageTeam } from '@/lib/permissions';
import EquipoClient from './EquipoClient';
import type { User } from '@/types';

export const metadata: Metadata = { title: 'Gestión de Equipo – Panel' };

export default async function EquipoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!canManageTeam(session)) redirect('/dashboard');

  const businessId = session.businessId;
  if (!businessId) redirect('/login');

  const users = await sql`
    SELECT id, business_id, email, full_name, role, is_active, last_login_at, created_at
    FROM users
    WHERE business_id = ${businessId}
    ORDER BY created_at ASC
  `;

  return (
    <EquipoClient
      initialUsers={users as User[]}
      currentUserId={session.userId}
    />
  );
}
