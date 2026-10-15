'use client';

import { useState } from 'react';
import type { Salary, User, SalaryStatus, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  teamMembers: User[];
  onSaved: (salary: Salary) => void;
  onClose: () => void;
}

export default function SalaryModal({ teamMembers, onSaved, onClose }: Props) {
  const currentPeriod = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

  const [selectedUserId, setSelectedUserId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('Vendedor');
  const [period, setPeriod] = useState(currentPeriod);
  const [baseAmount, setBaseAmount] = useState<number | ''>('');
  const [bonusAmount, setBonusAmount] = useState<number | ''>(0);
  const [deductionsAmount, setDeductionsAmount] = useState<number | ''>(0);
  const [status, setStatus] = useState<SalaryStatus>('paid');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numBase = Number(baseAmount) || 0;
  const numBonus = Number(bonusAmount) || 0;
  const numDeductions = Number(deductionsAmount) || 0;
  const totalNeto = numBase + numBonus - numDeductions;

  function handleSelectMember(userId: string) {
    setSelectedUserId(userId);
    const member = teamMembers.find((m) => m.id === userId);
    if (member) {
      setEmployeeName(member.full_name);
      const roleMap: Record<string, string> = {
        admin: 'Administrador',
        seller: 'Vendedor',
        cashier: 'Cajero',
        manager: 'Encargado',
      };
      setEmployeeRole(roleMap[member.role] || 'Personal');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeName.trim()) {
      setError('Por favor ingresá el nombre del empleado');
      return;
    }
    if (numBase <= 0) {
      setError('El sueldo básico debe ser mayor a 0');
      return;
    }
    if (totalNeto < 0) {
      setError('El total neto no puede ser negativo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId || null,
          employee_name: employeeName.trim(),
          employee_role: employeeRole.trim(),
          period,
          base_amount: numBase,
          bonus_amount: numBonus,
          deductions_amount: numDeductions,
          status,
          payment_date: status === 'paid' ? paymentDate : null,
          payment_method: status === 'paid' ? paymentMethod : null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el sueldo');
      }

      onSaved(data.salary);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Liquidar Sueldo">
      <div className="modal" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Liquidar Sueldo / Haberes</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Registrá la liquidación o pago mensual del personal
            </p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Selector de Miembro de Equipo */}
          {teamMembers.length > 0 && (
            <div>
              <label className="form-label">Seleccionar del Equipo (opcional)</label>
              <select
                className="form-input"
                value={selectedUserId}
                onChange={(e) => handleSelectMember(e.target.value)}
              >
                <option value="">-- Ingresar empleado manual --</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role.toUpperCase()}) - {m.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Nombre del Empleado *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej: Lucas González"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Rol o Puesto *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="Ej: Vendedor, Cajero, Mecánico"
                value={employeeRole}
                onChange={(e) => setEmployeeRole(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Período Mensual *</label>
              <input
                type="month"
                className="form-input"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Sueldo Básico ($) *</label>
              <input
                type="number"
                className="form-input"
                required
                min="0"
                step="any"
                placeholder="0.00"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Comisiones / Premios ($)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="any"
                placeholder="0.00"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div>
              <label className="form-label">Adelantos / Descuentos ($)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="any"
                placeholder="0.00"
                value={deductionsAmount}
                onChange={(e) => setDeductionsAmount(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          {/* Tarjeta de Resumen Neto */}
          <div
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.875rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Total Neto a Cobrar
              </span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {formatCurrency(totalNeto)}
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              (Básico + Adicionales - Descuentos)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Estado de la Liquidación</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as SalaryStatus)}
              >
                <option value="paid">Pagado en el acto</option>
                <option value="pending">Pendiente de Pago</option>
              </select>
            </div>
            {status === 'paid' && (
              <div>
                <label className="form-label">Medio de Pago</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            )}
          </div>

          {status === 'paid' && (
            <div>
              <label className="form-label">Fecha del Pago</label>
              <input
                type="date"
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="form-label">Observaciones o Notas</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Detalle de adicionales, transferencias o acuerdos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : status === 'paid' ? 'Registrar y Pagar Sueldo' : 'Guardar Liquidación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
