'use client';

import { useState, useMemo } from 'react';
import type { Quote, Customer, Product, QuoteTemplate } from '@/types';
import { formatCurrency, formatDate, QUOTE_STATUS_LABELS } from '@/lib/utils';
import QuoteModal from './QuoteModal';
import QuotePreview from './QuotePreview';

interface Props {
  initialQuotes: Quote[];
  customers: Customer[];
  products: Product[];
  template: QuoteTemplate | null;
  businessId: string;
  businessName: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-gray', sent: 'badge-blue', accepted: 'badge-green', rejected: 'badge-red',
};

export default function PresupuestosClient({
  initialQuotes, customers, products, template, businessId, businessName,
}: Props) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [filterStatus, setFilterStatus] = useState('');
  const [modal, setModal] = useState<Quote | 'new' | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);

  const filtered = useMemo(
    () => quotes.filter((q) => !filterStatus || q.status === filterStatus),
    [quotes, filterStatus]
  );

  function handleSaved(saved: Quote) {
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === saved.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
      return [saved, ...prev];
    });
    setModal(null);
  }

  async function handleStatusChange(quoteId: string, status: Quote['status']) {
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, ...data.quote } : q)));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Presupuestos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} presupuesto{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo presupuesto
        </button>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <select className="input" style={{ maxWidth: '200px' }} value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviado</option>
          <option value="accepted">Aceptado</option>
          <option value="rejected">Rechazado</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table" aria-label="Lista de presupuestos">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Vehículo</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Válido hasta</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-border)' }}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <p>No hay presupuestos</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id}>
                  <td>
                    <code style={{ fontSize: '0.8125rem', background: 'var(--color-surface-2)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                      {q.quote_number}
                    </code>
                  </td>
                  <td style={{ fontWeight: 500 }}>{q.customer_name ?? 'Sin cliente'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {q.vehicle_info ?? '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {formatCurrency(q.total)}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {q.valid_until ? formatDate(q.valid_until) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${STATUS_BADGE[q.status] ?? 'badge-gray'}`}>
                      {QUOTE_STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                      <button
                        className="btn btn-ghost"
                        title="Previsualizar y exportar"
                        onClick={() => setPreview(q)}
                        style={{ padding: '0.375rem', minHeight: 'auto' }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button
                        className="btn btn-ghost"
                        title="Editar presupuesto"
                        onClick={() => setModal(q)}
                        style={{ padding: '0.375rem', minHeight: 'auto' }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {q.status === 'draft' && (
                        <button
                          className="btn btn-ghost"
                          title="Marcar como enviado"
                          onClick={() => handleStatusChange(q.id, 'sent')}
                          style={{ padding: '0.375rem', minHeight: 'auto', color: 'var(--color-info)' }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <QuoteModal
          quote={modal === 'new' ? null : modal}
          customers={customers}
          products={products}
          template={template}
          businessId={businessId}
          businessName={businessName}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      )}

      {preview !== null && (
        <QuotePreview
          quote={preview}
          customers={customers}
          template={template}
          businessName={businessName}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
