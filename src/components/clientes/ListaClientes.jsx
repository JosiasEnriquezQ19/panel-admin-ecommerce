import '../../pages/categorias/categorias.css'
import '../../pages/clientes/clientes-modern.css'

export default function ListaClientes({ clientes, onView, onDelete }) {
  if (!clientes || clientes.length === 0) {
    return (
      <div className="text-center">
        <p>No hay clientes registrados</p>
      </div>
    );
  }

  return (
    <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
      <table className="categories-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clientes</th>
            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Celular</th>
            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => {
            const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || 'Desconocido';
            const avatarUrl = cliente.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=random&color=fff&rounded=true&size=128`;

            return (
              <tr key={cliente.usuarioId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div className="cat-name">
                    <img
                      src={avatarUrl}
                      alt={nombreCompleto}
                      className="cat-thumb"
                      style={{ borderRadius: '50%' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>
                        {nombreCompleto}
                      </span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>
                        {cliente.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', opacity: 0.8, fontSize: '0.9rem' }}>
                  {cliente.telefono || 'Sin celular'}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className={`status-badge ${cliente.estado === 'activo' ? 'active' : 'inactive'}`}>
                    {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      className="btn-icon edit"
                      onClick={() => onView(cliente.usuarioId)}
                      title="Ver detalles"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => onDelete(cliente.usuarioId)}
                      title="Eliminar usuario"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
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

