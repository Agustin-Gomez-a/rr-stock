'use client';

import { useState } from 'react';
import type { Customer, Product, SaleItemForm } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  customers: Customer[];
  products: Product[];
  businessId: string;
  onSaved: (s: import('@/types').Sale) => void;
  onClose: () => void;
}

export default function SaleModal({ customers, products, businessId, onSaved, onClose }: Props) {
  const [customerId, setCustomerId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItemForm[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  function addProduct() {
    const p = products.find((pr) => pr.id === selectedProductId);
    if (!p) return;
    const existing = items.findIndex((i) => i.product_id === p.id);
    if (existing >= 0) {
      setItems((prev) => {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], quantity: copy[existing].quantity + 1 };
        return copy;
      });
    } else {
      setItems((prev) => [...prev, {
        product_id: p.id, sku: p.sku, name: p.name,
        quantity: 1, unit_price: p.price,
      }]);
    }
    setSelectedProductId('');
  }

  function updateItem(index: number, key: 'quantity' | 'unit_price', value: number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Agregá al menos un producto'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId || null,
          status: 'pending',
          notes: notes || null,
          sale_date: saleDate,
          items,
          businessId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      onSaved(data.sale);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Nueva venta">
      <div className="modal" style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>Nueva venta</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="s-customer">Cliente</label>
              <select id="s-customer" className="input" value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-date">Fecha</label>
              <input id="s-date" type="date" className="input" value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)} />
            </div>
          </div>

          {/* Agregar producto */}
          <div
            style={{
              background: 'var(--color-surface-2)', borderRadius: '8px',
              padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="s-product">Agregar repuesto</label>
              <select id="s-product" className="input" value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Seleccionar repuesto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} – {formatCurrency(p.price)} (stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-secondary" onClick={addProduct}
              disabled={!selectedProductId}>
              Agregar
            </button>
          </div>

          {/* Líneas */}
          {items.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: '90px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ width: '120px', textAlign: 'right' }}>Precio</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.875rem' }}>
                        <p style={{ fontWeight: 500 }}>{item.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.sku}</p>
                      </td>
                      <td>
                        <input type="number" className="input" min="1" step="1" value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ textAlign: 'center', padding: '0.375rem' }} />
                      </td>
                      <td>
                        <input type="number" className="input" min="0" step="0.01" value={item.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          style={{ textAlign: 'right', padding: '0.375rem' }} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem' }}>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td>
                        <button type="button" className="btn btn-ghost" onClick={() => removeItem(idx)}
                          style={{ padding: '0.25rem', minHeight: 'auto', color: 'var(--color-danger)' }}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600, padding: '0.75rem 1rem' }}>Total:</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem', padding: '0.75rem 1rem' }}>
                      {formatCurrency(total)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div>
            <label className="label" htmlFor="s-notes">Notas (opcional)</label>
            <textarea id="s-notes" className="input" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0}>
              {loading ? 'Guardando...' : `Guardar venta – ${formatCurrency(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
