import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canViewMonitoring } from '@/lib/permissions';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canViewMonitoring(session)) return NextResponse.json({ error: 'Sin permisos de monitoreo' }, { status: 403 });
  if (!session.businessId) return NextResponse.json({ error: 'Sin negocio' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const action = searchParams.get('action');

  let logs = await sql`
    SELECT id, business_id, user_id, user_name, user_role, action, details, amount::float, created_at
    FROM audit_logs
    WHERE business_id = ${session.businessId}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  if (role) {
    logs = logs.filter((l: any) => l.user_role === role);
  }
  if (action) {
    logs = logs.filter((l: any) => l.action === action);
  }

  return NextResponse.json({ logs });
}
