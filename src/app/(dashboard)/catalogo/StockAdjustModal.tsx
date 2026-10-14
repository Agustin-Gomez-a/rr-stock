'use client';

import { useState } from 'react';
import type { Product } from '@/types';

interface Props {
  product: Product;
  onAdjusted: (p: Product) => void;
  onClose: () => void;
}

export default function StockAdjustModal({ product, onAdjusted, onClose }: Props) {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newQty = product.quantity + adjustment;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (adjustment === 0) { setError('Ingresá un ajuste distinto de cero'); return; }
    if (newQty < 0) { setError('El stock no puede ser negativo'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al ajustar'); return; }
      onAdjusted(data.product);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Ajustar stock">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>Ajustar stock</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: '8px', marginBottom: '1rem' }}>
          <p style={{ fontWeight: 600 }}>{product.name}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>SKU: {product.sku}</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Stock actual: <strong>{product.quantity}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="label" htmlFor="adj-amount">
              Ajuste (positivo = entrada, negativo = salida)
            </label>
            <input
              id="adj-amount"
              type="number"
              className="input"
              step="1"
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Nuevo stock: <strong style={{ color: newQty < 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>{newQty}</strong>
            </p>
          </div>

          <div>
            <label className="label" htmlFor="adj-reason">Motivo (opcional)</label>
            <input
              id="adj-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Recepción de mercadería, corrección de inventario..."
            />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || newQty < 0}>
              {loading ? 'Aplicando...' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
