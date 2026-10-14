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
  business: BusinessRow;
  onSaved: (updated: Partial<BusinessRow> & { id: string }) => void;
  onClose: () => void;
}

export default function SubscriptionModal({ business, onSaved, onClose }: Props) {
  const [type, setType] = useState(business.sub_type ?? 'monthly');
  const [status, setStatus] = useState(business.sub_status ?? 'active');
  const [amount, setAmount] = useState(business.sub_amount?.toString() ?? '45000');
  const [expiresAt, setExpiresAt] = useState(
    business.sub_expires_at ? business.sub_expires_at.substring(0, 10) : ''
  );
  const [lastPayment, setLastPayment] = useState(
    business.sub_last_payment ? business.sub_last_payment.substring(0, 10) : new Date().toISOString().substring(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          status,
          amount: parseFloat(amount) || 0,
          expires_at: expiresAt || null,
          last_payment_at: lastPayment || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al actualizar la suscripción');
        return;
      }

      onSaved({
        id: business.id,
        sub_type: type,
        sub_status: status,
        sub_amount: parseFloat(amount) || 0,
        sub_expires_at: expiresAt || null,
        sub_last_payment: lastPayment || null,
      });
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Suscripción de ${business.name}`}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem' }}>Gestionar Suscripción</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{business.name}</p>
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Plan de facturación</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="monthly">Abono mensual</option>
                <option value="fixed">Pago único / vitalicio</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Estado de acceso</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Activo (Habilitado)</option>
                <option value="suspended">Suspendido (Bloqueado)</option>
                <option value="expired">Vencido</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Importe del abono ($)</label>
              <input
                type="number"
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="100"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Fecha de vencimiento</label>
              <input
                type="date"
                className="input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Último pago registrado</label>
            <input
              type="date"
              className="input"
              value={lastPayment}
              onChange={(e) => setLastPayment(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Notas internas (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Transferencia acordada para los días 10 de cada mes"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar suscripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
