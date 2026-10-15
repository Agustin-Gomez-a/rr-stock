'use client';

import { useState } from 'react';
import type { Expense, ExpenseCategory, ExpenseFormData } from '@/types';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/utils';

interface Props {
  onSaved: (exp: Expense) => void;
  onClose: () => void;
}

export default function ExpenseModal({ onSaved, onClose }: Props) {
  const [form, setForm] = useState<ExpenseFormData>({
    title: '',
    category: 'servicios',
    amount: 0,
    expense_date: new Date().toISOString().substring(0, 10),
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Ingresá el concepto del gasto');
      return;
    }
    if (form.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al registrar el gasto');
        return;
      }
      onSaved(data.expense);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Registrar gasto">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Registrar gasto operativo</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              Luz, servicios, insumos, mantenimiento u otros egresos
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="label" htmlFor="exp-title">Concepto / Detalle *</label>
            <input
              id="exp-title"
              className="input"
              required
              placeholder="Ej: Factura Luz Edenor, Insumos de empaque, Bolsas..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="exp-category">Categoría *</label>
              <select
                id="exp-category"
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="exp-amount">Monto ($) *</label>
              <input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                required
                placeholder="0.00"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="exp-date">Fecha del gasto</label>
            <input
              id="exp-date"
              type="date"
              className="input"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label" htmlFor="exp-notes">Comprobante o notas adicionales</label>
            <textarea
              id="exp-notes"
              className="input"
              rows={2}
              placeholder="N° de factura, medio de pago, observaciones..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Cargar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
