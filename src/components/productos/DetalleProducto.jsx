import React, { useState, useEffect } from 'react'
import './detalle-producto.css'
import { API_BASE } from '../../utils/api'

export default function DetalleProducto({ producto, onEditar, onCerrar, categorias = [] }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [reseñas, setReseñas] = useState([])
  const [promedio, setPromedio] = useState({ promedio: 0, totalComentarios: 0 })
  const [loadingReseñas, setLoadingReseñas] = useState(false)
  const [mostrarCompleto, setMostrarCompleto] = useState(false)

  useEffect(() => {
    if (producto) {
      const id = producto.productoId || producto.id
      fetchReseñas(id)
      fetchPromedio(id)
    }
  }, [producto])

  async function fetchReseñas(id) {
    setLoadingReseñas(true)
    try {
      const res = await fetch(`${API_BASE}/productos/${id}/comentarios`)
      if (res.ok) {
        setReseñas(await res.json())
      }
    } catch (err) {
      console.error("Error fetching reseñas:", err)
    } finally {
      setLoadingReseñas(false)
    }
  }

  async function fetchPromedio(id) {
    try {
      const res = await fetch(`${API_BASE}/productos/${id}/comentarios/promedio`)
      if (res.ok) {
        setPromedio(await res.json())
      }
    } catch (err) {
      console.error("Error fetching promedio:", err)
    }
  }

  if (!producto) return null

  const formatearPrecio = (precio) => {
    return 'S/ ' + (precio || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })
  }

  // Resolve Category Name
  const categoryName = React.useMemo(() => {
    if (producto.categoria && typeof producto.categoria === 'object' && producto.categoria.nombre) {
      return producto.categoria.nombre;
    }
    if (categorias.length > 0) {
      const catId = producto.categoriaId || producto.categoria;
      // eslint-disable-next-line
      const found = categorias.find(c => c.categoriaId == catId);
      if (found) return found.nombre;
    }
    if (typeof producto.categoria === 'string') return producto.categoria;
    return producto.nombreCategoria || '-';
  }, [producto, categorias]);

  // Description formatted as bullets
  const descripcion = producto.descripcion || 'Sin descripción disponible.';
  const MAX_CHARS = 160;
  const esLargo = descripcion.length > MAX_CHARS;
  const textoDesc = mostrarCompleto || !esLargo ? descripcion : descripcion.slice(0, MAX_CHARS) + '...';
  const descLines = textoDesc.split('. ').filter(line => line.trim().length > 0);

  // Funciones auxiliares para estrellas
  const renderEstrellas = (cantidad) => {
    const estrellas = [];
    const maxEstrellas = 5;
    for (let i = 1; i <= maxEstrellas; i++) {
      if (i <= cantidad) {
        // Full star
        estrellas.push(<svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)
      } else if (i - 0.5 <= cantidad) {
        // Half star (Simplified to full star for this layout, can visually tweak if needed)
        estrellas.push(<svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)
      } else {
        // Empty star
        estrellas.push(<svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)
      }
    }
    return estrellas;
  }

  const scoreDisplay = promedio.promedio > 0 ? `[${promedio.promedio.toFixed(1)}]` : '[0.0]'

  return (
    <div className="detalle-prod-view">
      {/* Top action bar */}
      <div className="detalle-prod-topbar">
        <button className="detalle-prod-back" onClick={onCerrar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Detalles del Producto
        </button>
        <div className="detalle-prod-actions">
          <button className="btn-export">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exportar
          </button>
          <button className="btn-edit-main" onClick={onEditar}>
            Editar Producto
          </button>
        </div>
      </div>

      <div className="detalle-prod-container">
        {/* LEFT COLUMN: Media */}
        <div className="detalle-prod-left">
          <div className="detalle-prod-main-img">
            {producto.imagenUrl ? (
              <img src={producto.imagenUrl} alt={producto.nombre} />
            ) : (
              <div className="placeholder-hero">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Info */}
        <div className="detalle-prod-right">
          <div className="new-arrival-tag">{categoryName.toUpperCase()}</div>

          <h1 className="prod-title-large">{producto.nombre || 'Producto sin nombre'}</h1>

          <div className="prod-rating-row">
            <div className="stars">
              {renderEstrellas(Math.round(promedio.promedio))}
            </div>
            <span className="rating-score">{scoreDisplay}</span>
            <span className="rating-link">{promedio.totalComentarios} reseñas en este producto</span>
          </div>

          <div className="prod-price-large">
            {formatearPrecio(producto.precio)}
          </div>

          {/* Availability Status */}
          <div className="prod-options-section" style={{ marginTop: '12px' }}>
            <div className="options-title-row" style={{ justifyContent: 'flex-start', gap: '16px' }}>
              <span className="options-title">Disponibilidad de Inventario:</span>
              {producto.stock > 0 ? (
                <span className="stock-warning" style={{ color: producto.stock < 10 ? '#dc2626' : '#16a34a' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                  {producto.stock} unidades en stock {producto.stock < 10 && '(¡Bajo stock!)'}
                </span>
              ) : (
                <span className="stock-warning" style={{ color: '#dc2626' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                  Agotado
                </span>
              )}
            </div>
          </div>

          <div className="prod-desc-section">
            <h4>Descripción del Producto:</h4>
            <ul className="desc-bullets">
              {descLines.length > 0 ? descLines.map((line, i) => (
                <li key={i}>{line}{line.endsWith('.') || line.endsWith('...') ? '' : '.'}</li>
              )) : (
                <li>Este producto no cuenta con una descripción detallada en este momento.</li>
              )}
            </ul>
            {esLargo && (
              <button
                onClick={() => setMostrarCompleto(!mostrarCompleto)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  padding: '8px 0 0 0',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  display: 'inline-block'
                }}
              >
                {mostrarCompleto ? 'Ver menos' : 'Ver más'}
              </button>
            )}
            <ul className="desc-bullets" style={{ marginTop: '14px' }}>
              <li>ID interno del producto: #{producto.productoId || producto.id}</li>
              <li>Estado configurado: <strong>{producto.estado || 'disponible'}</strong></li>
            </ul>
          </div>

          <div className="prod-desc-section">
            <h4>Información de Logística:</h4>
            <div className="shipping-blocks">
              <div className="ship-card">
                <div className="ship-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                </div>
                <div className="ship-info">
                  <span className="ship-label">Delivery</span>
                  <span className="ship-val">Lima Metropolitana</span>
                </div>
              </div>
              <div className="ship-card">
                <div className="ship-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                </div>
                <div className="ship-info">
                  <span className="ship-label">Agencias</span>
                  <span className="ship-val">Provincias (Nacional)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reseñas Section */}
          <div className="prod-desc-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4>Reseñas de Clientes ({promedio.totalComentarios}):</h4>
            {loadingReseñas ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando reseñas...</p>
            ) : reseñas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Aún no hay reseñas para este producto.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {reseñas.map((res) => (
                  <div key={res.comentarioId} style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{res.usuarioNombre || 'Usuario Anónimo'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(res.fechaComentario).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                      {renderEstrellas(res.estrellas).map((star, idx) => (
                        <span key={idx} style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>{star}</span>
                      ))}
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      "{res.texto}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

