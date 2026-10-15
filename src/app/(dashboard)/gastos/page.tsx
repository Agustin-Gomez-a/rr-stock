import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import { canManageExpenses } from '@/lib/permissions';
import GastosClient from './GastosClient';
import type { Expense } from '@/types';

export const metadata: Metadata = { title: 'Control de Gastos – Panel' };

export default async function GastosPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!canManageExpenses(session)) redirect('/dashboard');

  const businessId = session.businessId;
  if (!businessId) redirect('/login');

  const rows = await sql`
    SELECT id, business_id, title, category, amount::float, expense_date, notes,
           created_by_id, created_by_name, created_at, updated_at
    FROM expenses
    WHERE business_id = ${businessId}
    ORDER BY expense_date DESC, created_at DESC
  `;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  const totalMonth = (rows as Array<{ amount: number; expense_date: string }>).filter(
    (e) => e.expense_date >= startOfMonth
  ).reduce((sum, e) => sum + e.amount, 0);

  return (
    <GastosClient
      initialExpenses={rows as Expense[]}
      initialTotalMonth={totalMonth}
    />
  );
}
