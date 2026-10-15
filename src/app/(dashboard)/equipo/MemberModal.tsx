'use client';

import { useState } from 'react';
import type { User, UserRole } from '@/types';
import { ROLE_LABELS } from '@/lib/utils';

interface Props {
  onSaved: (user: User) => void;
  onClose: () => void;
}

export default function MemberModal({ onSaved, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('seller');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError('Ingresá el nombre completo'); return; }
    if (!email.trim()) { setError('Ingresá un correo o usuario válido'); return; }
    if (password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al crear el usuario');
        return;
      }
      onSaved(data.user);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Agregar miembro">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Agregar personal al negocio</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              Creá accesos para Vendedores o Cajeros
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
            <label className="label" htmlFor="m-name">Nombre y Apellido *</label>
            <input
              id="m-name"
              className="input"
              required
              placeholder="Ej: Marcos Rodríguez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="m-email">Correo electrónico / Usuario *</label>
            <input
              id="m-email"
              type="email"
              className="input"
              required
              placeholder="vendedor@rrstock.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="m-pass">Contraseña de acceso *</label>
            <input
              id="m-pass"
              type="password"
              className="input"
              required
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="m-role">Rol y Permisos *</label>
            <select
              id="m-role"
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="seller">Vendedor (Catálogo, Cargar stock, Ventas y Presupuestos)</option>
              <option value="cashier">Cajero (Ventas, Cobranzas y Consulta de Precios)</option>
              <option value="admin">Administrador (Acceso total al negocio y Monitoreo)</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem', lineHeight: 1.4 }}>
              {role === 'seller' && (
                <span>ℹ Los vendedores pueden cargar stock y registrar ventas, pero tienen bloqueado borrar stock o eliminar productos.</span>
              )}
              {role === 'cashier' && (
                <span>ℹ Los cajeros pueden registrar cobros y emitir tickets, pero no pueden alterar productos ni configuraciones.</span>
              )}
              {role === 'admin' && (
                <span>ℹ Los administradores tienen control total, gestión de personal, gastos y monitoreo de auditoría.</span>
              )}
            </p>
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
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
