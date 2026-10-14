import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import DashboardClient from './DashboardClient';
import type { DashboardStats } from '@/types';

export const metadata: Metadata = { title: 'Inicio – Panel' };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const businessId = session.businessId;
  let stats: DashboardStats;

  if (session.role === 'superadmin') {
    // Superadmin ve stats globales
    const [businesses, users, salesData, lowStock] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM businesses`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role != 'superadmin'`,
      sql`
        SELECT COALESCE(SUM(total), 0)::float AS total_month,
               COUNT(*)::int AS count_month
        FROM sales
        WHERE sale_date >= date_trunc('month', CURRENT_DATE)
          AND status = 'paid'
      `,
      sql`
        SELECT COUNT(*)::int AS count
        FROM products
        WHERE quantity <= min_stock AND is_active = TRUE
      `,
    ]);

    stats = {
      totalSalesMonth: Number((salesData[0] as { total_month: number }).total_month),
      salesCountMonth: Number((salesData[0] as { count_month: number }).count_month),
      lowStockCount: Number((lowStock[0] as { count: number }).count),
      activeCustomers: Number((users[0] as { count: number }).count),
      recentActivity: [],
      lowStockProducts: [],
      monthlySales: [],
    };

    // Usar businesses count como extra info
    void businesses;
  } else {
    const bId = businessId!;
    const [salesData, lowStockData, customersData, recentSales, monthlySalesData] =
      await Promise.all([
        sql`
          SELECT COALESCE(SUM(total), 0)::float AS total_month,
                 COUNT(*)::int AS count_month
          FROM sales
          WHERE business_id = ${bId}
            AND sale_date >= date_trunc('month', CURRENT_DATE)
            AND status = 'paid'
        `,
        sql`
          SELECT id, sku, name, quantity, min_stock, category
          FROM products
          WHERE business_id = ${bId}
            AND quantity <= min_stock
            AND is_active = TRUE
          ORDER BY quantity ASC
          LIMIT 5
        `,
        sql`
          SELECT COUNT(DISTINCT customer_id)::int AS count
          FROM sales
          WHERE business_id = ${bId}
            AND sale_date >= date_trunc('month', CURRENT_DATE)
        `,
        sql`
          SELECT s.id, s.total, s.status, s.sale_date, s.created_at,
                 c.name AS customer_name
          FROM sales s
          LEFT JOIN customers c ON c.id = s.customer_id
          WHERE s.business_id = ${bId}
          ORDER BY s.created_at DESC
          LIMIT 5
        `,
        sql`
          SELECT TO_CHAR(date_trunc('month', sale_date), 'Mon') AS month,
                 COALESCE(SUM(total), 0)::float AS total
          FROM sales
          WHERE business_id = ${bId}
            AND sale_date >= CURRENT_DATE - INTERVAL '6 months'
            AND status = 'paid'
          GROUP BY date_trunc('month', sale_date)
          ORDER BY date_trunc('month', sale_date)
        `,
      ]);

    stats = {
      totalSalesMonth: Number((salesData[0] as { total_month: number }).total_month),
      salesCountMonth: Number((salesData[0] as { count_month: number }).count_month),
      lowStockCount: lowStockData.length,
      activeCustomers: Number((customersData[0] as { count: number }).count),
      recentActivity: (recentSales as Array<{
        id: string; total: number; status: string; sale_date: string;
        created_at: string; customer_name: string;
      }>).map((s) => ({
        id: s.id,
        type: 'sale' as const,
        description: `Venta a ${s.customer_name ?? 'cliente'}`,
        amount: s.total,
        created_at: s.created_at,
      })),
      lowStockProducts: lowStockData as never[],
      monthlySales: (monthlySalesData as Array<{ month: string; total: number }>),
    };
  }

  return <DashboardClient session={session} stats={stats} />;
}
