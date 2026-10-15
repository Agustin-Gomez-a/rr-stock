'use client';

import { useState, useMemo } from 'react';
import type { Product, UserRole } from '@/types';
import { formatCurrency } from '@/lib/utils';
import ProductModal from './ProductModal';
import StockAdjustModal from './StockAdjustModal';

interface Props {
  initialProducts: Product[];
  categories: string[];
  userRole: UserRole;
  businessId: string;
}

export default function CatalogoClient({
  initialProducts,
  categories,
  userRole,
  businessId,
}: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [productModal, setProductModal] = useState<Product | 'new' | null>(null);
  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isSeller = userRole === 'seller';
  const isCashier = userRole === 'cashier';

  const canAdd = isAdmin || isSeller;
  const canEdit = isAdmin || isSeller;
  const canAdjust = isAdmin || isSeller;
  const canDelete = isAdmin;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplier?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = !filterCategory || p.category === filterCategory;
      const matchStock =
        filterStock === '' ||
        (filterStock === 'low' && p.quantity <= p.min_stock) ||
        (filterStock === 'ok' && p.quantity > p.min_stock) ||
        (filterStock === 'zero' && p.quantity === 0);
      return matchSearch && matchCat && matchStock && p.is_active;
    });
  }, [products, search, filterCategory, filterStock]);

  function handleSaved(saved: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setProductModal(null);
  }

  function handleStockAdjusted(updated: Product) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setStockModal(null);
  }

  async function handleDeleteProduct(p: Product) {
    if (!confirm(`¿Seguro que deseas eliminar el repuesto "${p.name}" (${p.sku}) del catálogo?`)) return;
    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
      } else {
        const data = await res.json();
        alert(data.error ?? 'Error al eliminar el producto');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Catálogo de repuestos</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} repuesto{filtered.length !== 1 ? 's' : ''} registrado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setProductModal('new')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar repuesto
          </button>
        )}
      </div>

      {isCashier && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: '#854D0E',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ℹ</span>
          <span><strong>Modo Consulta (Caja):</strong> Podés consultar precios, compatibilidades y disponibilidad de stock para informar a los clientes o realizar ventas.</span>
        </div>
      )}

      {isSeller && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: '#1E40AF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ℹ</span>
          <span><strong>Modo Vendedor:</strong> Podés dar de alta repuestos y cargar ingresos de stock (+). Recordá que la eliminación de productos o reducción de inventario requiere autorización de un Administrador.</span>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <svg
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar por nombre, SKU o proveedor..."
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ flex: '0 0 160px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input"
          style={{ flex: '0 0 160px' }}
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          aria-label="Filtrar por stock"
        >
          <option value="">Todo el stock</option>
          <option value="ok">Stock normal</option>
          <option value="low">Stock bajo</option>
          <option value="zero">Sin stock</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table" aria-label="Catálogo de repuestos">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Proveedor</th>
              <th style={{ textAlign: 'right' }}>Precio</th>
              <th style={{ textAlign: 'right' }}>Stock disponible</th>
              <th style={{ textAlign: 'right' }}>Mínimo</th>
              {(canAdjust || canEdit || canDelete) && <th style={{ textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={(canAdjust || canEdit || canDelete) ? 8 : 7}>
                  <div className="empty-state">
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--color-border)' }}>
                      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                    </svg>
                    <p>No se encontraron productos en el catálogo</p>
                    {canAdd && (
                      <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setProductModal('new')}>
                        Agregar primer repuesto
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isLow = p.quantity <= p.min_stock && p.quantity > 0;
                const isZero = p.quantity === 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <code style={{ fontSize: '0.8125rem', background: 'var(--color-surface-2)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                        {p.sku}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500, maxWidth: '220px' }}>
                      {p.name}
                      {p.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td>
                      {p.category ? <span className="badge badge-gray">{p.category}</span> : '—'}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {p.supplier ?? '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrency(p.price)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`badge ${isZero ? 'badge-red' : isLow ? 'badge-yellow' : 'badge-green'}`}>
                        {p.quantity} u.
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                      {p.min_stock} u.
                    </td>
                    {(canAdjust || canEdit || canDelete) && (
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                          {canAdjust && (
                            <button
                              className="btn btn-ghost"
                              onClick={() => setStockModal(p)}
                              title={isSeller ? 'Cargar stock (+)' : 'Ajustar stock'}
                              style={{ padding: '0.375rem', minHeight: 'auto', color: 'var(--color-primary)' }}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                            </button>
                          )}
                          {canEdit && (
                            <button
                              className="btn btn-ghost"
                              onClick={() => setProductModal(p)}
                              title="Editar producto"
                              style={{ padding: '0.375rem', minHeight: 'auto' }}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleDeleteProduct(p)}
                              title="Eliminar repuesto"
                              disabled={deletingId === p.id}
                              style={{ padding: '0.375rem', minHeight: 'auto', color: '#DC2626' }}
                            >
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {productModal !== null && (
        <ProductModal
          product={productModal === 'new' ? null : productModal}
          businessId={businessId}
          onSaved={handleSaved}
          onClose={() => setProductModal(null)}
        />
      )}
      {stockModal !== null && (
        <StockAdjustModal
          product={stockModal}
          userRole={userRole}
          onAdjusted={handleStockAdjusted}
          onClose={() => setStockModal(null)}
        />
      )}
    </div>
  );
}
