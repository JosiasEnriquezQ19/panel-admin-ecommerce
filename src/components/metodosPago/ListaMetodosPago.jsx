import React from 'react'

export default function ListaMetodosPago({ metodos = [], usuarioInfo = null, onEliminar }){
  if (!metodos || metodos.length === 0) {
    return (
      <div className="empty-state">
        <p>No se encontraron métodos de pago para este usuario.</p>
        {!usuarioInfo && <p className="text-muted">Busca un usuario para ver sus métodos de pago.</p>}
      </div>
    )
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
    if (!mes || !ano) return 'No disponible'
    const mesFormateado = String(mes).padStart(2, '0')
    const anoFormateado = String(ano).length === 2 ? `20${ano}` : String(ano)
    return `${mesFormateado}/${anoFormateado.slice(-2)}`
  }

  return (
    <div className="metodos-pago-lista">
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

      <div className="metodos-grid">
        {metodos.map(metodo => (
          <div key={metodo.metodoPagoId || metodo.id} className="metodo-card">
            <div className="metodo-header">
              <div className="metodo-icon">
                {getTipoTarjetaIcon(metodo.tipoTarjeta || metodo.TipoTarjeta || metodo.tipo)}
              </div>
              <div className="metodo-tipo">
                {metodo.tipoTarjeta || metodo.TipoTarjeta || metodo.tipo || 'Tarjeta'}
              </div>
              {metodo.esPrincipal && (
                <span className="badge-principal">Principal</span>
              )}
            </div>
            
            <div className="metodo-details">
              <div className="numero-tarjeta">
                •••• •••• •••• {metodo.ultimosCuatroDigitos || metodo.ultimos4 || '****'}
              </div>
              
              <div className="metodo-info">
                <div className="info-item">
                  <span className="info-label">Expira:</span>
                  <span className="info-value">
                    {formatearExpiracion(
                      metodo.mesExpiracion || metodo.mes, 
                      metodo.añoExpiracion || metodo.ano
                    )}
                  </span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">ID:</span>
                  <span className="info-value">{metodo.metodoPagoId || metodo.id}</span>
                </div>
              </div>
            </div>
            
            <div className="metodo-actions">
              <button 
                className="btn-eliminar-metodo"
                onClick={() => onEliminar(metodo.metodoPagoId || metodo.id)}
                title="Eliminar método de pago"
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
