'use client';

import { useState, useMemo } from 'react';
import type { User, UserRole } from '@/types';
import { formatDate, ROLE_LABELS } from '@/lib/utils';
import MemberModal from './MemberModal';

interface Props {
  initialUsers: User[];
  currentUserId: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'badge-green',
  seller: 'badge-blue',
  cashier: 'badge-yellow',
  superadmin: 'badge-purple',
};

export default function EquipoClient({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal, setModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = !filterRole || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  function handleSaved(saved: User) {
    setUsers((prev) => [saved, ...prev]);
    setModal(false);
  }

  async function handleToggleStatus(u: User) {
    if (u.id === currentUserId) {
      alert('No podés desactivar tu propia cuenta');
      return;
    }
    const newStatus = !u.is_active;
    const confirmMsg = newStatus
      ? `¿Reactivar el acceso de ${u.full_name}?`
      : `¿Desactivar el acceso de ${u.full_name}? Ya no podrá ingresar al sistema.`;
    if (!confirm(confirmMsg)) return;

    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/team/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, is_active: newStatus } : item)));
      } else {
        alert('Error al actualizar estado del usuario');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Equipo y Personal</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Gestioná los vendedores, cajeros y administradores con acceso a este negocio
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo miembro
        </button>
      </div>

      {/* Info explicativa de roles */}
      <div
        className="card"
        style={{
          padding: '1rem',
          marginBottom: '1.25rem',
          background: 'var(--color-surface-2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            🟢 Administradores
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Acceso total, panel financiero de gastos, monitoreo y gestión de usuarios.
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            🔵 Vendedores
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Cargar stock (+), registrar clientes, presupuestos y ventas. <strong>Sin permiso para borrar stock</strong> ni ver finanzas.
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
            🟡 Cajeros
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Registrar y cobrar ventas, consulta de stock y catálogo. Sin permiso de modificación de catálogo ni gastos.
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
            placeholder="Buscar por nombre o correo..."
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ flex: '0 0 180px' }}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          aria-label="Filtrar por rol"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="seller">Vendedor</option>
          <option value="cashier">Cajero</option>
        </select>
      </div>

      {/* Tabla de Miembros */}
      <div className="table-container">
        <table className="table" aria-label="Lista de miembros del equipo">
          <thead>
            <tr>
              <th>Nombre y Apellido</th>
              <th>Correo / Usuario</th>
              <th>Rol asignado</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th>Fecha de alta</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p>No se encontraron miembros</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 600 }}>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--color-primary-light)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.full_name[0].toUpperCase()}
                        </div>
                        <span>{u.full_name}</span>
                        {isSelf && (
                          <span className="badge badge-gray" style={{ fontSize: '0.625rem' }}>
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {u.email}
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-gray'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {!isSelf && (
                        <button
                          className="btn btn-secondary text-xs"
                          style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                          disabled={togglingId === u.id}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.is_active ? 'Desactivar' : 'Reactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <MemberModal
          onSaved={handleSaved}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}
