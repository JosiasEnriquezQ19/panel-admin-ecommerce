import React from 'react'
import '../../pages/categorias/categorias.css' // Using shared styles for exact parity

export default function ListaProductos({
  productos,
  categorias = [], // New prop
  onVerDetalles,
  onEditar,
  onCambiarEstado,
  onEliminar,
  productoSeleccionadoId
}) {

  // Helper to resolve category name
  const getNombreCategoria = (producto) => {
    // 1. Try direct object or name property
    if (producto.categoria?.nombre) return producto.categoria.nombre;
    if (producto.nombreCategoria) return producto.nombreCategoria;
    if (typeof producto.categoria === 'string') return producto.categoria;

    // 2. Try ID lookup
    if (producto.categoriaId && categorias.length > 0) {
      const cat = categorias.find(c => c.categoriaId === producto.categoriaId);
      if (cat) return cat.nombre;
    }

    // 3. Last resort fallback
    return '-';
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="empty-search">
        <p>No hay productos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="table-responsive">
      <table className="categories-table"> {/* Reuse EXACT same class as categories */}
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(producto => (
            <tr
              key={producto.productoId || producto.id}
              className={(producto.productoId || producto.id) === productoSeleccionadoId ? 'selected-row' : ''}
            >
              <td>
                <span className="product-id">#{producto.productoId || producto.id}</span>
              </td>
              <td>
                <div className="product-identity">
                  {producto.imagenUrl ? (
                    <img
                      src={producto.imagenUrl}
                      alt={producto.nombre}
                      className="product-thumb"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                  )}
                  <div className="product-info">
                    <span className="product-name">{producto.nombre || producto.nombreProducto || 'Sin nombre'}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="product-category">
                  {getNombreCategoria(producto)}
                </span>
              </td>
              <td>
                <span className="product-price">S/ {(producto.precio || 0).toLocaleString('es-PE')}</span>
              </td>
              <td>{producto.stock || 0}</td>
              <td>
                <span className={`status-badge ${producto.estado || 'disponible'}`}>
                  {producto.estado || 'disponible'}
                </span>
              </td>
              <td className="actions-cell">
                <button
                  onClick={() => onVerDetalles(producto)}
                  className="btn-icon view"
                  title="Ver detalles"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button
                  onClick={() => onEditar(producto)}
                  className="btn-icon edit"
                  title="Editar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button
                  onClick={() => onCambiarEstado(producto)}
                  className="btn-icon toggle"
                  title={producto.estado === 'disponible' ? 'Ocultar' : 'Activar'}
                >
                  {producto.estado === 'disponible' ?
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>}
                </button>
                <button
                  onClick={() => onEliminar(producto)}
                  className="btn-icon delete"
                  title="Eliminar"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
