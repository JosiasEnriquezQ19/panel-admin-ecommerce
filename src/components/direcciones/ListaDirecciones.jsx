import React from 'react'

export default function ListaDirecciones({ direcciones = [], usuarioInfo = null, onEliminar }){
  if (!direcciones || direcciones.length === 0) {
    return (
      <div className="empty-state">
        <p>No se encontraron direcciones para este usuario.</p>
        {!usuarioInfo && <p className="text-muted">Busca un usuario para ver sus direcciones.</p>}
      </div>
    )
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

  return (
    <div className="direcciones-lista">
      {usuarioInfo && (
        <div className="usuario-info-card">
          <div className="usuario-header">
            <div className="usuario-avatar">
              {(usuarioInfo.nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="usuario-datos">
              <h3 className="usuario-nombre">
                {usuarioInfo.nombre} {usuarioInfo.apellido}
              </h3>
              <p className="usuario-email">{usuarioInfo.email}</p>
              {usuarioInfo.telefono && (
                <p className="usuario-telefono">📞 {usuarioInfo.telefono}</p>
              )}
            </div>
            <div className="usuario-id">
              <span className="id-badge">ID: {usuarioInfo.usuarioId}</span>
            </div>
          </div>
        </div>
      )}

      <div className="direcciones-grid">
        {direcciones.map(direccion => (
          <div key={direccion.direccionId || direccion.id} className="direccion-card">
            <div className="direccion-header">
              <div className="direccion-icon">
                {getTipoDireccionIcon(direccion)}
              </div>
              <div className="direccion-id">
                ID: {direccion.direccionId || direccion.id}
              </div>
            </div>
            
            <div className="direccion-contenido">
              <div className="direccion-principal">
                {direccion.calle || direccion.callePrincipal || direccion.direccion || 'Dirección no especificada'}
              </div>
              
              <div className="direccion-detalles">
                {(direccion.colonia || direccion.barrio) && (
                  <div className="detalle-item">
                    <span className="detalle-label">Colonia:</span>
                    <span className="detalle-valor">{direccion.colonia || direccion.barrio}</span>
                  </div>
                )}
                
                <div className="detalle-item">
                  <span className="detalle-label">Ciudad:</span>
                  <span className="detalle-valor">{direccion.ciudad || direccion.city || 'No especificada'}</span>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-label">Estado:</span>
                  <span className="detalle-valor">{direccion.estado || direccion.provincia || 'No especificado'}</span>
                </div>
                
                <div className="detalle-item">
                  <span className="detalle-label">Código Postal:</span>
                  <span className="detalle-valor">{direccion.codigoPostal || direccion.cp || 'No especificado'}</span>
                </div>
              </div>
              
              <div className="direccion-completa">
                <strong>Dirección completa:</strong><br />
                <span className="direccion-texto">{formatearDireccionCompleta(direccion)}</span>
              </div>
            </div>
            
            <div className="direccion-actions">
              <button 
                className="btn-eliminar-direccion"
                onClick={() => onEliminar(direccion.direccionId || direccion.id)}
                title="Eliminar dirección"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
