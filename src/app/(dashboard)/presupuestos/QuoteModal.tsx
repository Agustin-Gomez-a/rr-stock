'use client';

import { useState, useEffect } from 'react';
import type { Quote, Customer, Product, QuoteTemplate, QuoteItemForm } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  quote: Quote | null;
  customers: Customer[];
  products: Product[];
  template: QuoteTemplate | null;
  businessId: string;
  businessName: string;
  onSaved: (q: Quote) => void;
  onClose: () => void;
}

export default function QuoteModal({
  quote, customers, products, template, businessId, businessName, onSaved, onClose,
}: Props) {
  const isEdit = Boolean(quote);
  const defaultVat = template?.vat_rate ?? 21;

  const [customerId, setCustomerId] = useState(quote?.customer_id ?? '');
  const [vehicleInfo, setVehicleInfo] = useState(quote?.vehicle_info ?? '');
  const [vin, setVin] = useState(quote?.vin ?? '');
  const [vatRate, setVatRate] = useState(quote?.vat_rate ?? defaultVat);
  const [notes, setNotes] = useState(quote?.notes ?? '');
  const [validUntil, setValidUntil] = useState(quote?.valid_until ?? '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [items, setItems] = useState<QuoteItemForm[]>(
    quote?.items?.map((i) => ({
      product_id: i.product_id ?? undefined,
      sku: i.sku, name: i.name,
      quantity: i.quantity, unit_price: i.unit_price,
    })) ?? []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  // Cargar items del presupuesto existente
  useEffect(() => {
    if (isEdit && quote?.id && items.length === 0) {
      fetch(`/api/quotes/${quote.id}/items`)
        .then((r) => r.json())
        .then((d) => {
          if (d.items) setItems(d.items.map((i: QuoteItemForm & { unit_price: number }) => ({
            product_id: i.product_id, sku: i.sku, name: i.name,
            quantity: i.quantity, unit_price: i.unit_price,
          })));
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addProduct() {
    const p = products.find((pr) => pr.id === selectedProductId);
    if (!p) return;
    const existing = items.findIndex((i) => i.product_id === p.id);
    if (existing >= 0) {
      setItems((prev) => {
        const copy = [...prev];
        copy[existing] = { ...copy[existing], quantity: copy[existing].quantity + 1 };
        return copy;
      });
    } else {
      setItems((prev) => [...prev, {
        product_id: p.id, sku: p.sku, name: p.name,
        brand: p.supplier || p.category || '',
        quantity: 1, unit_price: p.price,
      }]);
    }
    setSelectedProductId('');
  }

  function updateItem(idx: number, key: 'quantity' | 'unit_price' | 'name' | 'brand' | 'sku', value: string | number) {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function addManualItem() {
    setItems((prev) => [...prev, { sku: '', name: '', brand: '', quantity: 1, unit_price: 0 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError('Agregá al menos un repuesto'); return; }
    setError('');
    setLoading(true);

    try {
      const url = isEdit ? `/api/quotes/${quote!.id}` : '/api/quotes';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId || null,
          vehicle_info: vehicleInfo || null,
          vin: vin || null,
          vat_rate: vatRate,
          notes: notes || null,
          valid_until: validUntil || null,
          items,
          businessId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al guardar'); return; }
      onSaved(data.quote);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
      <div className="modal" style={{ maxWidth: '760px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>{isEdit ? `Editar ${quote?.quote_number}` : 'Nuevo presupuesto'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Cerrar" style={{ padding: '0.375rem', minHeight: 'auto' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {/* Encabezado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="q-customer">Cliente</label>
              <select id="q-customer" className="input" value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="q-valid">Válido hasta</label>
              <input id="q-valid" type="date" className="input" value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="q-vehicle">Vehículo</label>
              <input id="q-vehicle" className="input" value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)} placeholder="Toyota Corolla 2020" />
            </div>
            <div>
              <label className="label" htmlFor="q-vin">VIN / Patente</label>
              <input id="q-vin" className="input" value={vin}
                onChange={(e) => setVin(e.target.value)} placeholder="AB 123 CD" />
            </div>
          </div>

          {/* Agregar producto */}
          <div style={{ background: 'var(--color-surface-2)', borderRadius: '8px', padding: '0.75rem' }}>
            <p className="label" style={{ marginBottom: '0.5rem' }}>Repuestos</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select className="input" style={{ flex: 1 }} value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}>
                <option value="">Seleccionar del catálogo...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>[{p.sku}] {p.name} – {formatCurrency(p.price)}</option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary"
                onClick={addProduct} disabled={!selectedProductId}>
                Del catálogo
              </button>
              <button type="button" className="btn btn-ghost" onClick={addManualItem}
                style={{ border: '1px dashed var(--color-border)' }}>
                Manual
              </button>
            </div>
          </div>

          {/* Tabla de ítems */}
          {items.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>SKU</th>
                    <th>Descripción</th>
                    <th style={{ width: '130px' }}>Marca</th>
                    <th style={{ width: '70px', textAlign: 'center' }}>Cant.</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>P. Unit.</th>
                    <th style={{ width: '105px', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ width: '36px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input className="input" value={item.sku}
                          onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                          readOnly={Boolean(item.product_id)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                          placeholder="SKU" />
                      </td>
                      <td>
                        <input className="input" value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                          placeholder="Descripción del repuesto" />
                      </td>
                      <td>
                        <input className="input" value={item.brand || ''}
                          onChange={(e) => updateItem(idx, 'brand', e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}
                          placeholder="Marca" />
                      </td>
                      <td>
                        <input type="number" className="input" min="1" step="1" value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ textAlign: 'center', padding: '0.25rem 0.375rem' }} />
                      </td>
                      <td>
                        <input type="number" className="input" min="0" step="0.01" value={item.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          style={{ textAlign: 'right', padding: '0.25rem 0.375rem' }} />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', paddingRight: '0.75rem' }}>
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td>
                        <button type="button" className="btn btn-ghost" onClick={() => removeItem(idx)}
                          style={{ padding: '0.25rem', minHeight: 'auto', color: 'var(--color-danger)' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal:</span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>IVA (%):</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <input type="number" className="input" min="0" max="100" step="0.5" value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    style={{ width: '70px', textAlign: 'right', padding: '0.25rem 0.5rem' }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(vatAmount)}</span>
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: '0.5rem', borderTop: '2px solid var(--color-border)',
                fontWeight: 700, fontSize: '1.0625rem',
              }}>
                <span>TOTAL:</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="q-notes">Condiciones / Notas</label>
            <textarea id="q-notes" className="input" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Este presupuesto tiene validez de 7 días hábiles."
              style={{ resize: 'vertical', minHeight: '60px' }} />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.625rem', borderRadius: '8px', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0}>
              {loading ? 'Guardando...' : 'Guardar presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
