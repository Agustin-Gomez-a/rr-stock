import { type SessionPayload } from './auth';

export type UserRole = SessionPayload['role'];

export function canAccessBusiness(session: SessionPayload, businessId: string): boolean {
  if (session.role === 'superadmin') return true;
  return session.businessId === businessId;
}

export function isSuperAdmin(session: SessionPayload): boolean {
  return session.role === 'superadmin';
}

export function isAdmin(session: SessionPayload): boolean {
  return session.role === 'admin' || session.role === 'superadmin';
}

export function isManagerOrAbove(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager'].includes(session.role);
}

export function canManageProducts(session: SessionPayload): boolean {
  return isManagerOrAbove(session);
}

export function canManageSales(session: SessionPayload): boolean {
  return isManagerOrAbove(session);
}

export function canViewReports(session: SessionPayload): boolean {
  return isManagerOrAbove(session);
}
