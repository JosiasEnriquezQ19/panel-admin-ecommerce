import React, { useState } from 'react'

export default function DetalleProducto({ producto, onEditar, onCerrar, categorias = [] }) {
  const [mostrarCompleto, setMostrarCompleto] = useState(false)

  if (!producto) return null

  const formatearPrecio = (precio) => {
    return 'S/ ' + (precio || 0).toLocaleString('es-PE')
  }

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'disponible':
        return 'disponible'
      case 'agotado':
        return 'agotado'
      case 'descontinuado':
        return 'descontinuado'
      default:
        return 'disponible'
    }
  }

  // Resolve Category Name
  const categoryName = React.useMemo(() => {
    if (producto.categoria && typeof producto.categoria === 'object' && producto.categoria.nombre) {
      return producto.categoria.nombre;
    }
    // Try to find by ID if we have the list
    if (categorias.length > 0) {
      const catId = producto.categoriaId || producto.categoria;
      // eslint-disable-next-line
      const found = categorias.find(c => c.categoriaId == catId);
      if (found) return found.nombre;
    }
    // Fallback to direct string if it's a string
    if (typeof producto.categoria === 'string') return producto.categoria;
    return producto.nombreCategoria || '-';
  }, [producto, categorias]);

  // Description truncation
  const descripcion = producto.descripcion || 'Sin descripción disponible.';
  const MAX_CHARS = 150;
  const esLargo = descripcion.length > MAX_CHARS;
  const textoMostrado = mostrarCompleto || !esLargo ? descripcion : descripcion.slice(0, MAX_CHARS) + '...';

  return (
    <div className="detalle-producto-container card-content">
      <div className="detalle-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="card-title" style={{ margin: 0, color: 'white' }}>Detalles del Producto</h3>
        <button
          className="btn-icon"
          onClick={onCerrar}
          title="Cerrar"
          style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="producto-detalle-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '30px', alignItems: 'start' }}>
        {/* Left Column: Image */}
        <div className="producto-imagen-section">
          <div className="detail-image-container">
            {producto.imagenUrl ? (
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                className="detail-img"
              />
            ) : (
              <div className="preview-placeholder">
                <span style={{ fontSize: '3rem' }}>📦</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info */}
        <div className="producto-info-section">
          <div className="form-group">
            <label>ID del Producto</label>
            <div style={{ color: 'white', fontSize: '1.1rem' }}>#{producto.productoId || producto.id}</div>
          </div>

          <div className="form-group">
            <label>Nombre</label>
            <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.8rem' }}>{producto.nombre || 'Sin nombre'}</h2>
          </div>

          <div className="form-row">
            <div className="form-group half" style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Precio</label>
              <div className="product-price" style={{ fontSize: '1.8rem', color: '#00d68f', display: 'block', textAlign: 'left' }}>
                {formatearPrecio(producto.precio)}
              </div>
            </div>
            <div className="form-group half" style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Stock</label>
              <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: '500', display: 'block', padding: '6px 0', textAlign: 'left' }}>
                {producto.stock} unidades
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half" style={{ textAlign: 'left' }}>
              <label>Categoría</label>
              <div style={{ color: 'white' }}>
                <span className="product-category" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  {categoryName}
                </span>
              </div>
            </div>
            <div className="form-group half" style={{ textAlign: 'left' }}>
              <label>Estado</label>
              <div>
                <span className={`status-badge ${getEstadoColor(producto.estado)}`} style={{ display: 'inline-block' }}>
                  {producto.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <div style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 8px 0' }}>{textoMostrado}</p>
              {esLargo && (
                <button
                  onClick={() => setMostrarCompleto(!mostrarCompleto)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    padding: 0,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}
                >
                  {mostrarCompleto ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          </div>

          <div className="footer-actions" style={{ marginTop: '20px' }}>
            <button
              className="btn-primary"
              onClick={onEditar}
            >
              ✏️ Editar Producto
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
