import React from 'react'
import './productos-minimalista.css'

export default function ListaProductos({ 
  productos, 
  onVerDetalles, 
  onEditar, 
  onCambiarEstado, 
  onEliminar,
  productoSeleccionadoId 
}) {
  if (!productos || productos.length === 0) {
    return <p>No hay productos disponibles.</p>
  }

  return (
    <div className="productos-grid">
      {productos.map(producto => (
        <div 
          key={producto.productoId || producto.id}
          className={`producto-card ${(producto.productoId || producto.id) === productoSeleccionadoId ? 'producto-seleccionado' : ''}`}
        >
          <div className={`producto-badge badge-${producto.estado || 'disponible'}`}>
            {producto.estado === 'disponible' ? 'Disponible' : producto.estado}
          </div>
          
          <div className="producto-header">
            <h3 className="producto-title">
              {producto.nombre || producto.nombreProducto || producto.name || '-'}
            </h3>
            <div className="producto-price">
              S/ {(producto.precio || producto.price || 0).toLocaleString('es-PE')}
            </div>
          </div>
          
          <div className="producto-content">
            {producto.imagenUrl ? (
              <img 
                src={producto.imagenUrl} 
                alt={producto.nombre} 
                className="producto-image"
              />
            ) : (
              <div className="producto-image-placeholder">Sin imagen</div>
            )}
            
            <div className="producto-details">
              <div className="producto-meta">
                <span><strong>ID:</strong> {producto.productoId || producto.id}</span>
                {producto.categoria && <span><strong>Categoría:</strong> {producto.categoria}</span>}
                {producto.stock !== undefined && <span><strong>Stock:</strong> {producto.stock}</span>}
              </div>
            </div>
          </div>
          
          <div className="producto-actions">
            <button 
              onClick={() => onVerDetalles(producto)} 
              className="btn-action btn-view"
              title="Ver detalles"
            >
              👁️ Ver
            </button>
            <button 
              onClick={() => onEditar(producto)} 
              className="btn-action btn-edit"
              title="Editar producto"
            >
              ✏️ Editar
            </button>
            <button 
              onClick={() => onCambiarEstado(producto)} 
              className="btn-action btn-toggle"
              title={producto.estado === 'disponible' ? 'Ocultar producto' : 'Mostrar producto'}
            >
              {producto.estado === 'disponible' ? '🙈 Ocultar' : '👁️ Mostrar'}
            </button>
            <button 
              onClick={() => onEliminar(producto)} 
              className="btn-action btn-delete"
              title="Eliminar permanentemente"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
