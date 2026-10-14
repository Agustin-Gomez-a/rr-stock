import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import PresupuestosClient from './PresupuestosClient';
import type { Quote, Customer, Product, QuoteTemplate } from '@/types';

export const metadata: Metadata = { title: 'Presupuestos' };

export default async function PresupuestosPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/dashboard');

  const bId = session.businessId;

  const [quotes, customers, products, templates] = await Promise.all([
    sql<Quote[]>`
      SELECT q.id, q.quote_number, q.status, q.vehicle_info, q.vin,
             q.subtotal::float, q.vat_rate::float, q.vat_amount::float, q.total::float,
             q.notes, q.valid_until, q.created_at, q.updated_at,
             c.name AS customer_name
      FROM quotes q
      LEFT JOIN customers c ON c.id = q.customer_id
      WHERE q.business_id = ${bId}
      ORDER BY q.created_at DESC
      LIMIT 100
    `,
    sql<Customer[]>`
      SELECT id, name, email, phone, address, tax_id
      FROM customers WHERE business_id = ${bId} ORDER BY name ASC
    `,
    sql<Product[]>`
      SELECT id, sku, name, price::float, quantity
      FROM products WHERE business_id = ${bId} AND is_active = TRUE ORDER BY name ASC
    `,
    sql<QuoteTemplate[]>`
      SELECT id, business_name, logo_url, title, footer_text, payment_terms, vat_rate::float
      FROM quote_templates WHERE business_id = ${bId} LIMIT 1
    `,
  ]);

  return (
    <PresupuestosClient
      initialQuotes={quotes}
      customers={customers}
      products={products}
      template={templates[0] ?? null}
      businessId={bId}
      businessName={session.businessName ?? ''}
    />
  );
}
