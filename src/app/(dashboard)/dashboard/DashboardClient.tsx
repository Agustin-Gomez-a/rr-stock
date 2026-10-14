'use client';

import type { SessionPayload } from '@/lib/auth';
import type { DashboardStats } from '@/types';
import { formatCurrency, formatDateTime, ROLE_LABELS } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  session: SessionPayload;
  stats: DashboardStats;
}

export default function DashboardClient({ session, stats }: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <div>
          <h1 style={{ color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Panel de control
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
            {session.role !== 'superadmin' && session.businessName && (
              <span> · {session.businessName}</span>
            )}
          </p>
        </div>
        <span className="badge badge-green">
          {ROLE_LABELS[session.role]}
        </span>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          label="Ventas del mes"
          value={formatCurrency(stats.totalSalesMonth)}
          sub={`${stats.salesCountMonth} transacción${stats.salesCountMonth !== 1 ? 'es' : ''}`}
          color="var(--color-primary)"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          }
        />
        <StatCard
          label="Stock bajo"
          value={String(stats.lowStockCount)}
          sub="productos bajo mínimo"
          color="var(--color-warning)"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
        <StatCard
          label="Clientes activos"
          value={String(stats.activeCustomers)}
          sub="este mes"
          color="var(--color-info)"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          }
        />
      </div>

      {/* Grid inferior */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Gráfico de ventas */}
        {stats.monthlySales.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Ventas últimos 6 meses</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.monthlySales}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Ventas']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8125rem',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2D6A4F"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Alertas de stock */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--color-warning)' }}>⚠</span> Alertas de inventario
          </h2>
          {stats.lowStockProducts.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-success)' }}>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p>Todo el stock está en niveles correctos</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '8px',
                    background: p.quantity === 0 ? '#FEE2E2' : '#FEF3C7',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 500 }}>{p.name}</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{p.sku}</p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: p.quantity === 0 ? '#FEE2E2' : '#FEF3C7',
                      color: p.quantity === 0 ? '#991B1B' : '#92400E',
                      fontWeight: 700,
                    }}
                  >
                    {p.quantity === 0 ? 'Sin stock' : `${p.quantity} u.`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Actividad reciente</h2>
          {stats.recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.recentActivity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--color-border)',
                    animation: 'slideIn 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      width: '32px', height: '32px',
                      background: 'var(--color-primary-muted)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{item.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.125rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {formatDateTime(item.created_at)}
                      </span>
                      {item.amount !== undefined && (
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                          {formatCurrency(item.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          {label}
        </span>
        <div
          style={{
            width: '36px', height: '36px',
            background: `${color}18`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub}</p>
    </div>
  );
}
