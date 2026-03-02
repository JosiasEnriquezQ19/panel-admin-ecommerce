import '../../pages/clientes/clientes-modern.css'

export default function ListaClientes({ clientes, onView, onDelete }) {
  if (!clientes || clientes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>No hay clientes registrados</p>
      </div>
    );
  }

  return (
    <div className="cl-table-wrapper">
      <table className="cl-table">
        <thead>
          <tr>
            <th>Clientes</th>
            <th>Celular</th>
            <th>Estado</th>
            <th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => {
            const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Desconocido';

            // Generate a Google-like avatar using ui-avatars, or fallback to an image service
            const avatarUrl = cliente.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=random&color=fff&rounded=true&size=128`;

            return (
              <tr key={cliente.usuarioId}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={avatarUrl}
                      alt={nombreCompleto}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem' }}>
                        {nombreCompleto}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
                        {cliente.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  {cliente.telefono || 'Sin celular'}
                </td>
                <td>
                  <span style={{ color: cliente.estado === 'activo' ? '#10b981' : '#ef4444', fontWeight: 500, fontSize: '0.9rem' }}>
                    {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', color: '#6b7280' }}>
                    <div style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#5b21b6'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'} onClick={() => onView(cliente.usuarioId)} title="Ver detalles">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </div>
                    <div style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'} onClick={() => onDelete(cliente.usuarioId)} title="Eliminar usuario">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}
