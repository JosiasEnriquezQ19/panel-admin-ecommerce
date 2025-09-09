import React, { useEffect, useState } from 'react'
import ListaProductos from '../../components/productos/ListaProductos'
import AgregarProducto from '../../components/productos/AgregarProducto'
import EditarProducto from '../../components/productos/EditarProducto'
import DetalleProducto from '../../components/productos/DetalleProducto'
import '../../components/productos/productos-minimalista.css'
import { API_BASE } from '../../utils/api'


// Constantes para las vistas
const VISTAS = {
  LISTA: 'lista',
  AGREGAR: 'agregar',
  DETALLE: 'detalle',
  EDITAR: 'editar'
}

export default function Productos(){
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [vistaActual, setVistaActual] = useState(VISTAS.LISTA)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(()=>{ 
    fetchProductos()
    window.fetchProductos = fetchProductos // Hacer disponible globalmente
    return () => { delete window.fetchProductos } // Limpiar al desmontar
  }, [])

  async function fetchProductos(){
    setLoading(true)
    setError(null)
    try{
      const res = await fetch(`${API_BASE}/Productos`)
      if(!res.ok) throw new Error('Error al obtener productos')
      const data = await res.json()
      setProductos(data)
    }catch(err){ setError(err.message) }
    setLoading(false)
  }

  function handleMostrarDetalles(producto) {
    setProductoSeleccionado(producto)
    setVistaActual(VISTAS.DETALLE)
  }

  function handleIniciarEdicion(producto = null) {
    if (producto) {
      setProductoSeleccionado(producto)
    }
    setVistaActual(VISTAS.EDITAR)
  }

  function handleMostrarAgregar() {
    setVistaActual(VISTAS.AGREGAR)
    setProductoSeleccionado(null)
  }
  
  function handleVolverALista() {
    setProductoSeleccionado(null)
    setVistaActual(VISTAS.LISTA)
  }

  function handleProductoCreado() {
    setError(null)
    fetchProductos()
    setVistaActual(VISTAS.LISTA)
  }

  function handleProductoActualizado() {
    setError(null)
    setProductoSeleccionado(null)
    fetchProductos()
    setVistaActual(VISTAS.LISTA)
  }

  async function handleCambiarEstado(producto){
    const estadoActual = producto.estado || 'disponible'
    // toggle simple: si estaba disponible -> oculto, si no -> disponible
    const nuevoEstado = estadoActual === 'disponible' ? 'oculto' : 'disponible'
    
    try {
      const res = await fetch(`${API_BASE}/Productos/${producto.productoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      })
      
      if(!res.ok) throw new Error(`Error al ${nuevoEstado === 'inactivo' ? 'inhabilitar' : 'activar'} producto`)
      
      // Si cambiamos el estado del producto seleccionado, actualizamos la vista
      if (productoSeleccionado && productoSeleccionado.productoId === producto.productoId) {
        setProductoSeleccionado({
          ...productoSeleccionado,
          estado: nuevoEstado
        })
      }
      
      fetchProductos()
    } catch(err) { 
      setError(err.message) 
    }
  }
  
  async function handleEliminar(producto){
    if(!confirm('¿Está seguro que desea eliminar este producto permanentemente?')) return
    
    try {
  const res = await fetch(`${API_BASE}/Productos/${producto.productoId}`, { method: 'DELETE' })
      if(!res.ok) throw new Error('Error al eliminar producto')
      
      // Si eliminamos el producto seleccionado, volvemos a la lista
  if (productoSeleccionado && productoSeleccionado.productoId === producto.productoId) {
        handleVolverALista()
      }
      
      fetchProductos()
    } catch(err) { 
      setError(err.message) 
    }
  }

  // Filtrar productos según los criterios
  const productosFiltrados = React.useMemo(() => {
    return productos.filter(producto => {
      // Si hay filtro de categoría y no coincide, excluir
      if (filtroCategoria && producto.categoria !== filtroCategoria) {
        return false;
      }
      
      // Si hay texto de búsqueda, filtrar por nombre o ID
      if (filtroTexto) {
        const textoLower = filtroTexto.toLowerCase();
        const nombreCoincide = producto.nombre?.toLowerCase().includes(textoLower);
        const idCoincide = producto.productoId?.toString().includes(textoLower);
        
        return nombreCoincide || idCoincide;
      }
      
      return true; // Incluir si pasa todos los filtros
    });
  }, [productos, filtroTexto, filtroCategoria]);
  
  // Manejadores para los filtros
  const handleFiltroTextoChange = (e) => {
    setFiltroTexto(e.target.value);
  };
  
  const handleFiltroCategoriaChange = (e) => {
    setFiltroCategoria(e.target.value);
  };

  return (
    <div className="productos-page">
      <header className="page-header">
        <h2>Gestión de Productos</h2>
        {productos.length > 0 && 
          <span className="results-badge">
            {productosFiltrados.length} productos
          </span>
        }
      </header>
      
      {error && <div className="error">{error}</div>}
      
      {/* Navegación superior */}
      <div className="productos-nav">
        <button 
          onClick={handleVolverALista}
          className={vistaActual === VISTAS.LISTA ? 'active' : ''}
        >
          📋 Lista de Productos
        </button>
        <button 
          onClick={handleMostrarAgregar}
          className={vistaActual === VISTAS.AGREGAR ? 'active' : ''}
        >
          ✨ Agregar Producto
        </button>
      </div>
      
      {/* Filtros de productos */}
      {vistaActual === VISTAS.LISTA && (
        <div className="filtros-container">
          <div className="filtro-busqueda">
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={filtroTexto}
              onChange={handleFiltroTextoChange}
              className="filtro-input"
            />
          </div>
          <div className="filtro-categoria">
            <select 
              value={filtroCategoria} 
              onChange={handleFiltroCategoriaChange}
              className="filtro-select"
            >
              <option value="">Todas las categorías</option>
              <option value="smartphone">Smartphone</option>
              <option value="laptop">Laptop</option>
              <option value="otros">Otros</option>
            </select>
          </div>
        </div>
      )}

      {/* Renderizado condicional de vistas */}
      {vistaActual === VISTAS.LISTA && (
        <div className="vista-lista">
          {loading ? (
            <p>Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron productos que coincidan con los filtros</p>
              <button 
                onClick={() => {setFiltroTexto(''); setFiltroCategoria('');}}
                className="btn-limpiar-filtros"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <ListaProductos 
              productos={productosFiltrados}
              onVerDetalles={handleMostrarDetalles}
              onEditar={handleIniciarEdicion}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
              productoSeleccionadoId={productoSeleccionado?.productoId}
            />
          )}
        </div>
      )}

      {vistaActual === VISTAS.AGREGAR && (
        <div className="vista-agregar">
          <AgregarProducto 
            onProductoCreado={handleProductoCreado}
            onCancelar={handleVolverALista}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {vistaActual === VISTAS.DETALLE && productoSeleccionado && (
        <div className="vista-detalle">
          <DetalleProducto 
            producto={productoSeleccionado}
            onEditar={() => handleIniciarEdicion(productoSeleccionado)}
            onCerrar={handleVolverALista}
          />
        </div>
      )}

      {vistaActual === VISTAS.EDITAR && productoSeleccionado && (
        <div className="vista-editar">
          <EditarProducto 
            producto={productoSeleccionado}
            onProductoActualizado={handleProductoActualizado}
            onCancelar={handleVolverALista}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}
    </div>
  )
}
