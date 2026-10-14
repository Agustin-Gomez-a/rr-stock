'use client';

import { useState } from 'react';
import type { Product, ProductFormData } from '@/types';

interface Props {
  product: Product | null;
  businessId: string;
  onSaved: (p: Product) => void;
  onClose: () => void;
}

const EMPTY: ProductFormData = {
  sku: '', name: '', description: '', category: '',
  supplier: '', price: 0, cost: 0, quantity: 0, min_stock: 5,
};

export default function ProductModal({ product, businessId, onSaved, onClose }: Props) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState<ProductFormData>(
    product
      ? {
          sku: product.sku, name: product.name,
          description: product.description ?? '',
          category: product.category ?? '',
          supplier: product.supplier ?? '',
          price: product.price, cost: product.cost,
          quantity: product.quantity, min_stock: product.min_stock,
        }
      : EMPTY
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/products/${product!.id}`
        : '/api/products';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, businessId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      onSaved(data.product);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar repuesto' : 'Agregar repuesto'}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{isEdit ? 'Editar repuesto' : 'Agregar repuesto'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="p-sku">SKU *</label>
              <input id="p-sku" className="input" required value={form.sku}
                onChange={(e) => set('sku', e.target.value)} placeholder="FIL-001" />
            </div>
            <div>
              <label className="label" htmlFor="p-category">Categoría</label>
              <input id="p-category" className="input" value={form.category}
                onChange={(e) => set('category', e.target.value)} placeholder="Filtros" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="p-name">Nombre *</label>
            <input id="p-name" className="input" required value={form.name}
              onChange={(e) => set('name', e.target.value)} placeholder="Filtro de aceite Toyota" />
          </div>

          <div>
            <label className="label" htmlFor="p-desc">Descripción</label>
            <textarea id="p-desc" className="input" rows={2} value={form.description}
              onChange={(e) => set('description', e.target.value)}
              style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          <div>
            <label className="label" htmlFor="p-supplier">Proveedor</label>
            <input id="p-supplier" className="input" value={form.supplier}
              onChange={(e) => set('supplier', e.target.value)} placeholder="AutoParts SA" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="p-price">Precio de venta *</label>
              <input id="p-price" type="number" className="input" required min="0" step="0.01"
                value={form.price} onChange={(e) => set('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label" htmlFor="p-cost">Costo</label>
              <input id="p-cost" type="number" className="input" min="0" step="0.01"
                value={form.cost} onChange={(e) => set('cost', parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="p-qty">Stock actual</label>
              <input id="p-qty" type="number" className="input" min="0" step="1"
                value={form.quantity} onChange={(e) => set('quantity', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="label" htmlFor="p-min">Stock mínimo</label>
              <input id="p-min" type="number" className="input" min="0" step="1"
                value={form.min_stock} onChange={(e) => set('min_stock', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
