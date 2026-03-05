import React, { useEffect, useState, useMemo } from 'react'
import DetalleCliente from '../../components/clientes/DetalleCliente'
import ListaClientes from '../../components/clientes/ListaClientes'
import FormCliente from '../../components/clientes/FormCliente'
import './clientes-modern.css'
import '../categorias/categorias.css'
import { API_BASE } from '../../utils/api'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [error, setError] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

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
    setShowModal(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/Usuarios/${id}`, { headers })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message || `Error ${res.status}`)
      }
      const data = await res.json()
      setClienteSeleccionado({
        usuarioId: data.usuarioId ?? data.id ?? data.userId,
        nombre: data.nombre ?? data.firstName ?? data.name ?? '',
        apellido: data.apellido ?? data.lastName ?? '',
        email: data.email ?? data.correo ?? '-',
        telefono: data.telefono ?? data.phone ?? '-',
        estado: data.estado ?? 'activo',
        profilePictureUrl: data.profilePictureUrl ?? data.picture ?? data.fotoPerfil ?? null,
        fechaCreacion: data.fechaCreacion ?? data.createdAt ?? null,
        fechaActualizacion: data.fechaActualizacion ?? data.updatedAt ?? null,
        raw: data
      })
    } catch (err) {
      console.error(`Error fetching cliente ${id}:`, err)
      setError(`Error al cargar detalles: ${err.message}`)
      setShowModal(false)
    } finally {
      setLoadingDetalle(false)
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
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
      if (clienteSeleccionado && clienteSeleccionado.usuarioId === id) {
        cerrarModal()
      }
    } catch (err) {
      setError(err.message)
    }
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
    <div className="categorias-page">
      <header className="page-header">
        <div>
          <h2>Clientes</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gestiona la información de todos tus clientes. Total: <strong>{clientes.length}</strong>
          </p>
        </div>
      </header>

      {error && (
        <div className="alert-error" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* La tabla siempre se muestra */}
      <div className="vista-lista-clientes">
        {clientesFiltrados.length === 0 ? (
          <div className="text-center" style={{ padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p>No hay clientes registrados</p>
          </div>
        ) : (
          <ListaClientes
            clientes={clientesFiltrados}
            onView={verDetalles}
            onDelete={handleEliminar}
          />
        )}
      </div>

      {/* Modal overlay del detalle de usuario */}
      {showModal && (
        <div className="cl-modal-overlay" onClick={cerrarModal}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Detalle de Usuario</h3>
              <button className="cl-modal-close" onClick={cerrarModal}>✕</button>
            </div>
            <div className="cl-modal-body">
              {loadingDetalle ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Cargando información del usuario...
                </div>
              ) : (
                <DetalleCliente cliente={clienteSeleccionado} onClose={cerrarModal} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
