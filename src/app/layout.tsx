import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Repuesto Control',
    default: 'Repuesto Control – Gestión Automotriz',
  },
  description:
    'Sistema integral de gestión para negocios de repuestos automotores. Inventario, ventas, presupuestos y más.',
  keywords: ['repuestos', 'autopartes', 'gestión', 'inventario', 'ventas'],
  authors: [{ name: 'Repuesto Control' }],
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
