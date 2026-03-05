import React, { useState, useRef, useEffect } from 'react'
import '../../pages/productos/productos.css'

export default function ListaProductos({
  productos,
  categorias = [],
  onVerDetalles,
  onEditar,
  onCambiarEstado,
  onEliminar,
  productoSeleccionadoId,
  isReadOnly
}) {
  const [openMenu, setOpenMenu] = useState(null)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNombreCategoria = (producto) => {
    if (producto.categoria?.nombre) return producto.categoria.nombre
    if (producto.nombreCategoria) return producto.nombreCategoria
    if (typeof producto.categoria === 'string') return producto.categoria
    if (producto.categoriaId && categorias.length > 0) {
      const cat = categorias.find(c => c.categoriaId === producto.categoriaId)
      if (cat) return cat.nombre
    }
    return 'Sin categoría'
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="prod-empty">
        <p>No hay productos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="prod-grid">
      {productos.map(producto => {
        const id = producto.productoId || producto.id
        const estado = producto.estado || 'disponible'
        const isMenuOpen = openMenu === id

        return (
          <div
            key={id}
            className={`prod-card ${id === productoSeleccionadoId ? 'selected' : ''}`}
            onClick={() => onVerDetalles(producto)}
          >
            {/* Image */}
            <div className="prod-card-image">
              {/* Status dot */}
              <div className={`prod-card-status ${estado}`}>
                <span className="prod-card-status-dot"></span>
                {estado === 'disponible' ? 'Activo' : 'Oculto'}
              </div>

              {producto.imagenUrl ? (
                <img
                  src={producto.imagenUrl}
                  alt={producto.nombre}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex') }}
                />
              ) : null}

              {!producto.imagenUrl && (
                <div className="prod-card-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                </div>
              )}

              {/* Menu button */}
              <button
                className="prod-card-menu-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenMenu(isMenuOpen ? null : id)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="prod-card-dropdown" ref={menuRef} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { onVerDetalles(producto); setOpenMenu(null) }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    Ver detalles
                  </button>
                  {!isReadOnly && (
                    <>
                      <button onClick={() => { onEditar(producto); setOpenMenu(null) }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Editar
                      </button>
                      <button onClick={() => { onCambiarEstado(producto); setOpenMenu(null) }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {estado === 'disponible'
                            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><line x1="1" y1="1" x2="23" y2="23" /></>
                            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                          }
                        </svg>
                        {estado === 'disponible' ? 'Ocultar' : 'Activar'}
                      </button>
                      <button className="danger" onClick={() => { onEliminar(producto); setOpenMenu(null) }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="prod-card-body">
              <h4 className="prod-card-name" style={{ marginBottom: producto.marca ? '2px' : '15px' }}>{producto.nombre || 'Sin nombre'}</h4>
              {producto.marca && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  {producto.marca}
                </div>
              )}
              <div className="prod-card-bottom">
                <span className="prod-card-price">S/ {(producto.precio || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                <span className="prod-card-category">{getNombreCategoria(producto)}</span>
              </div>
              <div className="prod-card-stock">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                Stock: {producto.stock || 0}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
