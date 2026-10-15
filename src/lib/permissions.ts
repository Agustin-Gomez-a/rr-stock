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

// Permisos de ventas: tanto vendedor como cajero y admin pueden operar ventas
export function canCreateSale(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller', 'cashier'].includes(session.role);
}

export function canManageSales(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller', 'cashier'].includes(session.role);
}

// Permisos de catálogo y stock:
// - Vendedor puede crear repuestos y cargar stock (+), pero NO borrar stock ni productos
// - Cajero solo consulta
export function canCreateProduct(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller'].includes(session.role);
}

export function canEditProduct(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller'].includes(session.role);
}

export function canLoadStock(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller'].includes(session.role);
}

export function canReduceStock(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager'].includes(session.role);
}

export function canDeleteProduct(session: SessionPayload): boolean {
  return ['superadmin', 'admin'].includes(session.role);
}

export const canManageProducts = canCreateProduct;

// Permisos de equipo (agregar vendedores y cajeros)
export function canManageTeam(session: SessionPayload): boolean {
  return ['superadmin', 'admin'].includes(session.role);
}

// Permisos de gastos (luz, insumos, etc.)
export function canManageExpenses(session: SessionPayload): boolean {
  return ['superadmin', 'admin'].includes(session.role);
}

// Permisos de monitoreo y auditoría
export function canViewMonitoring(session: SessionPayload): boolean {
  return ['superadmin', 'admin'].includes(session.role);
}

// Permisos de reportes y presupuestos
export function canViewReports(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager'].includes(session.role);
}

export function canManageQuotes(session: SessionPayload): boolean {
  return ['superadmin', 'admin', 'manager', 'seller'].includes(session.role);
}

// Permisos de sueldos y liquidaciones de personal
export function canManageSalaries(session: SessionPayload): boolean {
  return ['superadmin', 'admin'].includes(session.role);
}


