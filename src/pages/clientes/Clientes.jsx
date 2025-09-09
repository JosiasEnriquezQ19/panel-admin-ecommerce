import React, { useEffect, useState, useMemo } from 'react'
import DetalleCliente from '../../components/clientes/DetalleCliente'
import ListaClientes from '../../components/clientes/ListaClientes'
import FormCliente from '../../components/clientes/FormCliente'
import '../../components/clientes/clientes-minimalista.css'
import { API_BASE } from '../../utils/api'


// Constantes para las vistas
const VISTAS = {
  LISTA: 'lista',
  DETALLE: 'detalle',
  CREAR: 'crear'
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [error, setError] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [vistaActual, setVistaActual] = useState(VISTAS.LISTA)
  const [busqueda, setBusqueda] = useState('')
  
  useEffect(() => {
  fetchClientes()
  }, [])
  
  // Filtrar clientes según la búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!busqueda) return clientes
    
    const busquedaLower = busqueda.toLowerCase()
    return clientes.filter(cliente => 
      cliente.nombre?.toLowerCase().includes(busquedaLower) || 
      cliente.apellido?.toLowerCase().includes(busquedaLower) ||
      cliente.email?.toLowerCase().includes(busquedaLower) ||
      cliente.telefono?.toLowerCase().includes(busquedaLower)
    )
  }, [clientes, busqueda])
  
  async function fetchClientes() {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/Usuarios`, { headers })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message || `Error ${res.status} al obtener los usuarios`)
      }
      const data = await res.json()

      // Backend puede devolver un array o un objeto con items
      const list = Array.isArray(data) ? data : (data.items || data.users || [])

      const mapped = list.map(u => ({
        usuarioId: u.usuarioId ?? u.id ?? u.userId,
        nombre: u.nombre ?? u.firstName ?? u.name ?? '',
        apellido: u.apellido ?? u.lastName ?? '',
        email: u.email ?? u.correo ?? '-',
        telefono: u.telefono ?? u.phone ?? u.telefonoContacto ?? '-',
        estado: u.estado ?? 'activo',
        fechaCreacion: u.fechaCreacion ?? u.createdAt ?? null,
        fechaActualizacion: u.fechaActualizacion ?? u.updatedAt ?? null,
        raw: u
      }))

      setClientes(mapped)
    } catch (err) {
      console.error('Error fetching clientes:', err)
      setError(err.message || 'Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }
  
  const verDetalles = async (id) => {
    setLoadingDetalle(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/Usuarios/${id}`, { headers })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message || `Error ${res.status} al obtener detalles del usuario ${id}`)
      }
      const data = await res.json()

      const clienteDetallado = {
        usuarioId: data.usuarioId ?? data.id ?? data.userId,
        nombre: data.nombre ?? data.firstName ?? data.name ?? '',
        apellido: data.apellido ?? data.lastName ?? '',
        email: data.email ?? data.correo ?? '-',
        telefono: data.telefono ?? data.phone ?? '-',
        direccion: data.calle ?? data.direccion ?? null,
        ciudad: data.ciudad ?? null,
        codigoPostal: data.codigoPostal ?? null,
        fechaCreacion: data.fechaCreacion ?? data.createdAt ?? null,
        fechaActualizacion: data.fechaActualizacion ?? data.updatedAt ?? null,
        totalCompras: data.totalCompras ?? null,
        ultimaCompra: data.ultimaCompra ?? null,
        raw: data
      }

      setClienteSeleccionado(clienteDetallado)
      setVistaActual(VISTAS.DETALLE)
    } catch (err) {
      console.error(`Error fetching cliente ${id}:`, err)
      setError(`Error al cargar los detalles del usuario ${id}. ${err.message}`)
    } finally {
      setLoadingDetalle(false)
    }
  }
  
  const volverALista = () => {
    setVistaActual(VISTAS.LISTA)
    setClienteSeleccionado(null)
  }

  const mostrarCrear = () => {
    setVistaActual(VISTAS.CREAR)
    setClienteSeleccionado(null)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar usuario? Esto hará un borrado lógico.')) return
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/Usuarios/${id}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('Error al eliminar usuario')
      fetchClientes()
      // Si eliminamos el cliente seleccionado, volver a la lista
      if (clienteSeleccionado && clienteSeleccionado.usuarioId === id) {
        volverALista()
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClienteCreado = () => {
    fetchClientes()
    setVistaActual(VISTAS.LISTA)
  }
  
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value)
  }
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    )
  }
  
  return (
    <div className="clientes-page">
      <header className="page-header">
        <h2>Gestión de Clientes</h2>
        {clientes.length > 0 && 
          <span className="results-badge">
            {clientesFiltrados.length} clientes
          </span>
        }
      </header>
      
      {error && (
        <div className="error">
          <p>{error}</p>
          <button 
            className="alert-close" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Navegación superior - Sin botón de crear */}
      <div className="clientes-nav">
        <button 
          onClick={volverALista}
          className={vistaActual === VISTAS.LISTA ? 'active' : ''}
        >
          👥 Lista de Clientes
        </button>
      </div>

      {/* Renderizado condicional de vistas */}
      {vistaActual === VISTAS.LISTA && (
        <div className="vista-lista-clientes">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o teléfono..." 
              className="search-input"
              value={busqueda}
              onChange={handleBusquedaChange}
            />
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="empty-state">
              {busqueda ? (
                <p>No se encontraron clientes que coincidan con tu búsqueda</p>
              ) : (
                <p>No hay clientes registrados</p>
              )}
            </div>
          ) : (
            <ListaClientes 
              clientes={clientesFiltrados} 
              onView={verDetalles} 
              onDelete={handleEliminar}
            />
          )}
        </div>
      )}

      {vistaActual === VISTAS.CREAR && (
        <div className="vista-crear-cliente">
          <FormCliente
            onSaved={handleClienteCreado}
            onCancel={volverALista}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {vistaActual === VISTAS.DETALLE && (
        <div className="vista-detalle-cliente">
          {loadingDetalle ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Cargando detalles del cliente...</p>
            </div>
          ) : (
            <DetalleCliente 
              cliente={clienteSeleccionado} 
              onClose={volverALista} 
            />
          )}
        </div>
      )}
    </div>
  )
}
