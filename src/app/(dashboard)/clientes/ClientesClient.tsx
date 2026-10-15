'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/types';
import CustomerModal from './CustomerModal';

interface Props {
  initialCustomers: Customer[];
  businessId: string;
  canManage: boolean;
}

export default function ClientesClient({ initialCustomers, businessId, canManage }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Customer | 'new' | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.includes(q) ?? false) ||
          (c.tax_id?.includes(q) ?? false)
        );
      }),
    [customers, search]
  );

  function handleSaved(saved: Customer) {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setModal(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {`${filtered.length} ${filtered.length === 1 ? 'cliente' : 'clientes'}`}
          </p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('new')} type="button">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar cliente
          </button>
        )}
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre, email, teléfono o CUIT..."
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="table" aria-label="Lista de clientes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>CUIT/DNI</th>
              <th>Dirección</th>
              {canManage && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5}>
                  <div className="empty-state">
                    <svg
                      width="40"
                      height="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--color-border)' }}
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <p>No se encontraron clientes</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {c.email || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    {c.phone || '—'}
                  </td>
                  <td>
                    {c.tax_id ? (
                      <code
                        style={{
                          fontSize: '0.8125rem',
                          background: 'var(--color-surface-2)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '4px',
                        }}
                      >
                        {c.tax_id}
                      </code>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '200px' }}>
                    <span style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.address || '—'}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setModal(c)}
                          title="Editar cliente"
                          style={{ padding: '0.375rem', minHeight: 'auto' }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <CustomerModal
          customer={modal === 'new' ? null : modal}
          businessId={businessId}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
