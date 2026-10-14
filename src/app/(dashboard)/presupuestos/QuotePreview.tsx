'use client';

import { useEffect, useState, useRef } from 'react';
import type { Quote, Customer, QuoteTemplate, QuoteItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  quote: Quote;
  customers: Customer[];
  template: QuoteTemplate | null;
  businessName: string;
  onClose: () => void;
}

export default function QuotePreview({ quote, customers, template, businessName, onClose }: Props) {
  const [items, setItems] = useState<QuoteItem[]>(quote.items ?? []);
  const [loading, setLoading] = useState(!quote.items);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quote.items) {
      fetch(`/api/quotes/${quote.id}/items`)
        .then((r) => r.json())
        .then((d) => { setItems(d.items ?? []); setLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customer = customers.find((c) => c.id === quote.customer_id);

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
        <title>${template?.title ?? 'PRESUPUESTO'} ${quote.quote_number}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
          .business-name { font-size: 20px; font-weight: 700; color: #1B4332; }
          .quote-title { font-size: 28px; font-weight: 800; text-align: right; color: #2D6A4F; }
          .quote-number { font-size: 14px; color: #666; text-align: right; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { background: #f8f7f4; border-radius: 8px; padding: 12px; }
          .info-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; margin-bottom: 4px; }
          .info-value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #1B4332; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px 12px; border-bottom: 1px solid #e5e3de; }
          tr:nth-child(even) td { background: #f8f7f4; }
          .totals { display: flex; justify-content: flex-end; }
          .totals-table { min-width: 240px; }
          .totals-table td { border-bottom: none; }
          .total-row td { font-size: 14px; font-weight: 700; border-top: 2px solid #2D6A4F; padding-top: 8px; color: #2D6A4F; }
          .footer { margin-top: 32px; font-size: 11px; color: #666; border-top: 1px solid #e5e3de; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  }

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="modal" style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Previsualización del presupuesto">
      <div className="modal" style={{ maxWidth: '820px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.125rem' }}>Vista previa – {quote.quote_number}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir / PDF
            </button>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Documento imprimible */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          <div
            ref={printRef}
            style={{
              background: '#fff', padding: '32px',
              border: '1px solid var(--color-border)', borderRadius: '8px',
              fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#1a1a1a',
            }}
          >
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'flex-start' }}>
              <div>
                <p className="business-name" style={{ fontSize: '20px', fontWeight: 800, color: '#1B4332', marginBottom: '4px' }}>
                  {template?.business_name ?? businessName}
                </p>
                <p style={{ fontSize: '11px', color: '#666' }}>Repuestos automotores</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '28px', fontWeight: 800, color: '#2D6A4F', lineHeight: 1 }}>
                  {template?.title ?? 'PRESUPUESTO'}
                </p>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Nro. {quote.quote_number}</p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  Fecha: {formatDate(quote.created_at)}
                </p>
                {quote.valid_until && (
                  <p style={{ fontSize: '11px', color: '#999' }}>
                    Válido hasta: {formatDate(quote.valid_until)}
                  </p>
                )}
              </div>
            </div>

            {/* Info cliente y vehículo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8f7f4', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', marginBottom: '6px' }}>
                  DATOS DEL CLIENTE
                </p>
                {customer ? (
                  <>
                    <p style={{ fontWeight: 700 }}>{customer.name}</p>
                    {customer.tax_id && <p style={{ fontSize: '11px', color: '#666' }}>CUIT: {customer.tax_id}</p>}
                    {customer.address && <p style={{ fontSize: '11px', color: '#666' }}>{customer.address}</p>}
                    {customer.phone && <p style={{ fontSize: '11px', color: '#666' }}>Tel: {customer.phone}</p>}
                    {customer.email && <p style={{ fontSize: '11px', color: '#666' }}>{customer.email}</p>}
                  </>
                ) : (
                  <p style={{ color: '#999' }}>Sin datos de cliente</p>
                )}
              </div>
              {(quote.vehicle_info || quote.vin) && (
                <div style={{ background: '#f8f7f4', borderRadius: '8px', padding: '12px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', marginBottom: '6px' }}>
                    VEHÍCULO
                  </p>
                  {quote.vehicle_info && <p style={{ fontWeight: 700 }}>{quote.vehicle_info}</p>}
                  {quote.vin && <p style={{ fontSize: '11px', color: '#666' }}>VIN/Patente: {quote.vin}</p>}
                </div>
              )}
            </div>

            {/* Tabla de ítems */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#1B4332', color: '#fff', padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                    SKU
                  </th>
                  <th style={{ background: '#1B4332', color: '#fff', padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                    Descripción
                  </th>
                  <th style={{ background: '#1B4332', color: '#fff', padding: '8px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', width: '70px' }}>
                    Cant.
                  </th>
                  <th style={{ background: '#1B4332', color: '#fff', padding: '8px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', width: '110px' }}>
                    P. Unit.
                  </th>
                  <th style={{ background: '#1B4332', color: '#fff', padding: '8px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', width: '110px' }}>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id ?? idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f7f4' }}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', fontSize: '11px', color: '#666' }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', fontWeight: 500 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'center' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right' }}>
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e3de', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <div style={{ minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e3de' }}>
                  <span style={{ color: '#666' }}>Subtotal:</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(quote.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e3de' }}>
                  <span style={{ color: '#666' }}>IVA ({quote.vat_rate}%):</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(quote.vat_amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', borderTop: '2px solid #2D6A4F' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px' }}>TOTAL:</span>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: '#2D6A4F' }}>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>

            {/* Condiciones */}
            {(quote.notes || template?.footer_text || template?.payment_terms) && (
              <div style={{ borderTop: '1px solid #e5e3de', paddingTop: '16px', fontSize: '11px', color: '#666' }}>
                {template?.payment_terms && (
                  <p style={{ marginBottom: '4px' }}><strong>Condiciones de pago:</strong> {template.payment_terms}</p>
                )}
                {quote.notes && <p style={{ marginBottom: '4px' }}>{quote.notes}</p>}
                {template?.footer_text && <p>{template.footer_text}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
