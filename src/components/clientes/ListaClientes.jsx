import React from 'react'
import '../../pages/categorias/categorias.css' // Shared styles

export default function ListaClientes({ clientes, onView, onDelete }) {
  if (!clientes || clientes.length === 0) return <div>No hay clientes.</div>

  return (
    <div className="table-responsive">
      <table className="categories-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th className="th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map(cliente => {
            // Obtener iniciales para el avatar
            const iniciales = `${cliente.nombre?.[0] || ''}${cliente.apellido?.[0] || ''}`.toUpperCase();

            return (
              <tr key={cliente.usuarioId}>
                <td>
                  <div className="product-identity">
                    <div className="user-avatar-circle" style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {iniciales || '?'}
                    </div>
                    <div className="product-info">
                      <span className="product-name" style={{ color: 'white' }}>{`${cliente.nombre || ''} ${cliente.apellido || ''}`}</span>
                      <span className="product-id" style={{ fontSize: '0.8rem', opacity: 0.7 }}>#{cliente.usuarioId}</span>
                    </div>
                  </div>
                </td>
                <td>{cliente.email}</td>
                <td>{cliente.telefono || '-'}</td>
                <td>
                  <span className={`status-badge ${cliente.estado === 'activo' ? 'disponible' : 'inactive'}`}>
                    {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => onView(cliente.usuarioId)}
                    className="btn-icon view"
                    title="Ver detalles"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button
                    onClick={() => onDelete(cliente.usuarioId)}
                    className="btn-icon delete"
                    title="Eliminar usuario"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}
