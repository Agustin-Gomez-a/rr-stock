'use client';

import { useState } from 'react';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  business_name: string | null;
}

interface BusinessRow {
  id: string;
  name: string;
}

interface Props {
  user: UserRow | null;
  businesses: BusinessRow[];
  onSaved: (u: UserRow) => void;
  onClose: () => void;
}

export default function UserModal({ user, businesses, onSaved, onClose }: Props) {
  const isEdit = Boolean(user);
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'seller');
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('El nombre completo es requerido');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }
    if (!isEdit && !password.trim()) {
      setError('La contraseña es requerida');
      return;
    }
    if (!isEdit && !businessId) {
      setError('Debés asignar el usuario a un negocio');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/superadmin/users/${user!.id}` : '/api/superadmin/users';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: Record<string, any> = {
        full_name: fullName,
        email,
        role,
      };

      if (!isEdit) {
        body.business_id = businessId;
        body.password = password;
      } else if (password.trim()) {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar el usuario');
        return;
      }

      onSaved(data.user);
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar usuario' : 'Nuevo usuario'}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
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
            <label className="label">Nombre completo *</label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Email de acceso *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@warnesrepuestos.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Contraseña {isEdit ? '(dejar en blanco para no cambiar)' : '*'}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
              minLength={isEdit ? undefined : 6}
              required={!isEdit}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="label">Rol en el negocio *</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="seller">Vendedor</option>
                <option value="manager">Encargado / Manager</option>
                <option value="admin">Administrador de negocio</option>
              </select>
            </div>

            {!isEdit && (
              <div className="form-group">
                <label className="label">Asignar a negocio *</label>
                <select className="input" value={businessId} onChange={(e) => setBusinessId(e.target.value)} required>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
