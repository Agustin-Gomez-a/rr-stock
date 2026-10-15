'use client';

import Link from 'next/link';
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

  const isAdmin = session.role === 'admin' || session.role === 'superadmin';
  const isSeller = session.role === 'seller';
  const isCashier = session.role === 'cashier';

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
            {session.businessName && <span> · {session.businessName}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-green">
            {ROLE_LABELS[session.role]}
          </span>
          {session.fullName && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {session.fullName}
            </span>
          )}
        </div>
      </div>

      {/* Botones de acción rápida según rol */}
      <div
        className="card"
        style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--color-surface-2)',
        }}
      >
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Acciones rápidas:
        </span>
        <Link href="/ventas" className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Registrar venta
        </Link>
        {(isAdmin || isSeller) && (
          <Link href="/catalogo" className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
              <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
            </svg>
            {isSeller ? 'Cargar stock (+)' : 'Catálogo y Stock'}
          </Link>
        )}
        {isAdmin && (
          <>
            <Link href="/gastos" className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              Cargar gasto (luz/insumos)
            </Link>
            <Link href="/monitoreo" className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Monitoreo del personal
            </Link>
            <Link href="/equipo" className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Gestionar equipo
            </Link>
          </>
        )}
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
          sub={`${stats.salesCountMonth} operación${stats.salesCountMonth !== 1 ? 'es' : ''} cobrada${stats.salesCountMonth !== 1 ? 's' : ''}`}
          color="var(--color-primary)"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          }
        />

        {isAdmin && (
          <>
            <StatCard
              label="Gastos del mes"
              value={formatCurrency(stats.totalExpensesMonth || 0)}
              sub="luz, insumos y servicios"
              color="#DC2626"
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              }
            />
            <StatCard
              label="Utilidad neta estimada"
              value={formatCurrency(stats.netProfitMonth || 0)}
              sub="Ventas cobradas - Gastos"
              color={stats.netProfitMonth >= 0 ? 'var(--color-primary)' : '#DC2626'}
              icon={
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              }
            />
          </>
        )}

        <StatCard
          label="Alertas de stock"
          value={String(stats.lowStockCount)}
          sub="repuestos bajo mínimo"
          color="var(--color-warning)"
          icon={
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />

        <StatCard
          label="Clientes atendidos"
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
            <h2 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Evolución de ventas mensuales</h2>
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
              <p>Todo el inventario está en niveles óptimos</p>
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

        {/* Actividad y Monitoreo reciente */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem' }}>Actividad y Auditoría reciente</h2>
            {isAdmin && (
              <Link href="/monitoreo" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                Ver todo →
              </Link>
            )}
          </div>
          {stats.recentActivity.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <p>No hay actividad registrada todavía</p>
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
                  }}
                >
                  <div
                    style={{
                      width: '32px', height: '32px',
                      background: item.type === 'expense' ? '#FEE2E2' : 'var(--color-primary-muted)',
                      color: item.type === 'expense' ? '#DC2626' : 'var(--color-primary)',
                      borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'sale' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>
                      </svg>
                    )}
                    {item.type === 'stock' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                      </svg>
                    )}
                    {item.type === 'expense' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                      </svg>
                    )}
                    {item.type !== 'sale' && item.type !== 'stock' && item.type !== 'expense' && (
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.3 }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {item.user_name ? `${item.user_name} · ` : ''}{formatDateTime(item.created_at)}
                      </span>
                      {item.amount !== undefined && (
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: item.type === 'expense' ? '#DC2626' : 'var(--color-primary)',
                          }}
                        >
                          {item.type === 'expense' ? '-' : ''}{formatCurrency(item.amount)}
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
