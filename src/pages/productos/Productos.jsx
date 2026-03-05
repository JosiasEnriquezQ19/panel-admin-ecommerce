import React, { useEffect, useState } from 'react'
import ListaProductos from '../../components/productos/ListaProductos'
import AgregarProducto from '../../components/productos/AgregarProducto'
import EditarProducto from '../../components/productos/EditarProducto'
import DetalleProducto from '../../components/productos/DetalleProducto'
import './productos.css'
import { API_BASE } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const VISTAS = {
  LISTA: 'lista',
  AGREGAR: 'agregar',
  DETALLE: 'detalle',
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [categorias, setCategorias] = useState([])

  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [vistaActual, setVistaActual] = useState(VISTAS.LISTA)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('all')

  const { user } = useAuth()
  const isReadOnly = user?.nivelAcceso === 'basico'

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
    window.fetchProductos = fetchProductos
    return () => { delete window.fetchProductos }
  }, [])

  // Guardián para evitar pantalla en blanco si se pierde el producto seleccionado
  useEffect(() => {
    if (vistaActual === VISTAS.DETALLE && !productoSeleccionado && !loading) {
      setVistaActual(VISTAS.LISTA)
    }
  }, [vistaActual, productoSeleccionado, loading])

  async function fetchProductos() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/Productos`)
      if (!res.ok) throw new Error('Error al obtener productos')
      const data = await res.json()
      setProductos(data)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  async function fetchCategorias() {
    try {
      const res = await fetch(`${API_BASE}/Categorias`)
      if (res.ok) setCategorias(await res.json())
    } catch (err) { console.error(err) }
  }

  function handleMostrarDetalles(producto) {
    setProductoSeleccionado(producto)
    setVistaActual(VISTAS.DETALLE)
  }

  function handleIniciarEdicion(producto = null) {
    if (isReadOnly) return
    if (producto) setProductoSeleccionado(producto)
    setShowEditModal(true)
  }

  function handleCerrarEditModal() {
    setShowEditModal(false)
  }

  function handleMostrarAgregar() {
    if (isReadOnly) return
    setShowAddModal(true)
  }

  function handleCerrarAddModal() {
    setShowAddModal(false)
  }

  function handleVolverALista() {
    setProductoSeleccionado(null)
    setVistaActual(VISTAS.LISTA)
  }

  function handleProductoCreado() {
    setError(null)
    fetchProductos()
    setShowAddModal(false)
  }

  function handleProductoActualizado() {
    setError(null)
    setProductoSeleccionado(null)
    setShowEditModal(false)
    setVistaActual(VISTAS.LISTA) // Volver a la lista para evitar pantalla en blanco
    fetchProductos()
  }

  async function handleCambiarEstado(producto) {
    const estadoActual = producto.estado || 'disponible'
    const nuevoEstado = estadoActual === 'disponible' ? 'oculto' : 'disponible'
    try {
      const res = await fetch(`${API_BASE}/Productos/${producto.productoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })
      if (!res.ok) throw new Error('Error al cambiar estado')
      if (productoSeleccionado?.productoId === producto.productoId) {
        setProductoSeleccionado({ ...productoSeleccionado, estado: nuevoEstado })
      }
      fetchProductos()
    } catch (err) { setError(err.message) }
  }

  async function handleEliminar(producto) {
    if (!confirm('¿Está seguro que desea eliminar este producto permanentemente?')) return
    try {
      const res = await fetch(`${API_BASE}/Productos/${producto.productoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar producto')
      if (productoSeleccionado?.productoId === producto.productoId) handleVolverALista()
      fetchProductos()
    } catch (err) { setError(err.message) }
  }

  const productosFiltrados = React.useMemo(() => {
    return productos.filter(producto => {
      if (filtroEstado === 'disponible' && (producto.estado || 'disponible') !== 'disponible') return false
      if (filtroEstado === 'oculto' && (producto.estado || 'disponible') !== 'oculto') return false
      if (filtroCategoria && producto.categoria !== filtroCategoria) return false
      if (filtroTexto) {
        const textoLower = filtroTexto.toLowerCase()
        const nombreCoincide = producto.nombre?.toLowerCase().includes(textoLower)
        const idCoincide = producto.productoId?.toString().includes(textoLower)
        return nombreCoincide || idCoincide
      }
      return true
    })
  }, [productos, filtroTexto, filtroCategoria, filtroEstado])

  const countByState = {
    all: productos.length,
    disponible: productos.filter(p => (p.estado || 'disponible') === 'disponible').length,
    oculto: productos.filter(p => p.estado === 'oculto').length,
  }

  return (
    <div className="prod-page">
      {error && (
        <div className="prod-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {vistaActual === VISTAS.LISTA && (
        <>
          {/* Toolbar */}
          <div className="prod-toolbar">
            <div className="prod-tabs">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'disponible', label: 'Activos' },
                { key: 'oculto', label: 'Ocultos' },
              ].map(tab => (
                <button
                  key={tab.key}
                  className={`prod-tab ${filtroEstado === tab.key ? 'active' : ''}`}
                  onClick={() => setFiltroEstado(tab.key)}
                >
                  {tab.label}
                  <span className="prod-tab-count">{countByState[tab.key]}</span>
                </button>
              ))}
            </div>

            <div className="prod-toolbar-right">
              <div className="prod-search-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </div>

              <select
                className="prod-category-filter"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Categoría</option>
                {categorias.map(cat => (
                  <option key={cat.categoriaId} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>

              {!isReadOnly && (
                <button className="prod-btn-new" onClick={handleMostrarAgregar}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nuevo Producto
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="prod-content">
            {loading ? (
              <div className="prod-loading">
                <div className="prod-spinner"></div>
                <p>Cargando productos...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="prod-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                </svg>
                <p>No se encontraron productos</p>
                <button className="prod-btn-clear" onClick={() => { setFiltroTexto(''); setFiltroCategoria(''); setFiltroEstado('all'); }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <ListaProductos
                productos={productosFiltrados}
                categorias={categorias}
                onVerDetalles={handleMostrarDetalles}
                onEditar={handleIniciarEdicion}
                onCambiarEstado={handleCambiarEstado}
                onEliminar={handleEliminar}
                productoSeleccionadoId={productoSeleccionado?.productoId}
                isReadOnly={isReadOnly}
              />
            )}
          </div>

          {productosFiltrados.length > 0 && (
            <div className="prod-footer">
              <span>Mostrando {productosFiltrados.length} de {productos.length} productos</span>
            </div>
          )}
        </>
      )}

      {/* Modal Overlay - Agregar Producto */}
      {showAddModal && (
        <div className="prod-modal-overlay" onClick={handleCerrarAddModal}>
          <div className="prod-modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="prod-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 36, height: 36, background: 'var(--text-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Nuevo Producto</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>Completa los campos para agregar un producto al catálogo</p>
                </div>
              </div>
              <button className="prod-modal-close" onClick={handleCerrarAddModal}>✕</button>
            </div>
            <div className="prod-modal-body">
              <AgregarProducto
                onProductoCreado={handleProductoCreado}
                onCancelar={handleCerrarAddModal}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>
        </div>
      )}

      {vistaActual === VISTAS.DETALLE && productoSeleccionado && (
        <div className="vista-detalle">
          <DetalleProducto
            producto={productoSeleccionado}
            categorias={categorias}
            onEditar={() => handleIniciarEdicion(productoSeleccionado)}
            onCerrar={handleVolverALista}
          />
        </div>
      )}

      {/* Modal Overlay - Editar Producto */}
      {showEditModal && productoSeleccionado && (
        <div className="prod-modal-overlay" onClick={handleCerrarEditModal}>
          <div className="prod-modal" onClick={e => e.stopPropagation()}>
            <div className="prod-modal-header">
              <h3>Editar Producto</h3>
              <button className="prod-modal-close" onClick={handleCerrarEditModal}>✕</button>
            </div>
            <div className="prod-modal-body">
              <EditarProducto
                producto={productoSeleccionado}
                onProductoActualizado={handleProductoActualizado}
                onCancelar={handleCerrarEditModal}
                onError={(msg) => setError(msg)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

