import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import ClientesClient from './ClientesClient';
import type { Customer } from '@/types';

export const metadata: Metadata = { title: 'Clientes' };

export default async function ClientesPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/dashboard');

  const customers = await sql<Customer[]>`
    SELECT id, business_id, name, email, phone, address, tax_id, notes, created_at, updated_at
    FROM customers
    WHERE business_id = ${session.businessId}
    ORDER BY name ASC
  `;

  return (
    <ClientesClient
      initialCustomers={customers}
      businessId={session.businessId}
      canManage={['admin', 'manager', 'seller', 'cashier'].includes(session.role)}
    />
  );
}
