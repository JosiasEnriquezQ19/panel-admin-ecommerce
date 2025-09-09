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
    <div className="detalle-cliente-container">
      {/* Header con botón volver */}
      <div className="detalle-header-simple">
        <button 
          className="btn-volver-simple"
          onClick={onClose}
          title="Volver a la lista"
        >
          ← Volver a la lista
        </button>
      </div>

      {/* Card principal del cliente */}
      <div className="cliente-card-principal">
        {/* Header del cliente */}
        <div className="cliente-header">
          <div className="cliente-avatar-info">
            <div className={`cliente-avatar ${estado === 'activo' ? 'activo' : 'inactivo'}`}>
              {(nombre || '?').charAt(0).toUpperCase()}
            </div>
            <div className="cliente-info-basica">
              <h1 className="cliente-nombre">{nombre} {apellido}</h1>
              <p className="cliente-email">{email}</p>
              <div className="cliente-meta">
                <span className="cliente-id">ID: {id}</span>
                <span className={`cliente-estado ${estado}`}>
                  <span className="estado-dot"></span>
                  {estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="cliente-actions">
            <button className="btn-accion-secundario">
              ✏️ Editar
            </button>
          </div>
        </div>

        {/* Información de contacto rápida */}
        <div className="contacto-rapido">
          <div className="contacto-item">
            <span className="contacto-icono">📱</span>
            <span className="contacto-texto">{telefono || 'Sin teléfono'}</span>
          </div>
          <div className="contacto-item">
            <span className="contacto-icono">�</span>
            <span className="contacto-texto">
              Cliente desde {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long'
              }) : 'fecha desconocida'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de secciones */}
      <div className="detalle-grid">
        {/* Métodos de Pago ocultos temporalmente
        <div className="seccion-card">
          <div className="seccion-header">
            <h3>💳 Métodos de Pago</h3>
            <span className="seccion-count">{metodosPago.length}</span>
          </div>
          <div className="seccion-contenido">
            {loadingMetodos ? (
              <div className="estado-loading">
                <div className="spinner-sm"></div>
                <span>Cargando...</span>
              </div>
            ) : errorMetodos ? (
              <div className="estado-error">
                <span>⚠️</span>
                <span>Error al cargar métodos de pago</span>
              </div>
            ) : metodosPago.length === 0 ? (
              <div className="estado-vacio">
                <span>💳</span>
                <span>No hay métodos de pago</span>
              </div>
            ) : (
              <div className="items-grid">
                {metodosPago.map(metodo => (
                  <div key={metodo.metodoPagoId || metodo.id} className="item-card metodo-item">
                    <div className="item-header">
                      <span className="item-icono">
                        {getTipoTarjetaIcon(metodo.tipoTarjeta || metodo.TipoTarjeta || metodo.tipo)}
                      </span>
                      <div className="item-info">
                        <span className="item-titulo">
                          {metodo.tipoTarjeta || metodo.TipoTarjeta || metodo.tipo || 'Tarjeta'}
                        </span>
                        {metodo.esPrincipal && (
                          <span className="badge-principal">Principal</span>
                        )}
                      </div>
                    </div>
                    <div className="metodo-numero">
                      •••• •••• •••• {metodo.ultimosCuatroDigitos || metodo.ultimos4 || '****'}
                    </div>
                    <div className="metodo-expira">
                      Exp: {formatearExpiracion(
                        metodo.mesExpiracion || metodo.mes, 
                        metodo.añoExpiracion || metodo.ano
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        */}

        {/* Direcciones */}
        <div className="seccion-card">
          <div className="seccion-header">
            <h3>📍 Direcciones</h3>
            <span className="seccion-count">{direcciones.length}</span>
          </div>
          
          <div className="seccion-contenido">
            {loadingDirecciones ? (
              <div className="estado-loading">
                <div className="spinner-sm"></div>
                <span>Cargando...</span>
              </div>
            ) : errorDirecciones ? (
              <div className="estado-error">
                <span>⚠️</span>
                <span>Error al cargar direcciones</span>
              </div>
            ) : direcciones.length === 0 ? (
              <div className="estado-vacio">
                <span>📍</span>
                <span>No hay direcciones</span>
              </div>
            ) : (
              <div className="items-list">
                {direcciones.map(direccion => (
                  <div key={direccion.direccionId || direccion.id} className="item-card direccion-item">
                    <div className="item-header">
                      <span className="item-icono">
                        {getTipoDireccionIcon(direccion)}
                      </span>
                      <div className="item-info">
                        <span className="item-titulo">
                          {direccion.calle || direccion.callePrincipal || direccion.direccion || 'Dirección'}
                        </span>
                        <span className="direccion-id">ID: {direccion.direccionId || direccion.id}</span>
                      </div>
                    </div>
                    <div className="direccion-detalles">
                      <div className="direccion-linea">
                        {(direccion.colonia || direccion.barrio) && 
                          <span>{direccion.colonia || direccion.barrio}, </span>
                        }
                        <span>{direccion.ciudad || direccion.city || 'Ciudad'}</span>
                      </div>
                      <div className="direccion-linea">
                        <span>{direccion.estado || direccion.provincia || 'Estado'}</span>
                        {(direccion.codigoPostal || direccion.cp) && 
                          <span> - CP {direccion.codigoPostal || direccion.cp}</span>
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
