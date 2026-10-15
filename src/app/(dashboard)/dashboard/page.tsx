import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { sql } from '@/lib/db';
import DashboardClient from './DashboardClient';
import type { DashboardStats, ActivityItem } from '@/types';

export const metadata: Metadata = { title: 'Inicio – Panel de Control' };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const businessId = session.businessId;
  let stats: DashboardStats;

  if (session.role === 'superadmin') {
    // Superadmin ve stats globales
    const [businesses, users, salesData, lowStock, expensesData] = await Promise.all([
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
      sql`
        SELECT COALESCE(SUM(amount), 0)::float AS total_month
        FROM expenses
        WHERE expense_date >= date_trunc('month', CURRENT_DATE)
      `,
    ]);

    const salesTotal = Number((salesData[0] as { total_month: number })?.total_month || 0);
    const expTotal = Number((expensesData[0] as { total_month: number })?.total_month || 0);

    stats = {
      totalSalesMonth: salesTotal,
      salesCountMonth: Number((salesData[0] as { count_month: number })?.count_month || 0),
      totalExpensesMonth: expTotal,
      netProfitMonth: salesTotal - expTotal,
      lowStockCount: Number((lowStock[0] as { count: number })?.count || 0),
      activeCustomers: Number((users[0] as { count: number })?.count || 0),
      recentActivity: [],
      lowStockProducts: [],
      monthlySales: [],
    };
    void businesses;
  } else {
    const bId = businessId!;
    const [salesData, lowStockData, customersData, expensesData, auditData, monthlySalesData] =
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
          SELECT COALESCE(SUM(amount), 0)::float AS total_month
          FROM expenses
          WHERE business_id = ${bId}
            AND expense_date >= date_trunc('month', CURRENT_DATE)
        `,
        sql`
          SELECT id, user_name, user_role, action, details, amount::float, created_at
          FROM audit_logs
          WHERE business_id = ${bId}
          ORDER BY created_at DESC
          LIMIT 6
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

    const salesTotal = Number((salesData[0] as { total_month: number })?.total_month || 0);
    const expTotal = Number((expensesData[0] as { total_month: number })?.total_month || 0);

    // Mapear actividad reciente directamente desde los registros de auditoría
    const recentActivity: ActivityItem[] = (
      auditData as Array<{
        id: string;
        user_name: string;
        user_role: any;
        action: string;
        details: string;
        amount: number | null;
        created_at: string;
      }>
    ).map((log) => ({
      id: log.id,
      type: log.action.startsWith('VENTA')
        ? 'sale'
        : log.action.startsWith('STOCK')
        ? 'stock'
        : log.action.startsWith('GASTO')
        ? 'expense'
        : log.action.startsWith('PRODUCTO')
        ? 'product'
        : log.action.startsWith('USUARIO')
        ? 'user'
        : 'customer',
      description: log.details,
      user_name: log.user_name,
      user_role: log.user_role,
      amount: log.amount ?? undefined,
      created_at: log.created_at,
    }));

    stats = {
      totalSalesMonth: salesTotal,
      salesCountMonth: Number((salesData[0] as { count_month: number })?.count_month || 0),
      totalExpensesMonth: expTotal,
      netProfitMonth: salesTotal - expTotal,
      lowStockCount: (lowStockData as any[]).length,
      activeCustomers: Number((customersData[0] as { count: number })?.count || 0),
      recentActivity,
      lowStockProducts: lowStockData as any[],
      monthlySales: monthlySalesData as Array<{ month: string; total: number }>,
    };
  }

  return <DashboardClient session={session} stats={stats} />;
}
