'use client';

import { useRef } from 'react';
import type { Salary } from '@/types';
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from '@/lib/utils';

interface Props {
  salary: Salary;
  onClose: () => void;
}

export default function SalaryReceiptModal({ salary, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es-AR">
      <head>
        <meta charset="UTF-8">
        <title>Recibo de Haberes - ${salary.employee_name} (${salary.period})</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1B4332; padding-bottom: 12px; margin-bottom: 20px; }
          .business-title { font-size: 20px; font-weight: bold; color: #1B4332; }
          .receipt-title { font-size: 22px; font-weight: bold; text-align: right; color: #2D6A4F; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .box { background: #f8f7f4; padding: 12px; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #1B4332; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px; border-bottom: 1px solid #e5e3de; }
          .total-box { margin-left: auto; width: 300px; margin-bottom: 30px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e3de; }
          .total-final { font-size: 16px; font-weight: bold; color: #1B4332; border-top: 2px solid #1B4332; border-bottom: none; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sign-line { border-top: 1px solid #999; text-align: center; padding-top: 8px; font-size: 12px; color: #444; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Recibo de Sueldo">
      <div className="modal" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recibo de Haberes</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir Recibo
            </button>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>

        {/* Printable slip */}
        <div
          ref={printRef}
          style={{
            background: '#fff',
            padding: '24px',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: '#1a1a1a',
            fontSize: '13px',
          }}
        >
          <div className="header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1B4332', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <p className="business-title" style={{ fontSize: '18px', fontWeight: 800, color: '#1B4332' }}>
                RR REPUESTOS & LUBRICANTES
              </p>
              <p style={{ fontSize: '11px', color: '#666' }}>Av. Martín Berho 532, San Miguel de Tucumán</p>
              <p style={{ fontSize: '11px', color: '#666' }}>CUIT: 20-33703597-4 | Tel: 3815853438</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="receipt-title" style={{ fontSize: '18px', fontWeight: 800, color: '#2D6A4F' }}>
                RECIBO DE HABERES
              </p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>Período: <strong>{salary.period}</strong></p>
              <p style={{ fontSize: '11px', color: '#999' }}>Estado: <strong>{salary.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}</strong></p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8f7f4', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>EMPLEADO / BENEFICIARIO</p>
              <p style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>{salary.employee_name}</p>
              <p style={{ fontSize: '12px', color: '#555' }}>Puesto / Rol: {salary.employee_role}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', fontWeight: 600 }}>INFORMACIÓN DE PAGO</p>
              <p style={{ fontSize: '12px', marginTop: '2px' }}>Fecha de Pago: {salary.payment_date ? formatDate(salary.payment_date) : 'Pendiente'}</p>
              <p style={{ fontSize: '12px' }}>Forma de Pago: {salary.payment_method ? PAYMENT_METHOD_LABELS[salary.payment_method] : 'A definir'}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ background: '#1B4332', color: '#fff', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Concepto</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Remunerativo (+)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', width: '130px' }}>Descuentos (-)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de' }}>Sueldo Básico</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', fontWeight: 500 }}>
                  {formatCurrency(salary.base_amount)}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', color: '#999' }}>-</td>
              </tr>
              {Number(salary.bonus_amount) > 0 && (
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de' }}>Comisiones / Adicionales / Premios</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', fontWeight: 500 }}>
                    +{formatCurrency(salary.bonus_amount)}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', color: '#999' }}>-</td>
                </tr>
              )}
              {Number(salary.deductions_amount) > 0 && (
                <tr>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de' }}>Adelantos / Retenciones / Descuentos</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', color: '#999' }}>-</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', color: '#DC2626', fontWeight: 500 }}>
                    -{formatCurrency(salary.deductions_amount)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px', background: '#f8f7f4', padding: '12px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#666' }}>Subtotal Bruto:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(salary.base_amount + salary.bonus_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#666' }}>Total Descuentos:</span>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>-{formatCurrency(salary.deductions_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1B4332', paddingTop: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#1B4332' }}>TOTAL NETO:</span>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#1B4332' }}>{formatCurrency(salary.total_amount)}</span>
              </div>
            </div>
          </div>

          {salary.notes && (
            <div style={{ marginBottom: '24px', fontSize: '11px', color: '#666', background: '#fff', border: '1px dashed #ccc', padding: '8px 12px', borderRadius: '4px' }}>
              <strong>Observaciones:</strong> {salary.notes}
            </div>
          )}

          <div className="signatures" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
            <div className="sign-line" style={{ borderTop: '1px solid #777', textAlign: 'center', paddingTop: '6px', fontSize: '11px', color: '#555' }}>
              Firma y Aclaración del Empleador
            </div>
            <div className="sign-line" style={{ borderTop: '1px solid #777', textAlign: 'center', paddingTop: '6px', fontSize: '11px', color: '#555' }}>
              Firma y Aclaración del Empleado (Conforme)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
