import React from 'react'

export default function ListaDirecciones({ direcciones = [], usuarioInfo = null, onEliminar }) {
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
        <div className="usuario-info-card" style={{ background: '#1e1e2d', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div className="usuario-avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {(usuarioInfo.nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="usuario-nombre" style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.4rem' }}>
                {usuarioInfo.nombre} {usuarioInfo.apellido}
              </h3>
              <div className="usuario-id">
                <span className="id-badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {usuarioInfo.usuarioId}</span>
                {usuarioInfo.rol && <span style={{ marginLeft: '10px', background: 'rgba(108, 93, 211, 0.2)', color: '#6c5dd3', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>{usuarioInfo.rol}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Correo Electrónico</span>
              <span style={{ color: 'white', fontSize: '0.95rem' }}>{usuarioInfo.email}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Teléfono</span>
              <span style={{ color: 'white', fontSize: '0.95rem' }}>{usuarioInfo.telefono || 'No registrado'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Estado</span>
              <span style={{ color: usuarioInfo.estado === 'activo' || usuarioInfo.estado === true ? '#00d68f' : '#ff6b6b', fontSize: '0.95rem', fontWeight: '500' }}>
                {usuarioInfo.estado === 'activo' || usuarioInfo.estado === true ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha Registro</span>
              <span style={{ color: 'white', fontSize: '0.95rem' }}>
                {usuarioInfo.fechaCreacion ? new Date(usuarioInfo.fechaCreacion).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="direcciones-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {direcciones.map(direccion => (
          <div key={direccion.direccionId || direccion.id} className="direccion-card" style={{ background: '#1e1e2d', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div className="direccion-header" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>{getTipoDireccionIcon(direccion)}</span>
                <span style={{ color: 'white', fontWeight: '500' }}>{direccion.calle ? 'Casa/Oficina' : 'Dirección'}</span>
              </div>
              <div className="direccion-id" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ID: {direccion.direccionId || direccion.id}
              </div>
            </div>

            <div className="direccion-contenido" style={{ padding: '20px' }}>
              <div className="direccion-principal" style={{ fontSize: '1.1rem', color: 'white', marginBottom: '15px', fontWeight: '500' }}>
                {direccion.calle || direccion.callePrincipal || direccion.direccion || 'Dirección no especificada'}
              </div>

              <div className="direccion-detalles" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', marginBottom: '15px' }}>
                {(direccion.colonia || direccion.barrio || direccion.Colonia) && (
                  <div style={{ background: '#151521', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Colonia</span>
                    <span style={{ color: 'white', fontWeight: '500' }}>{direccion.colonia || direccion.barrio || direccion.Colonia}</span>
                  </div>
                )}
                <div style={{ background: '#151521', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ciudad</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{direccion.ciudad || direccion.city || direccion.Ciudad || 'No esp.'}</span>
                </div>
                <div style={{ background: '#151521', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estado</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{direccion.estado || direccion.provincia || direccion.Estado || 'No esp.'}</span>
                </div>
                <div style={{ background: '#151521', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>CP</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{direccion.codigoPostal || direccion.cp || direccion.CodigoPostal || direccion.CP || 'No esp.'}</span>
                </div>
              </div>

              <div className="direccion-completa" style={{ background: '#151521', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {formatearDireccionCompleta(direccion)}
              </div>
            </div>

            <div className="direccion-actions" style={{ padding: '15px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-eliminar-direccion"
                onClick={() => onEliminar(direccion.direccionId || direccion.id)}
                title="Eliminar dirección"
                style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}
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
