'use client';

import { useState, useMemo } from 'react';
import type { Expense } from '@/types';
import { formatCurrency, formatDate, EXPENSE_CATEGORY_LABELS } from '@/lib/utils';
import ExpenseModal from './ExpenseModal';

interface Props {
  initialExpenses: Expense[];
  initialTotalMonth: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  servicios: 'badge-yellow',
  insumos: 'badge-blue',
  alquiler: 'badge-purple',
  sueldos: 'badge-green',
  mantenimiento: 'badge-gray',
  impuestos: 'badge-red',
  otros: 'badge-gray',
};

export default function GastosClient({ initialExpenses, initialTotalMonth }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [modal, setModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.notes?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (e.created_by_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = !filterCategory || e.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [expenses, search, filterCategory]);

  const totalFiltered = useMemo(() => {
    return filtered.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filtered]);

  // Totales por categoría mes actual
  const serviciosTotal = useMemo(() => {
    return expenses.filter((e) => e.category === 'servicios').reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  const insumosTotal = useMemo(() => {
    return expenses.filter((e) => e.category === 'insumos').reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  function handleSaved(saved: Expense) {
    setExpenses((prev) => [saved, ...prev]);
    setModal(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este registro de gasto?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert('Error al eliminar el gasto');
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
          <h1>Control de Gastos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Registro de servicios (luz, agua, internet), insumos, alquileres y egresos
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Cargar nuevo gasto
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Total Gastos Registrados
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#DC2626' }}>
            {formatCurrency(totalFiltered)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Luz y Servicios
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#D97706' }}>
            {formatCurrency(serviciosTotal)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Electricidad, gas, internet, agua
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            Insumos y Operativos
          </p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB' }}>
            {formatCurrency(insumosTotal)}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Herramientas, limpieza, embalaje
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <svg
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar por concepto o notas..."
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ flex: '0 0 220px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Gastos */}
      <div className="table-container">
        <table className="table" aria-label="Lista de gastos">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Detalles / Notas</th>
              <th>Registrado por</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-border)' }}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <p>No hay gastos registrados todavía</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                    {formatDate(e.expense_date)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{e.title}</td>
                  <td>
                    <span className={`badge ${CATEGORY_COLORS[e.category] ?? 'badge-gray'}`}>
                      {EXPENSE_CATEGORY_LABELS[e.category] || e.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {e.notes || '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {e.created_by_name || 'Admin'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                    -{formatCurrency(e.amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.375rem', minHeight: 'auto', color: '#DC2626' }}
                      title="Eliminar gasto"
                      disabled={deletingId === e.id}
                      onClick={() => handleDelete(e.id)}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ExpenseModal
          onSaved={handleSaved}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}
