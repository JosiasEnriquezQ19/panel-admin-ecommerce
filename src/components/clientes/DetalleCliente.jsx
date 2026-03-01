import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/api'

export default function DetalleCliente({ cliente, onClose }) {
  const [metodosPago, setMetodosPago] = useState([])
  const [loadingMetodos, setLoadingMetodos] = useState(false)
  const [errorMetodos, setErrorMetodos] = useState(null)
  const [direcciones, setDirecciones] = useState([])
  const [loadingDirecciones, setLoadingDirecciones] = useState(false)
  const [errorDirecciones, setErrorDirecciones] = useState(null)

  // Cargar métodos de pago y direcciones cuando cambie el cliente
  useEffect(() => {
    if (cliente && (cliente.usuarioId || cliente.id)) {
      const usuarioId = cliente.usuarioId || cliente.id
      fetchMetodosPago(usuarioId)
      fetchDirecciones(usuarioId)
    }
  }, [cliente])

  const fetchMetodosPago = async (usuarioId) => {
    setLoadingMetodos(true)
    setErrorMetodos(null)
    try {
      const res = await fetch(`${API_BASE}/MetodosPago/usuario/${usuarioId}`)
      if (res.ok) {
        const data = await res.json()
        setMetodosPago(Array.isArray(data) ? data : [])
      } else {
        setMetodosPago([])
      }
    } catch (err) {
      setErrorMetodos('Error al cargar métodos de pago')
      setMetodosPago([])
    } finally {
      setLoadingMetodos(false)
    }
  }

  const fetchDirecciones = async (usuarioId) => {
    setLoadingDirecciones(true)
    setErrorDirecciones(null)
    try {
      const res = await fetch(`${API_BASE}/Direcciones/usuario/${usuarioId}`)
      if (res.ok) {
        const data = await res.json()
        setDirecciones(Array.isArray(data) ? data : [])
      } else {
        setDirecciones([])
      }
    } catch (err) {
      setErrorDirecciones('Error al cargar direcciones')
      setDirecciones([])
    } finally {
      setLoadingDirecciones(false)
    }
  }

  const getTipoTarjetaIcon = (tipo) => {
    const tipoLower = (tipo || '').toLowerCase()
    if (tipoLower.includes('visa')) return '💳'
    if (tipoLower.includes('mastercard') || tipoLower.includes('master')) return '💳'
    if (tipoLower.includes('american') || tipoLower.includes('amex')) return '💳'
    if (tipoLower.includes('paypal')) return '💰'
    return '💳'
  }

  const formatearExpiracion = (mes, ano) => {
    if (!mes || !ano) return 'N/A'
    const mesFormateado = String(mes).padStart(2, '0')
    const anoFormateado = String(ano).length === 2 ? `20${ano}` : String(ano)
    return `${mesFormateado}/${anoFormateado.slice(-2)}`
  }

  const getTipoDireccionIcon = (direccion) => {
    const calle = (direccion.calle || direccion.callePrincipal || direccion.direccion || '').toLowerCase()
    if (calle.includes('casa') || calle.includes('hogar')) return '🏠'
    if (calle.includes('oficina') || calle.includes('trabajo') || calle.includes('empresa')) return '🏢'
    if (calle.includes('apartamento') || calle.includes('depto') || calle.includes('apto')) return '🏠'
    return '📍'
  }

  const formatearDireccionCompleta = (direccion) => {
    const partes = []
    if (direccion.calle || direccion.callePrincipal || direccion.direccion) {
      partes.push(direccion.calle || direccion.callePrincipal || direccion.direccion)
    }
    if (direccion.colonia || direccion.barrio) {
      partes.push(direccion.colonia || direccion.barrio)
    }
    if (direccion.ciudad || direccion.city) {
      partes.push(direccion.ciudad || direccion.city)
    }
    if (direccion.estado || direccion.provincia) {
      partes.push(direccion.estado || direccion.provincia)
    }
    if (direccion.codigoPostal || direccion.cp) {
      partes.push(`CP ${direccion.codigoPostal || direccion.cp}`)
    }
    return partes.join(', ')
  }

  if (!cliente) {
    return (
      <div className="detalle-cliente-vacio">
        <div className="detalle-placeholder">
          <div className="placeholder-icon">👤</div>
          <h3>No hay cliente seleccionado</h3>
          <p className="text-muted">Selecciona un cliente desde la lista para ver sus detalles completos</p>
        </div>
      </div>
    );
  }

  // Manejo de posibles variaciones en nombres de campo
  const id = cliente.usuarioId || cliente.id || '';
  const nombre = cliente.nombre || '';
  const apellido = cliente.apellido || '';
  const email = cliente.email || '';
  const telefono = cliente.telefono || '';
  const estado = cliente.estado === 'inactivo' || cliente.estado === false ? 'inactivo' : 'activo';
  const direccion = cliente.direccion || '';
  const ciudad = cliente.ciudad || (cliente.direccion?.ciudad) || '';
  const codigoPostal = cliente.codigoPostal || (cliente.direccion?.codigoPostal) || '';
  const fechaCreacion = cliente.fechaCreacion || cliente.createdAt || '';
  const fechaActualizacion = cliente.fechaActualizacion || cliente.updatedAt || '';

  return (
    <div className="card-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 className="card-title" style={{ margin: 0, color: 'white' }}>Detalles del Usuario</h3>
        <button
          className="btn-secondary"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>←</span> Volver
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px', alignItems: 'start' }}>

        {/* Left Column: Profile Card */}
        <div style={{ background: '#1e1e2d', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #4f46e5)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '20px', boxShadow: '0 8px 16px rgba(108, 93, 211, 0.4)' }}>
            {(nombre || '?').charAt(0).toUpperCase()}
          </div>

          <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.5rem' }}>{nombre} {apellido}</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{id}</p>

          <div style={{ marginTop: '20px', padding: '8px 16px', background: estado === 'activo' ? 'rgba(0, 214, 143, 0.15)' : 'rgba(255, 107, 107, 0.15)', borderRadius: '20px', color: estado === 'activo' ? '#00d68f' : '#ff6b6b', fontWeight: '600', fontSize: '0.9rem' }}>
            {estado === 'activo' ? 'Activo' : 'Inactivo'}
          </div>

          <div style={{ width: '100%', marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.2rem' }}>📧</span>
              <span style={{ color: 'white' }}>{email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <span style={{ color: 'white' }}>{telefono || 'Sin teléfono'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
              <span>Registrado: {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details & Addresses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Addresses Section */}
          <div style={{ background: '#1e1e2d', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>📍 Direcciones Guardadas</h4>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', color: 'white' }}>{direcciones.length}</span>
            </div>

            {loadingDirecciones ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando direcciones...</p>
            ) : direcciones.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                No hay direcciones registradas
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {direcciones.map((dir, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getTipoDireccionIcon(dir)}</span>
                      <span style={{ color: 'white', fontWeight: '500' }}>{dir.calle ? 'Casa/Oficina' : 'Dirección'}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                      {formatearDireccionCompleta(dir)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Basic Stats or Extra Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: '#1e1e2d', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ color: 'var(--text-muted)', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Compras Totales</h4>
              <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>0</div>
            </div>
            <div style={{ background: '#1e1e2d', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ color: 'var(--text-muted)', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase' }}>Última Actividad</h4>
              <div style={{ color: 'white', fontSize: '1.1rem' }}>{fechaActualizacion ? new Date(fechaActualizacion).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
