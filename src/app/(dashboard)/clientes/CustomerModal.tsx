'use client';

import { useState } from 'react';
import type { Customer, CustomerFormData } from '@/types';

interface Props {
  customer: Customer | null;
  businessId: string;
  onSaved: (c: Customer) => void;
  onClose: () => void;
}

export default function CustomerModal({ customer, businessId, onSaved, onClose }: Props) {
  const isEdit = Boolean(customer);
  const [form, setForm] = useState<CustomerFormData>(
    customer
      ? { name: customer.name, email: customer.email ?? '', phone: customer.phone ?? '',
          address: customer.address ?? '', tax_id: customer.tax_id ?? '', notes: customer.notes ?? '' }
      : { name: '', email: '', phone: '', address: '', tax_id: '', notes: '' }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('El nombre es requerido'); return; }
    setLoading(true);

    try {
      const url = isEdit ? `/api/customers/${customer!.id}` : '/api/customers';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, businessId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      onSaved(data.customer);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar cliente' : 'Agregar cliente'}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{isEdit ? 'Editar cliente' : 'Agregar cliente'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="label" htmlFor="cu-name">Nombre / Razón social *</label>
            <input id="cu-name" className="input" required value={form.name}
              onChange={(e) => set('name', e.target.value)} placeholder="Juan Pérez" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="cu-email">Email</label>
              <input id="cu-email" type="email" className="input" value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="juan@email.com" />
            </div>
            <div>
              <label className="label" htmlFor="cu-phone">Teléfono</label>
              <input id="cu-phone" type="tel" className="input" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} placeholder="+54 11 1234-5678" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="cu-taxid">CUIT / DNI</label>
            <input id="cu-taxid" className="input" value={form.tax_id}
              onChange={(e) => set('tax_id', e.target.value)} placeholder="20-12345678-9" />
          </div>

          <div>
            <label className="label" htmlFor="cu-address">Dirección</label>
            <input id="cu-address" className="input" value={form.address}
              onChange={(e) => set('address', e.target.value)} placeholder="Av. Rivadavia 1234, CABA" />
          </div>

          <div>
            <label className="label" htmlFor="cu-notes">Notas</label>
            <textarea id="cu-notes" className="input" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
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
