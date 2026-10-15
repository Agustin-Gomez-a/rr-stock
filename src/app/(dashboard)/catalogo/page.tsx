import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import CatalogoClient from './CatalogoClient';
import type { Product } from '@/types';

export const metadata: Metadata = { title: 'Catálogo de Repuestos' };

export default async function CatalogoPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.businessId) redirect('/dashboard');

  const products = await sql<Product[]>`
    SELECT id, business_id, sku, name, description, category, supplier,
           price::float, cost::float, quantity, min_stock, is_active,
           created_at, updated_at
    FROM products
    WHERE business_id = ${session.businessId}
    ORDER BY name ASC
  `;

  const categories = [...new Set(
    products
      .map((p) => p.category)
      .filter(Boolean)
  )] as string[];

  return (
    <CatalogoClient
      initialProducts={products}
      categories={categories}
      userRole={session.role}
      businessId={session.businessId}
    />
  );
}
