import React from 'react'
import './clientes-minimalista.css'

export default function ListaClientes({ clientes, onView, onDelete }){
  if(!clientes || clientes.length === 0) return <div>No hay clientes.</div>

  return (
    <div className="clientes-tabla-container">
      <table className="clientes-tabla">
        <thead>
          <tr>
            <th className="th-avatar"></th>
            <th>Nombre</th>
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
              <tr key={cliente.usuarioId} className="cliente-fila">
                <td className="td-avatar">
                  <div className="cliente-avatar">
                    {iniciales || '?'}
                  </div>
                </td>
                <td className="td-nombre">
                  <div className="cliente-nombre">
                    {`${cliente.nombre || ''} ${cliente.apellido || ''}`}
                  </div>
                  <div className="cliente-id">ID: {cliente.usuarioId}</div>
                </td>
                <td className="td-email">{cliente.email}</td>
                <td className="td-telefono">{cliente.telefono || '-'}</td>
                <td className="td-estado">
                  <span className={`estado-badge estado-${cliente.estado === 'activo' ? 'activo' : 'inactivo'}`}>
                    {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="td-actions">
                  <button 
                    onClick={() => onView(cliente.usuarioId)} 
                    className="btn-action btn-view"
                    title="Ver detalles"
                  >
                    👁️ Ver
                  </button>
                  <button 
                    onClick={() => onDelete(cliente.usuarioId)} 
                    className="btn-action btn-delete"
                    title="Eliminar usuario"
                  >
                    🗑️ Eliminar
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
