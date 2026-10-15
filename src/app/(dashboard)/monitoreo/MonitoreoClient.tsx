'use client';

import { useState, useMemo } from 'react';
import type { AuditLog, UserRole } from '@/types';
import { formatDateTime, ROLE_LABELS, AUDIT_ACTION_LABELS, formatCurrency } from '@/lib/utils';

interface Props {
  initialLogs: AuditLog[];
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-green',
  seller: 'badge-blue',
  cashier: 'badge-yellow',
  superadmin: 'badge-purple',
};

export default function MonitoreoClient({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchRole = selectedRole === 'all' || log.user_role === selectedRole;
      const matchAction =
        selectedAction === 'all' ||
        (selectedAction === 'sales' && log.action.startsWith('VENTA')) ||
        (selectedAction === 'stock' && log.action.startsWith('STOCK')) ||
        (selectedAction === 'expenses' && log.action.startsWith('GASTO')) ||
        (selectedAction === 'products' && log.action.startsWith('PRODUCTO')) ||
        (selectedAction === 'users' && log.action.startsWith('USUARIO')) ||
        (selectedAction === 'customers' && log.action.startsWith('CLIENTE'));

      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        log.user_name.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);

      return matchRole && matchAction && matchSearch;
    });
  }, [logs, selectedRole, selectedAction, search]);

  // Contadores
  const counts = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    const todayLogs = logs.filter((l) => l.created_at.startsWith(today));
    const salesCount = logs.filter((l) => l.action.startsWith('VENTA')).length;
    const stockCount = logs.filter((l) => l.action.startsWith('STOCK')).length;
    const staffCount = logs.filter((l) => l.user_role === 'seller' || l.user_role === 'cashier').length;
    return {
      today: todayLogs.length,
      sales: salesCount,
      stock: stockCount,
      staff: staffCount,
    };
  }, [logs]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/monitoreo');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Error al actualizar monitoreo', e);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Monitoreo y Auditoría</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Registro cronológico de todas las acciones realizadas por vendedores, cajeros y administradores
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ gap: '0.5rem' }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
          >
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? 'Actualizando...' : 'Actualizar actividad'}
        </button>
      </div>

      {/* KPI Cards de Monitoreo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Acciones Hoy</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {counts.today}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>en el día de la fecha</p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operaciones de Venta</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
            {counts.sales}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>ventas y cobros</p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Movimientos de Stock</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB' }}>
            {counts.stock}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>cargas y ajustes</p>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Acciones del Personal</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7C3AED' }}>
            {counts.staff}
          </p>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>vendedores y cajeros</p>
        </div>
      </div>

      {/* Filtros por Rol y Acción */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Tabs por Rol */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'seller', label: 'Vendedores' },
              { id: 'cashier', label: 'Cajeros' },
              { id: 'admin', label: 'Administradores' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRole(tab.id)}
                className={`btn ${selectedRole === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', minHeight: 'auto' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtros secundarios */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: '1 1 300px', justifyContent: 'flex-end' }}>
            <select
              className="input"
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              aria-label="Filtrar por tipo de acción"
            >
              <option value="all">Todas las acciones</option>
              <option value="sales">Ventas y Cobros</option>
              <option value="stock">Cargas y Ajustes de Stock</option>
              <option value="expenses">Gastos</option>
              <option value="products">Productos del Catálogo</option>
              <option value="users">Usuarios y Personal</option>
              <option value="customers">Clientes</option>
            </select>

            <div style={{ position: 'relative', width: '220px' }}>
              <input
                type="search"
                placeholder="Buscar por usuario o detalle..."
                className="input"
                style={{ paddingLeft: '2rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Registros de Monitoreo */}
      <div className="table-container">
        <table className="table" aria-label="Historial de monitoreo y auditoría">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Fecha y Hora</th>
              <th style={{ width: '190px' }}>Usuario Responsable</th>
              <th style={{ width: '150px' }}>Tipo de Acción</th>
              <th>Detalle de la Operación</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-border)' }}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <p>No se encontraron registros de auditoría con los filtros seleccionados</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const actionMeta = AUDIT_ACTION_LABELS[log.action] || {
                  label: log.action,
                  badge: 'badge-gray',
                };
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: 'var(--color-primary-light)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {log.user_name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.2 }}>
                            {log.user_name}
                          </p>
                          <span className={`badge ${ROLE_BADGE[log.user_role] ?? 'badge-gray'}`} style={{ fontSize: '0.625rem', padding: '0.1rem 0.35rem' }}>
                            {ROLE_LABELS[log.user_role] || log.user_role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${actionMeta.badge}`}>
                        {actionMeta.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <p style={{ color: 'var(--color-text)', lineHeight: 1.4 }}>
                        {log.details}
                      </p>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                      {log.amount != null ? (
                        <span style={{ color: log.action.startsWith('GASTO') ? '#DC2626' : 'var(--color-primary)' }}>
                          {log.action.startsWith('GASTO') ? '-' : ''}
                          {formatCurrency(log.amount)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
