'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Panel izquierdo – branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-2/5"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#52B788" />
            <path
              d="M20 8L32 14V26L20 32L8 26V14L20 8Z"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="20" cy="20" r="4" fill="white" />
          </svg>
          <div>
            <p className="text-white font-bold text-lg leading-none">Repuesto Control</p>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.8125rem' }}>Gestión Automotriz</p>
          </div>
        </div>

        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Gestioná tu negocio de repuestos con precisión
          </h1>
          <p style={{ color: 'var(--sidebar-text)' }} className="text-lg leading-relaxed">
            Inventario, ventas, presupuestos y clientes en un solo lugar. Diseñado para la realidad del taller argentino.
          </p>
        </div>

        <div style={{ color: 'var(--sidebar-text)', fontSize: '0.8125rem' }}>
          © {new Date().getFullYear()} Repuesto Control
        </div>
      </div>

      {/* Panel derecho – formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--color-primary)" />
              <path d="M20 8L32 14V26L20 32L8 26V14L20 8Z" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="20" cy="20" r="4" fill="white" />
            </svg>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>Repuesto Control</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Gestión Automotriz</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Iniciar sesión
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }} className="mb-8 text-sm">
            Ingresá tus credenciales para acceder
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="usuario@negocio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost"
                  style={{
                    position: 'absolute',
                    right: '0.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem 0.5rem',
                    minHeight: 'auto',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.25rem' }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: '1rem', height: '1rem',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Credenciales de acceso */}
          <div
            className="mt-6 p-4 rounded-lg text-xs"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary-dark)' }}
          >
            <p className="font-semibold mb-2">Accesos de Administrador:</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p><strong>Admin 1:</strong> admin1@admin.com (Emiliano)</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>Contraseña: rradmin123_</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                  onClick={() => {
                    setEmail('admin1@admin.com');
                    setPassword('rradmin123_');
                  }}
                >
                  Usar
                </button>
              </div>

              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <p><strong>Admin 2:</strong> admin2@admin.com (Freddy)</p>
                  <p style={{ color: 'var(--color-text-muted)' }}>Contraseña: rradmin123_</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                  onClick={() => {
                    setEmail('admin2@admin.com');
                    setPassword('rradmin123_');
                  }}
                >
                  Usar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
