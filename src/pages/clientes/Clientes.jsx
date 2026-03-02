import React, { useEffect, useState, useMemo } from 'react'
import DetalleCliente from '../../components/clientes/DetalleCliente'
import ListaClientes from '../../components/clientes/ListaClientes'
import FormCliente from '../../components/clientes/FormCliente'
import './clientes-modern.css'
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
        profilePictureUrl: u.profilePictureUrl ?? u.picture ?? u.fotoPerfil ?? null,
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
    <div className="clientes-dashboard">
      <header className="cl-header">
        <h2 className="cl-title">Clientes</h2>
        <p className="cl-subtitle">Gestiona la información de todos tus clientes.</p>
      </header>

      {error && (
        <div className="error" style={{ marginBottom: '24px' }}>
          <p>{error}</p>
          <button
            className="alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Navegación superior tabs  */}
      <div className="cl-tabs-bar">
        <div
          className={`cl-tab ${vistaActual === VISTAS.LISTA ? 'active' : ''}`}
          onClick={volverALista}
        >
          Todos los Clientes <span className="cl-tab-count">{clientes.length.toString().padStart(2, '0')}</span>
        </div>
        <div style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.95rem' }}>
          Potenciales <span className="cl-tab-count" style={{ background: '#f3f4f6' }}> 00</span>
        </div>
        <div style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.95rem' }}>
          En Proceso <span className="cl-tab-count" style={{ background: '#f3f4f6' }}> 00</span>
        </div>
        <div style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.95rem' }}>
          Cerrados <span className="cl-tab-count" style={{ background: '#f3f4f6' }}> 00</span>
        </div>
      </div>

      {/* Renderizado condicional de vistas */}
      {vistaActual === VISTAS.LISTA && (
        <div className="vista-lista-clientes">
          <div className="cl-search-container">
            <div className="cl-search-box">
              <svg className="cl-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="cl-search-input"
                value={busqueda}
                onChange={handleBusquedaChange}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
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
        <div className="vista-crear-cliente" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #f3f4f6' }}>
          <FormCliente
            onSaved={handleClienteCreado}
            onCancel={volverALista}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {vistaActual === VISTAS.DETALLE && (
        <div className="vista-detalle-cliente" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #f3f4f6' }}>
          {loadingDetalle ? (
            <div className="loading-container">
              <div className="spinner"></div>
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
