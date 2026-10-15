import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { canManageSalaries } from '@/lib/permissions';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';
import SueldosClient from './SueldosClient';
import type { Salary, User } from '@/types';

export const metadata: Metadata = {
  title: 'Sueldos y Liquidaciones – Panel de Control',
};

export default async function SueldosPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!canManageSalaries(session)) redirect('/dashboard');
  if (!session.businessId) redirect('/dashboard');

  const [salariesRows, teamRows] = await Promise.all([
    sql`
      SELECT id, business_id, user_id, employee_name, employee_role, period,
             base_amount::float, bonus_amount::float, deductions_amount::float, total_amount::float,
             status, payment_date, payment_method, notes, created_at, updated_at
      FROM salaries
      WHERE business_id = ${session.businessId}
      ORDER BY period DESC, created_at DESC
    `,
    sql`
      SELECT id, email, full_name, role, is_active
      FROM users
      WHERE business_id = ${session.businessId}
      ORDER BY full_name ASC
    `,
  ]);

  const salaries = (salariesRows as Salary[]) || [];
  const teamMembers = (teamRows as User[]) || [];

  return (
    <SueldosClient
      initialSalaries={salaries}
      teamMembers={teamMembers}
      userRole={session.role}
    />
  );
}
