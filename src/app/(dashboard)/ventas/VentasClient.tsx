'use client';

import { useState, useMemo } from 'react';
import type { Sale, Customer, Product } from '@/types';
import { formatCurrency, formatDate, SALE_STATUS_LABELS } from '@/lib/utils';
import SaleModal from './SaleModal';

interface Props {
  initialSales: Sale[];
  customers: Customer[];
  products: Product[];
  canManage: boolean;
  businessId: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow',
  paid: 'badge-green',
  cancelled: 'badge-gray',
};

export default function VentasClient({ initialSales, customers, products, canManage, businessId }: Props) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const filtered = useMemo(() =>
    sales.filter((s) => {
      const matchStatus = !filterStatus || s.status === filterStatus;
      const matchSearch =
        !search ||
        (s.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        s.id.includes(search);
      return matchStatus && matchSearch;
    }),
    [sales, filterStatus, search]
  );

  const totalAmount = useMemo(
    () => filtered.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.total, 0),
    [filtered]
  );

  function handleSaved(saved: Sale) {
    setSales((prev) => [saved, ...prev]);
    setModal(false);
  }

  async function handleStatusChange(saleId: string, newStatus: Sale['status']) {
    const res = await fetch(`/api/sales/${saleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, ...data.sale } : s)));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ventas</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} venta{filtered.length !== 1 ? 's' : ''}
            {' · '}
            <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalAmount)}</strong> cobradas
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva venta
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" placeholder="Buscar por cliente..." className="input"
            style={{ paddingLeft: '2.25rem' }} value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ flex: '0 0 160px' }} value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table" aria-label="Lista de ventas">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              {canManage && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-border)' }}>
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>
                    </svg>
                    <p>No hay ventas registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{formatDate(s.sale_date)}</td>
                  <td style={{ fontWeight: 500 }}>{s.customer_name ?? 'Sin cliente'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{s.seller_name ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatCurrency(s.total)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${STATUS_BADGE[s.status] ?? 'badge-gray'}`}>
                      {SALE_STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                        {s.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-ghost"
                              title="Marcar como pagada"
                              onClick={() => handleStatusChange(s.id, 'paid')}
                              style={{ padding: '0.375rem', minHeight: 'auto', color: 'var(--color-success)' }}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                            <button
                              className="btn btn-ghost"
                              title="Cancelar venta"
                              onClick={() => handleStatusChange(s.id, 'cancelled')}
                              style={{ padding: '0.375rem', minHeight: 'auto', color: 'var(--color-danger)' }}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <SaleModal
          customers={customers}
          products={products}
          businessId={businessId}
          onSaved={handleSaved}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}
