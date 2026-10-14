'use client';

import { useState } from 'react';
import { formatCurrency, formatDate, SUBSCRIPTION_STATUS_LABELS, ROLE_LABELS } from '@/lib/utils';
import BusinessModal from './BusinessModal';
import UserModal from './UserModal';
import SubscriptionModal from './SubscriptionModal';

interface BusinessRow {
  id: string; name: string; slug: string; created_at: string;
  sub_type: string | null; sub_status: string | null;
  sub_amount: number | null; sub_expires_at: string | null;
  sub_last_payment: string | null; user_count: number;
}

interface UserRow {
  id: string; email: string; full_name: string; role: string;
  is_active: boolean; created_at: string; business_name: string | null;
}

interface Props {
  businesses: BusinessRow[];
  users: UserRow[];
}

const SUB_BADGE: Record<string, string> = {
  active: 'badge-green', suspended: 'badge-red', expired: 'badge-yellow',
};

export default function SuperadminClient({ businesses: initialBusinesses, users: initialUsers }: Props) {
  const [businesses, setBusinesses] = useState<BusinessRow[]>(initialBusinesses);
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [tab, setTab] = useState<'businesses' | 'users'>('businesses');
  const [businessModal, setBusinessModal] = useState<BusinessRow | 'new' | null>(null);
  const [userModal, setUserModal] = useState<UserRow | 'new' | null>(null);
  const [subModal, setSubModal] = useState<BusinessRow | null>(null);

  function handleBusinessSaved(saved: BusinessRow) {
    setBusinesses((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
      return [saved, ...prev];
    });
    setBusinessModal(null);
  }

  function handleUserSaved(saved: UserRow) {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === saved.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
      return [saved, ...prev];
    });
    setUserModal(null);
  }

  async function toggleBusinessAccess(business: BusinessRow) {
    const newStatus = business.sub_status === 'active' ? 'suspended' : 'active';
    const res = await fetch(`/api/superadmin/businesses/${business.id}/subscription`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? { ...b, sub_status: newStatus } : b))
      );
    }
  }

  async function toggleUserActive(user: UserRow) {
    const res = await fetch(`/api/superadmin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Panel Maestro</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} · {users.length} usuario{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tab === 'businesses' ? (
            <button className="btn btn-primary" onClick={() => setBusinessModal('new')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo negocio
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setUserModal('new')}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-border)' }}>
        {(['businesses', 'users'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'none', border: 'none',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--color-primary)' : 'transparent'}`,
              marginBottom: '-2px',
              fontSize: '0.9375rem',
              transition: 'color 0.15s',
            }}
          >
            {t === 'businesses' ? 'Negocios' : 'Usuarios'}
          </button>
        ))}
      </div>

      {/* Tabla de negocios */}
      {tab === 'businesses' && (
        <div className="table-container">
          <table className="table" aria-label="Lista de negocios">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Slug</th>
                <th style={{ textAlign: 'center' }}>Usuarios</th>
                <th>Plan</th>
                <th style={{ textAlign: 'right' }}>Importe</th>
                <th>Vence</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {businesses.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state"><p>No hay negocios registrados</p></div>
                </td></tr>
              ) : (
                businesses.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td>
                      <code style={{ fontSize: '0.8125rem', background: 'var(--color-surface-2)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                        {b.slug}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue">{b.user_count}</span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {b.sub_type === 'monthly' ? 'Mensual' : b.sub_type === 'fixed' ? 'Pago fijo' : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>
                      {b.sub_amount ? formatCurrency(b.sub_amount) : '—'}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {b.sub_expires_at ? formatDate(b.sub_expires_at) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {b.sub_status ? (
                        <span className={`badge ${SUB_BADGE[b.sub_status] ?? 'badge-gray'}`}>
                          {SUBSCRIPTION_STATUS_LABELS[b.sub_status] ?? b.sub_status}
                        </span>
                      ) : (
                        <span className="badge badge-gray">Sin suscripción</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setBusinessModal(b)}
                          title="Editar negocio"
                          style={{ padding: '0.375rem', minHeight: 'auto' }}
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => setSubModal(b)}
                          title="Gestionar suscripción"
                          style={{ padding: '0.375rem', minHeight: 'auto', color: 'var(--color-info)' }}
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                        </button>
                        {b.sub_status && (
                          <button
                            className="btn btn-ghost"
                            onClick={() => toggleBusinessAccess(b)}
                            title={b.sub_status === 'active' ? 'Suspender acceso' : 'Reactivar acceso'}
                            style={{
                              padding: '0.375rem', minHeight: 'auto',
                              color: b.sub_status === 'active' ? 'var(--color-danger)' : 'var(--color-success)',
                            }}
                          >
                            {b.sub_status === 'active' ? (
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                              </svg>
                            ) : (
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de usuarios */}
      {tab === 'users' && (
        <div className="table-container">
          <table className="table" aria-label="Lista de usuarios">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Negocio</th>
                <th>Alta</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No hay usuarios</p></div></td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{u.email}</td>
                    <td><span className="badge badge-gray">{ROLE_LABELS[u.role] ?? u.role}</span></td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{u.business_name ?? '—'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(u.created_at)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => toggleUserActive(u)}
                          title={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                          style={{
                            padding: '0.375rem', minHeight: 'auto',
                            color: u.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                          }}
                        >
                          {u.is_active ? (
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                          ) : (
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      {businessModal !== null && (
        <BusinessModal
          business={businessModal === 'new' ? null : businessModal}
          onSaved={handleBusinessSaved}
          onClose={() => setBusinessModal(null)}
        />
      )}
      {userModal !== null && (
        <UserModal
          user={userModal === 'new' ? null : userModal}
          businesses={businesses}
          onSaved={handleUserSaved}
          onClose={() => setUserModal(null)}
        />
      )}
      {subModal !== null && (
        <SubscriptionModal
          business={subModal}
          onSaved={(updated: Partial<BusinessRow> & { id: string }) => {
            setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
            setSubModal(null);
          }}
          onClose={() => setSubModal(null)}
        />
      )}
    </div>
  );
}
