'use client';

import { useState } from 'react';
import type { Product, UserRole } from '@/types';

interface Props {
  product: Product;
  userRole?: UserRole;
  onAdjusted: (p: Product) => void;
  onClose: () => void;
}

export default function StockAdjustModal({ product, userRole, onAdjusted, onClose }: Props) {
  const isSeller = userRole === 'seller';
  const [adjustment, setAdjustment] = useState<number>(isSeller ? 1 : 0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newQty = product.quantity + adjustment;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (adjustment === 0) {
      setError('Ingresá una cantidad distinta de cero');
      return;
    }
    if (isSeller && adjustment < 1) {
      setError('Como vendedor solo podés cargar stock positivo (+), no está permitido disminuirlo ni borrarlo.');
      return;
    }
    if (newQty < 0) {
      setError('El stock resultante no puede ser negativo');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al ajustar el stock');
        return;
      }
      onAdjusted(data.product);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isSeller ? 'Cargar stock' : 'Ajustar stock'}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {isSeller ? 'Cargar stock (Ingreso)' : 'Ajustar stock'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              {isSeller ? 'Ingreso de repuestos al inventario' : 'Modificación de existencias'}
            </p>
          </div>
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
            Stock actual: <strong>{product.quantity}</strong> u.
          </p>
        </div>

        {isSeller && (
          <div style={{ padding: '0.625rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.8125rem', color: '#1E40AF', marginBottom: '1rem' }}>
            ℹ <strong>Modo Vendedor:</strong> Tenés permitido cargar ingresos de stock. La reducción o borrado de stock está reservada a administradores.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="label" htmlFor="adj-amount">
              {isSeller ? 'Cantidad a ingresar (+)' : 'Ajuste (positivo = entrada, negativo = salida)'}
            </label>
            <input
              id="adj-amount"
              type="number"
              className="input"
              step="1"
              min={isSeller ? 1 : undefined}
              value={adjustment}
              onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Nuevo stock estimado:{' '}
              <strong style={{ color: newQty < 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                {newQty} u.
              </strong>
            </p>
          </div>

          <div>
            <label className="label" htmlFor="adj-reason">Motivo (opcional)</label>
            <input
              id="adj-reason"
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Recepción de pedido, proveedor..."
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
              {loading ? 'Aplicando...' : isSeller ? 'Cargar stock' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
