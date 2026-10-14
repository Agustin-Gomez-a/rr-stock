'use client';

import { useState } from 'react';

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  sub_type: string | null;
  sub_status: string | null;
  sub_amount: number | null;
  sub_expires_at: string | null;
  sub_last_payment: string | null;
  user_count: number;
}

interface Props {
  business: BusinessRow | null;
  onSaved: (b: BusinessRow) => void;
  onClose: () => void;
}

export default function BusinessModal({ business, onSaved, onClose }: Props) {
  const isEdit = Boolean(business);
  const [name, setName] = useState(business?.name ?? '');
  const [slug, setSlug] = useState(business?.slug ?? '');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [subType, setSubType] = useState<'monthly' | 'fixed'>('monthly');
  const [subAmount, setSubAmount] = useState('45000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(val: string) {
    setName(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('El nombre del negocio es requerido');
      return;
    }
    if (!slug.trim()) {
      setError('El identificador (slug) es requerido');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/superadmin/businesses/${business!.id}` : '/api/superadmin/businesses';
      const method = isEdit ? 'PATCH' : 'POST';
      const body = isEdit
        ? { name, slug }
        : {
            name,
            slug,
            address,
            phone,
            tax_id: taxId,
            sub_type: subType,
            sub_amount: parseFloat(subAmount) || 0,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar el negocio');
        return;
      }

      onSaved(data.business);
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar negocio' : 'Nuevo negocio'}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{isEdit ? 'Editar negocio' : 'Nuevo negocio'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Nombre del negocio *</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Repuestos Warnes Norte"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Identificador único (Slug) *</label>
            <input
              type="text"
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej. repuestos-warnes"
              required
            />
          </div>

          {!isEdit && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label">Tipo de plan</label>
                  <select className="input" value={subType} onChange={(e) => setSubType(e.target.value as 'monthly' | 'fixed')}>
                    <option value="monthly">Abono Mensual</option>
                    <option value="fixed">Pago Único / Fijo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Importe inicial ($)</label>
                  <input
                    type="number"
                    className="input"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    placeholder="45000"
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="label">Teléfono (opcional)</label>
                  <input type="text" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="011 4567-8900" />
                </div>
                <div className="form-group">
                  <label className="label">CUIT (opcional)</label>
                  <input type="text" className="input" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="30-12345678-9" />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Dirección (opcional)</label>
                <input type="text" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Warnes 1234, CABA" />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear negocio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
