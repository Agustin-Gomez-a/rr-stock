'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionPayload } from '@/lib/auth';
import Sidebar from './Sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
  session: SessionPayload;
}

export default function DashboardShell({ children, session }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <>
      {/* Overlay móvil */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar
        session={session}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <main className="main-content">
        {/* Topbar mobile */}
        <div
          className="flex items-center gap-3 mb-6 lg:hidden"
          style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost"
            aria-label="Abrir menú"
            style={{ padding: '0.5rem', minHeight: 'auto' }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="var(--color-primary)" />
              <path d="M20 8L32 14V26L20 32L8 26V14L20 8Z" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="20" cy="20" r="4" fill="white" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
              Repuesto Control
            </span>
          </div>
        </div>

        {children}
      </main>
    </>
  );
}
