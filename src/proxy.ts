import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Permitir activos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('rc_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('rc_session');
    return response;
  }

  // Solo superadmin puede acceder al panel maestro
  if (pathname.startsWith('/superadmin') && session.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rutas exclusivas para Administradores (monitoreo, equipo, gastos, sueldos)
  if (
    (pathname.startsWith('/monitoreo') ||
      pathname.startsWith('/equipo') ||
      pathname.startsWith('/gastos') ||
      pathname.startsWith('/sueldos')) &&
    session.role !== 'admin' &&
    session.role !== 'superadmin'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Cajeros no acceden a presupuestos
  if (pathname.startsWith('/presupuestos') && session.role === 'cashier') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
