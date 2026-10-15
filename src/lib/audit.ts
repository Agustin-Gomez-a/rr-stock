import { sql } from '@/lib/db';
import type { AuditActionType, UserRole, AuditLog } from '@/types';

export interface LogAuditParams {
  businessId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditActionType;
  details: string;
  amount?: number | null;
}

export async function logAudit({
  businessId,
  userId,
  userName,
  userRole,
  action,
  details,
  amount = null,
}: LogAuditParams): Promise<AuditLog | null> {
  try {
    const rows = await sql`
      INSERT INTO audit_logs (business_id, user_id, user_name, user_role, action, details, amount, created_at)
      VALUES (
        ${businessId},
        ${userId},
        ${userName},
        ${userRole},
        ${action},
        ${details},
        ${amount},
        NOW()
      )
      RETURNING id, business_id, user_id, user_name, user_role, action, details, amount, created_at
    `;
    return (rows[0] as AuditLog) ?? null;
  } catch (error) {
    console.error('[AuditLog] Error al registrar evento:', error);
    return null;
  }
}
