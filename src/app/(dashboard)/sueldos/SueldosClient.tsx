'use client';

import { useState, useMemo } from 'react';
import type { Salary, User, UserRole } from '@/types';
import { formatCurrency, formatDate, SALARY_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/utils';
import SalaryModal from './SalaryModal';
import SalaryReceiptModal from './SalaryReceiptModal';

interface Props {
  initialSalaries: Salary[];
  teamMembers: User[];
  userRole: UserRole;
}

export default function SueldosClient({ initialSalaries, teamMembers }: Props) {
  const [salaries, setSalaries] = useState<Salary[]>(initialSalaries);
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
  const [showModal, setShowModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Salary | null>(null);
  const [payingSalary, setPayingSalary] = useState<Salary | null>(null);
  const [payMethod, setPayMethod] = useState<'transferencia' | 'efectivo' | 'cheque'>('transferencia');
  const [payLoading, setPayLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Períodos únicos presentes
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    salaries.forEach((s) => set.add(s.period));
    return Array.from(set).sort().reverse();
  }, [salaries]);

  const filtered = useMemo(() => {
    return salaries.filter((s) => {
      const matchSearch =
        !search ||
        s.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        s.employee_role.toLowerCase().includes(search.toLowerCase()) ||
        (s.notes?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchPeriod = !filterPeriod || s.period === filterPeriod;
      const matchStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchSearch && matchPeriod && matchStatus;
    });
  }, [salaries, search, filterPeriod, filterStatus]);

  // Métricas
  const totalLiquidado = useMemo(() => {
    return filtered.reduce((sum, s) => sum + Number(s.total_amount), 0);
  }, [filtered]);

  const totalPagado = useMemo(() => {
    return filtered.filter((s) => s.status === 'paid').reduce((sum, s) => sum + Number(s.total_amount), 0);
  }, [filtered]);

  const totalPendiente = useMemo(() => {
    return filtered.filter((s) => s.status === 'pending').reduce((sum, s) => sum + Number(s.total_amount), 0);
  }, [filtered]);

  function handleSalarySaved(newSalary: Salary) {
    setSalaries((prev) => [newSalary, ...prev]);
    setShowModal(false);
  }

  async function handleMarkAsPaid() {
    if (!payingSalary) return;
    setPayLoading(true);
    try {
      const res = await fetch(`/api/salaries/${payingSalary.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_method: payMethod,
          payment_date: new Date().toISOString().substring(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el pago');

      setSalaries((prev) => prev.map((s) => (s.id === payingSalary.id ? data.salary : s)));
      setPayingSalary(null);
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setPayLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que deseas anular y eliminar este registro de sueldo?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/salaries/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSalaries((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert('Error al eliminar sueldo');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sueldos y Liquidaciones</h1>
          <p className="page-subtitle">
            Administrá los sueldos del personal, adelantos, premios y emities recibos oficiales
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Liquidar Sueldo
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="stat-card">
          <p className="stat-label">Total Liquidado</p>
          <p className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {formatCurrency(totalLiquidado)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {filtered.length} liquidaciones
          </span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total Pagado</p>
          <p className="stat-value" style={{ color: '#16a34a' }}>
            {formatCurrency(totalPagado)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Impactado en gastos del negocio
          </span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Pendiente de Pago</p>
          <p className="stat-value" style={{ color: totalPendiente > 0 ? '#ea580c' : 'var(--color-text-muted)' }}>
            {formatCurrency(totalPendiente)}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Por abonar al personal
          </span>
        </div>

        <div className="stat-card">
          <p className="stat-label">Personal Activo</p>
          <p className="stat-value">
            {teamMembers.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Usuarios registrados
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filters-bar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por empleado o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
        >
          <option value="">Todos los períodos</option>
          {availablePeriods.map((p) => (
            <option key={p} value={p}>
              Período: {p}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          <button
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.6rem' }}
            onClick={() => setFilterStatus('all')}
          >
            Todos
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.6rem' }}
            onClick={() => setFilterStatus('paid')}
          >
            Pagados
          </button>
          <button
            className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '0.25rem 0.6rem' }}
            onClick={() => setFilterStatus('pending')}
          >
            Pendientes
          </button>
        </div>
      </div>

      {/* Tabla de Sueldos */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontWeight: 600 }}>No hay liquidaciones de sueldo registradas</p>
            <p style={{ fontSize: '0.875rem' }}>Utilizá el botón &quot;Liquidar Sueldo&quot; para registrar pagos o acuerdos mensuales.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Empleado / Rol</th>
                <th>Período</th>
                <th>Sueldo Básico</th>
                <th>Adicionales / Desc.</th>
                <th>Total Neto</th>
                <th>Estado</th>
                <th>Detalle Pago</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const statusMeta = SALARY_STATUS_LABELS[s.status] || { label: s.status, badge: 'badge-gray' };
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.employee_name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.employee_role}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.period}</span>
                    </td>
                    <td>{formatCurrency(s.base_amount)}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {Number(s.bonus_amount) > 0 && (
                        <div style={{ color: '#16a34a' }}>+{formatCurrency(s.bonus_amount)}</div>
                      )}
                      {Number(s.deductions_amount) > 0 && (
                        <div style={{ color: '#dc2626' }}>-{formatCurrency(s.deductions_amount)}</div>
                      )}
                      {Number(s.bonus_amount) === 0 && Number(s.deductions_amount) === 0 && (
                        <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9375rem' }}>
                        {formatCurrency(s.total_amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {s.status === 'paid' ? (
                        <>
                          <div>{s.payment_date ? formatDate(s.payment_date) : '-'}</div>
                          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            {s.payment_method ? PAYMENT_METHOD_LABELS[s.payment_method] : 'Registrado'}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#ea580c', fontWeight: 500 }}>A liquidar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {s.status === 'pending' && (
                          <button
                            className="btn btn-sm btn-primary"
                            title="Marcar como Pagado"
                            onClick={() => setPayingSalary(s)}
                          >
                            Pagar
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          title="Ver e Imprimir Recibo"
                          onClick={() => setActiveReceipt(s)}
                        >
                          Recibo
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          title="Eliminar registro"
                          disabled={deletingId === s.id}
                          style={{ color: '#dc2626' }}
                          onClick={() => handleDelete(s.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para Crear Sueldo */}
      {showModal && (
        <SalaryModal
          teamMembers={teamMembers}
          onSaved={handleSalarySaved}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Modal Recibo de Sueldo Imprimible */}
      {activeReceipt && (
        <SalaryReceiptModal
          salary={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Modal Rápido para Confirmar Pago */}
      {payingSalary && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirmar Pago">
          <div className="modal" style={{ maxWidth: '420px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Confirmar Pago de Sueldo
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              ¿Confirmás el pago de <strong>{formatCurrency(payingSalary.total_amount)}</strong> a <strong>{payingSalary.employee_name}</strong>?
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Medio de Pago</label>
              <select
                className="form-input"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={payLoading}
                onClick={() => setPayingSalary(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                disabled={payLoading}
                onClick={handleMarkAsPaid}
              >
                {payLoading ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
