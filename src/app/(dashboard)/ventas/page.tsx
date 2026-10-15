import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import VentasClient from './VentasClient';
import type { Sale, Customer, Product } from '@/types';

export const metadata: Metadata = { title: 'Ventas' };

export default async function VentasPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/dashboard');

  const bId = session.businessId;

  const [sales, customers, products] = await Promise.all([
    sql<Sale[]>`
      SELECT s.id, s.business_id, s.customer_id, s.seller_id, s.status,
             s.total::float, s.notes, s.sale_date, s.created_at, s.updated_at,
             c.name AS customer_name,
             u.full_name AS seller_name
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN users u ON u.id = s.seller_id
      WHERE s.business_id = ${bId}
      ORDER BY s.created_at DESC
      LIMIT 100
    `,
    sql<Customer[]>`
      SELECT id, name, email, phone, tax_id FROM customers
      WHERE business_id = ${bId} ORDER BY name ASC
    `,
    sql<Product[]>`
      SELECT id, sku, name, price::float, quantity, min_stock
      FROM products
      WHERE business_id = ${bId} AND is_active = TRUE AND quantity > 0
      ORDER BY name ASC
    `,
  ]);

  return (
    <VentasClient
      initialSales={sales}
      customers={customers}
      products={products}
      canManage={['admin', 'manager', 'seller', 'cashier'].includes(session.role)}
      businessId={bId}
    />
  );
}
