import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateQuoteNumber(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(5, '0')}`;
}

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  manager: 'Gerente',
  seller: 'Vendedor',
  cashier: 'Cajero',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  suspended: 'Suspendida',
  expired: 'Vencida',
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  servicios: 'Luz y Servicios (Agua/Gas/Internet)',
  insumos: 'Insumos de Taller y Embalaje',
  alquiler: 'Alquiler del Local / Depósito',
  sueldos: 'Sueldos y Comisiones',
  mantenimiento: 'Mantenimiento y Reparaciones',
  impuestos: 'Impuestos y Tasas',
  otros: 'Otros Gastos Operativos',
};

export const AUDIT_ACTION_LABELS: Record<string, { label: string; badge: string }> = {
  VENTA_REGISTRADA: { label: 'Venta Registrada', badge: 'badge-green' },
  VENTA_ESTADO: { label: 'Estado de Venta', badge: 'badge-blue' },
  STOCK_CARGADO: { label: 'Carga de Stock', badge: 'badge-green' },
  STOCK_AJUSTADO: { label: 'Ajuste de Stock', badge: 'badge-yellow' },
  PRODUCTO_CREADO: { label: 'Producto Creado', badge: 'badge-blue' },
  PRODUCTO_EDITADO: { label: 'Producto Editado', badge: 'badge-gray' },
  PRODUCTO_ELIMINADO: { label: 'Producto Eliminado', badge: 'badge-red' },
  GASTO_REGISTRADO: { label: 'Gasto Registrado', badge: 'badge-yellow' },
  GASTO_ELIMINADO: { label: 'Gasto Eliminado', badge: 'badge-red' },
  CLIENTE_CREADO: { label: 'Cliente Creado', badge: 'badge-blue' },
  CLIENTE_EDITADO: { label: 'Cliente Editado', badge: 'badge-gray' },
  USUARIO_CREADO: { label: 'Usuario Creado', badge: 'badge-green' },
  USUARIO_ESTADO: { label: 'Estado de Usuario', badge: 'badge-yellow' },
  PRESUPUESTO_CREADO: { label: 'Presupuesto Creado', badge: 'badge-blue' },
  PRESUPUESTO_ESTADO: { label: 'Estado de Presupuesto', badge: 'badge-gray' },
  SUELDO_REGISTRADO: { label: 'Sueldo Liquidado', badge: 'badge-blue' },
  SUELDO_PAGADO: { label: 'Sueldo Pagado', badge: 'badge-green' },
  SUELDO_ELIMINADO: { label: 'Sueldo Anulado', badge: 'badge-red' },
  ACCESO_EXITOSO: { label: 'Acceso Exitoso', badge: 'badge-green' },
  ACCESO_FALLIDO: { label: 'Acceso Bloqueado / Fallido', badge: 'badge-red' },
};

export const SALARY_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pendiente de Pago', badge: 'badge-yellow' },
  paid: { label: 'Pagado', badge: 'badge-green' },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia Bancaria',
  cheque: 'Cheque',
};


