import React from 'react'

export default function DetalleProducto({ producto, onEditar, onCerrar }) {
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

  const getStockIcon = (stock) => {
    if (stock > 10) return '📦'
    if (stock > 0) return '📋'
    return '⚠️'
  }

  return (
    <div className="detalle-producto-container">
      {/* Header con botón volver */}
      <div className="detalle-header-simple">
        <button 
          className="btn-volver-simple"
          onClick={onCerrar}
          title="Cerrar detalle"
        >
          ← Volver a la lista
        </button>
      </div>

      {/* Card principal del producto */}
      <div className="producto-card-principal">
        {/* Header del producto */}
        <div className="producto-header">
          <div className="producto-info-principal">
            <div className="producto-imagen-container">
              {producto.imagenUrl ? (
                <img 
                  src={producto.imagenUrl} 
                  alt={producto.nombre || 'Producto'} 
                  className="producto-imagen"
                />
              ) : (
                <div className="producto-imagen-placeholder">
                  📦
                </div>
              )}
            </div>
            <div className="producto-info-basica">
              <h1 className="producto-nombre">
                {producto.nombre || producto.nombreProducto || producto.name || 'Producto sin nombre'}
              </h1>
              <p className="producto-precio">
                {formatearPrecio(producto.precio || producto.price)}
              </p>
              <div className="producto-meta">
                <span className="producto-id">ID: {producto.productoId || producto.id}</span>
                <span className={`producto-estado ${getEstadoColor(producto.estado)}`}>
                  <span className="estado-dot"></span>
                  {producto.estado === 'disponible' ? 'Disponible' : 
                   producto.estado === 'agotado' ? 'Agotado' :
                   producto.estado === 'descontinuado' ? 'Descontinuado' :
                   producto.estado || 'Disponible'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="producto-actions">
            <button 
              className="btn-accion-primario"
              onClick={onEditar}
            >
              ✏️ Editar
            </button>
          </div>
        </div>

        {/* Información rápida */}
        <div className="info-rapida">
          <div className="info-item">
            <span className="info-icono">
              {getStockIcon(producto.stock || producto.inventario || 0)}
            </span>
            <span className="info-texto">
              Stock: {producto.stock || producto.inventario || 0} unidades
            </span>
          </div>
          {(producto.categoria || producto.category) && (
            <div className="info-item">
              <span className="info-icono">🏷️</span>
              <span className="info-texto">
                Categoría: {producto.categoria || producto.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sección de detalles */}
      <div className="detalle-grid">
        {/* Información del producto */}
        <div className="seccion-card">
          <div className="seccion-header">
            <h3>📋 Información del Producto</h3>
          </div>
          
          <div className="seccion-contenido">
            <div className="detalles-list">
              <div className="detalle-item">
                <div className="detalle-header">
                  <span className="detalle-icono">🏷️</span>
                  <div className="detalle-info">
                    <span className="detalle-titulo">Nombre del Producto</span>
                  </div>
                </div>
                <div className="detalle-valor">
                  {producto.nombre || producto.nombreProducto || producto.name || 'No especificado'}
                </div>
              </div>

              <div className="detalle-item">
                <div className="detalle-header">
                  <span className="detalle-icono">💰</span>
                  <div className="detalle-info">
                    <span className="detalle-titulo">Precio</span>
                  </div>
                </div>
                <div className="detalle-valor precio-destacado">
                  {formatearPrecio(producto.precio || producto.price)}
                </div>
              </div>

              {(producto.categoria || producto.category) && (
                <div className="detalle-item">
                  <div className="detalle-header">
                    <span className="detalle-icono">📂</span>
                    <div className="detalle-info">
                      <span className="detalle-titulo">Categoría</span>
                    </div>
                  </div>
                  <div className="detalle-valor">
                    {producto.categoria || producto.category}
                  </div>
                </div>
              )}

              <div className="detalle-item">
                <div className="detalle-header">
                  <span className="detalle-icono">
                    {getStockIcon(producto.stock || producto.inventario || 0)}
                  </span>
                  <div className="detalle-info">
                    <span className="detalle-titulo">Inventario</span>
                  </div>
                </div>
                <div className="detalle-valor">
                  <span className={`stock-valor ${(producto.stock || producto.inventario || 0) === 0 ? 'stock-agotado' : 
                    (producto.stock || producto.inventario || 0) < 10 ? 'stock-bajo' : 'stock-ok'}`}>
                    {producto.stock || producto.inventario || 0} unidades
                  </span>
                </div>
              </div>

              <div className="detalle-item">
                <div className="detalle-header">
                  <span className="detalle-icono">🏳️</span>
                  <div className="detalle-info">
                    <span className="detalle-titulo">Estado</span>
                  </div>
                </div>
                <div className="detalle-valor">
                  <span className={`estado-badge ${getEstadoColor(producto.estado)}`}>
                    {producto.estado === 'disponible' ? 'Disponible' : 
                     producto.estado === 'agotado' ? 'Agotado' :
                     producto.estado === 'descontinuado' ? 'Descontinuado' :
                     producto.estado || 'Disponible'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {(producto.descripcion || producto.description) && (
          <div className="seccion-card">
            <div className="seccion-header">
              <h3>📝 Descripción</h3>
            </div>
            
            <div className="seccion-contenido">
              <div className="descripcion-contenido">
                <p>{producto.descripcion || producto.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
