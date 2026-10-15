'use client';

import { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Quote, Customer, QuoteTemplate, QuoteItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  quote: Quote;
  customers: Customer[];
  template: QuoteTemplate | null;
  businessName: string;
  onClose: () => void;
}

export default function QuotePreview({ quote, customers, template, onClose }: Props) {
  const [items, setItems] = useState<QuoteItem[]>(quote.items ?? []);
  const [loading, setLoading] = useState(!quote.items);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quote.items) {
      fetch(`/api/quotes/${quote.id}/items`)
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items ?? []);
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customer = customers.find((c) => c.id === quote.customer_id);

  const formattedQuoteNumber = quote.quote_number.includes('-')
    ? quote.quote_number
    : `0001-${quote.quote_number.replace(/\D/g, '').padStart(8, '0')}`;

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
        <title>PRESUPUESTO ${formattedQuoteNumber} - RR REPUESTOS & LUBRICANTES</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 35px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1B4332; padding-bottom: 14px; margin-bottom: 18px; }
          .business-name { font-size: 20px; font-weight: 800; color: #1B4332; }
          .business-sub { font-size: 11px; color: #444; margin-top: 2px; }
          .quote-title { font-size: 24px; font-weight: 800; text-align: right; color: #2D6A4F; }
          .quote-number { font-size: 13px; color: #333; text-align: right; font-weight: bold; margin-top: 3px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
          .info-box { background: #f8f7f4; border: 1px solid #e5e3de; border-radius: 6px; padding: 10px 14px; }
          .info-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #1B4332; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11.5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          th { background: #1B4332; color: white; padding: 8px 10px; text-align: left; font-size: 10.5px; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #e5e3de; font-size: 11.5px; }
          tr:nth-child(even) td { background: #faf9f6; }
          .totals-wrap { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; }
          .terms-box { width: 55%; font-size: 11px; color: #555; background: #fdfdfc; border: 1px solid #eee; padding: 10px; border-radius: 6px; }
          .totals-table { width: 40%; min-width: 260px; }
          .totals-table td { border-bottom: 1px solid #e5e3de; padding: 6px 8px; }
          .total-final td { font-size: 15px; font-weight: 800; border-top: 2px solid #1B4332; border-bottom: none; color: #1B4332; padding-top: 8px; }
          @media print { body { padding: 15px; } }
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

  function handleExportExcel() {
    const wb = XLSX.utils.book_new();

    // Estructura idéntica a Presupuesto_RR_Repuestos_Lubricantess.xlsx
    const rows: (string | number | null)[][] = [
      [null, null, null, 'RR REPUESTOS & LUBRICANTES'],
      [null, null, null, 'Av. Martín Berho 532'],
      [null, null, null, 'San Miguel de Tucumán, Argentina'],
      [null, null, null, 'CUIT: 20-33703597-4'],
      [null, null, null, 'Teléfono / WhatsApp: 3815853438 - 3816241623'],
      [null, null, null, 'fredymolinasouza@hotmail.com'],
      [null, null, null, 'N.º Presupuesto', formattedQuoteNumber],
      [null, null, null, 'Fecha', formatDate(quote.created_at)],
      [],
      ['DATOS DEL CLIENTE'],
      ['Razón Social:', customer?.name ?? 'Consumidor Final', null, 'DNI / CUIT:', customer?.tax_id ?? '-'],
      ['Teléfono:', customer?.phone ?? '-', null, 'Email:', customer?.email ?? '-'],
      ['Domicilio:', customer?.address ?? '-', null, 'Localidad:', 'San Miguel de Tucumán'],
      ['Vehículo:', quote.vehicle_info ?? '-', null, 'Año / Versión:', quote.vin ?? '-'],
      [],
      ['DETALLE DE REPUESTOS'],
      ['Código', 'Descripción del repuesto', 'Marca', 'Cant.', 'Precio unitario (ARS)', 'Importe (ARS)'],
    ];

    items.forEach((item) => {
      rows.push([
        item.sku,
        item.name,
        item.brand || 'Original/Alternativo',
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);
    });

    const emptyNeeded = Math.max(0, 8 - items.length);
    for (let i = 0; i < emptyNeeded; i++) {
      rows.push([null, null, null, null, null, null]);
    }

    rows.push([]);
    rows.push([
      'Validez de la oferta:',
      quote.valid_until ? formatDate(quote.valid_until) : '7 días hábiles',
      'Disponibilidad:',
      'Inmediata / A pedido',
      'Subtotal (ARS)',
      quote.subtotal,
    ]);
    rows.push([
      'Forma de pago:',
      template?.payment_terms || 'Efectivo / Transferencia',
      'Entrega:',
      'Mostrador / Envío',
      'Alícuota IVA',
      `${quote.vat_rate}%`,
    ]);
    rows.push([
      'Observaciones:',
      quote.notes || 'Precios sujetos a variación sin previo aviso.',
      null,
      null,
      'IVA (ARS)',
      quote.vat_amount,
    ]);
    rows.push([null, null, null, null, 'TOTAL (ARS)', quote.total]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
      { wch: 16 },
      { wch: 40 },
      { wch: 18 },
      { wch: 8 },
      { wch: 22 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto');
    XLSX.writeFile(wb, `Presupuesto_${formattedQuoteNumber}_RR_Repuestos.xlsx`);
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
      <div className="modal" style={{ maxWidth: '850px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Presupuesto – {formattedQuoteNumber}</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Plantilla oficial RR Repuestos & Lubricantes
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleExportExcel}
              style={{ background: '#0F766E', color: '#fff', borderColor: '#0F766E' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="16" y2="17"/>
              </svg>
              Descargar Excel (.xlsx)
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir / PDF
            </button>
            <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Documento imprimible */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          <div
            ref={printRef}
            style={{
              background: '#fff',
              padding: '32px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '12px',
              color: '#1a1a1a',
            }}
          >
            {/* Encabezado RR REPUESTOS */}
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #1B4332', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <p className="business-name" style={{ fontSize: '20px', fontWeight: 800, color: '#1B4332' }}>
                  RR REPUESTOS & LUBRICANTES
                </p>
                <p className="business-sub" style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                  Av. Martín Berho 532, San Miguel de Tucumán, Argentina
                </p>
                <p className="business-sub" style={{ fontSize: '11px', color: '#444' }}>
                  CUIT: <strong>20-33703597-4</strong> | Tel/WhatsApp: <strong>3815853438 - 3816241623</strong>
                </p>
                <p className="business-sub" style={{ fontSize: '11px', color: '#444' }}>
                  Email: fredymolinasouza@hotmail.com
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="quote-title" style={{ fontSize: '24px', fontWeight: 800, color: '#2D6A4F' }}>
                  PRESUPUESTO
                </p>
                <p className="quote-number" style={{ fontSize: '13px', color: '#333', fontWeight: 'bold', marginTop: '3px' }}>
                  N.º {formattedQuoteNumber}
                </p>
                <p style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  Fecha: {formatDate(quote.created_at)}
                </p>
                {quote.valid_until && (
                  <p style={{ fontSize: '11px', color: '#666' }}>
                    Válido hasta: {formatDate(quote.valid_until)}
                  </p>
                )}
              </div>
            </div>

            {/* Datos del Cliente y Vehículo */}
            <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div className="info-box" style={{ background: '#f8f7f4', border: '1px solid #e5e3de', borderRadius: '6px', padding: '10px 14px' }}>
                <p className="info-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1B4332', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px' }}>
                  DATOS DEL CLIENTE
                </p>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Razón Social:</span>
                  <strong>{customer ? customer.name : (quote.customer_name || 'Consumidor Final')}</strong>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>DNI / CUIT:</span>
                  <span>{customer?.tax_id || '-'}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Teléfono:</span>
                  <span>{customer?.phone || '-'}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Email:</span>
                  <span>{customer?.email || '-'}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Domicilio:</span>
                  <span>{customer?.address || 'San Miguel de Tucumán'}</span>
                </div>
              </div>

              <div className="info-box" style={{ background: '#f8f7f4', border: '1px solid #e5e3de', borderRadius: '6px', padding: '10px 14px' }}>
                <p className="info-title" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1B4332', fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px' }}>
                  VEHÍCULO Y CONDICIONES
                </p>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Vehículo:</span>
                  <strong>{quote.vehicle_info || 'A coordinar'}</strong>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Año / Versión:</span>
                  <span>{quote.vin || '-'}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Disponibilidad:</span>
                  <span>Inmediata / A pedido</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#666' }}>Forma de Pago:</span>
                  <span>{template?.payment_terms || 'Efectivo / Transferencia'}</span>
                </div>
                <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Entrega:</span>
                  <span>Mostrador / Envío</span>
                </div>
              </div>
            </div>

            {/* Tabla Detalle de Repuestos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '18px' }}>
              <thead>
                <tr style={{ background: '#1B4332', color: '#fff' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10.5px' }}>Código</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10.5px' }}>Descripción del repuesto</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10.5px' }}>Marca</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10.5px', width: '60px' }}>Cant.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10.5px', width: '120px' }}>Precio Unit.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: '10.5px', width: '120px' }}>Importe (ARS)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id ?? idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fcfbfa' }}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', fontFamily: 'monospace', color: '#555' }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', fontWeight: 600 }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', color: '#666' }}>
                      {item.brand || 'Original/Alternativo'}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', textAlign: 'center' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', textAlign: 'right' }}>
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e3de', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales y Observaciones */}
            <div className="totals-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '10px' }}>
              <div className="terms-box" style={{ width: '55%', fontSize: '11px', color: '#555', background: '#fdfdfc', border: '1px solid #eee', padding: '10px', borderRadius: '6px' }}>
                <p style={{ fontWeight: 700, color: '#1B4332', marginBottom: '4px' }}>OBSERVACIONES Y CONDICIONES:</p>
                <p style={{ marginBottom: '3px' }}>• Validez de la oferta: {quote.valid_until ? formatDate(quote.valid_until) : '7 días corridos'}.</p>
                <p style={{ marginBottom: '3px' }}>• Precios cotizados en Pesos Argentinos (ARS) sujetos a disponibilidad de stock.</p>
                {quote.notes && <p style={{ marginTop: '4px', fontStyle: 'italic' }}>&quot;{quote.notes}&quot;</p>}
              </div>

              <div className="totals-table" style={{ width: '40%', minWidth: '260px' }}>
                <table style={{ width: '100%', marginBottom: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ color: '#555', padding: '6px 8px' }}>Subtotal:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, padding: '6px 8px' }}>{formatCurrency(quote.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: '#555', padding: '6px 8px' }}>IVA ({quote.vat_rate}%):</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, padding: '6px 8px' }}>{formatCurrency(quote.vat_amount)}</td>
                    </tr>
                    <tr className="total-final">
                      <td style={{ fontSize: '15px', fontWeight: 800, borderTop: '2px solid #1B4332', color: '#1B4332', paddingTop: '8px' }}>TOTAL:</td>
                      <td style={{ textAlign: 'right', fontSize: '16px', fontWeight: 800, borderTop: '2px solid #1B4332', color: '#1B4332', paddingTop: '8px' }}>
                        {formatCurrency(quote.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
