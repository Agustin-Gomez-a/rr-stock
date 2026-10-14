'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionPayload } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/utils';

interface SidebarProps {
  session: SessionPayload;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: SessionPayload['role'][];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/catalogo',
    label: 'Catálogo',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
        <path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/>
      </svg>
    ),
  },
  {
    href: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: '/ventas',
    label: 'Ventas',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57l1.65-7.43H6"/>
      </svg>
    ),
  },
  {
    href: '/presupuestos',
    label: 'Presupuestos',
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
  {
    href: '/superadmin',
    label: 'Panel Maestro',
    roles: ['superadmin'],
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export default function Sidebar({ session, isOpen, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(session.role)
  );

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Navegación principal">
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#52B788" />
            <path d="M20 8L32 14V26L20 32L8 26V14L20 8Z" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="20" cy="20" r="4" fill="white" />
          </svg>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>
              Repuesto Control
            </p>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.6875rem' }}>
              {session.businessName ?? 'Plataforma'}
            </p>
          </div>
          {/* Botón cerrar en móvil */}
          <button
            onClick={onClose}
            className="lg:hidden btn btn-ghost ml-auto"
            aria-label="Cerrar menú"
            style={{ padding: '0.25rem', minHeight: 'auto', color: 'var(--sidebar-text)' }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Menú principal">
        <ul role="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Usuario y logout */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{
              width: '36px', height: '36px',
              background: 'var(--color-primary-light)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.875rem',
              flexShrink: 0,
            }}
          >
            {session.email[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p
              style={{
                color: '#fff', fontSize: '0.8125rem', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {session.email}
            </p>
            <p style={{ color: 'var(--sidebar-text)', fontSize: '0.6875rem' }}>
              {ROLE_LABELS[session.role]}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="btn btn-ghost"
          style={{
            width: '100%', justifyContent: 'flex-start',
            color: 'var(--sidebar-text)',
            gap: '0.625rem',
            padding: '0.5rem 0.75rem',
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
