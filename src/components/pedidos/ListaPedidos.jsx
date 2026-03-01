import React from 'react';
import './pedidos-styles.css';
import './pedidos-minimalista.css';
import { formatDatePeru } from '../../utils/dateUtils';

// Los mismos estados de pedido que usamos en otras partes
const estadosPedido = {
  'pendiente': { color: '#ffc107', label: 'Pendiente' },
  'procesando': { color: '#17a2b8', label: 'Procesando' },
  'enviado': { color: '#28a745', label: 'Enviado' },
  'entregado': { color: '#6c757d', label: 'Entregado' },
  'cancelado': { color: '#dc3545', label: 'Cancelado' }
};

export default function ListaPedidos({ pedidos, verDetalle, cambiarEstado }) {
  if (!pedidos || pedidos.length === 0) {
    return (
      <div className="lista-vacia">
        No hay pedidos disponibles
      </div>
    );
  }

  return (
    <div className="minimal-table-container">
      <table className="minimal-table">
        <thead>
          <tr>
            <th style={{ paddingLeft: '20px' }}>ID</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th style={{ textAlign: 'center' }}>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id}>
              <td style={{ paddingLeft: '20px', color: 'var(--text-muted)' }}>#{pedido.id}</td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '500', color: 'white' }}>{pedido.usuario}</span>
                  {pedido.usuarioObj && pedido.usuarioObj.telefono &&
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pedido.usuarioObj.telefono}</span>
                  }
                </div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{formatDatePeru(pedido.fecha)}</td>
              <td style={{ textAlign: 'center' }}>
                <span style={{ background: '#151521', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>{pedido.productos}</span>
              </td>
              <td style={{ fontWeight: '600', color: 'white' }}>S/ {(Number(pedido.total || 0)).toLocaleString('es-PE')}</td>
              <td>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: estadosPedido[pedido.estado]?.color ? `${estadosPedido[pedido.estado]?.color}20` : '#333',
                    color: estadosPedido[pedido.estado]?.color || '#ccc',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: `1px solid ${estadosPedido[pedido.estado]?.color ? `${estadosPedido[pedido.estado]?.color}40` : '#444'}`
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: estadosPedido[pedido.estado]?.color || '#ccc' }}></span>
                  {estadosPedido[pedido.estado]?.label || pedido.estado}
                </span>
              </td>
              <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button className="btn-icon-small" onClick={() => verDetalle(pedido)} title="Ver detalles">
                    👁️
                  </button>

                  <button
                    className="btn-icon-small"
                    onClick={() => cambiarEstado(pedido.id, 'enviado')}
                    disabled={pedido.estado === 'enviado' || pedido.estado === 'entregado' || pedido.estado === 'cancelado'}
                    title="Marcar como Enviado"
                    style={{ opacity: (pedido.estado === 'enviado' || pedido.estado === 'entregado' || pedido.estado === 'cancelado') ? 0.3 : 1 }}
                  >
                    📦
                  </button>

                  <button className="btn-icon-small" onClick={() => {
                    const nuevo = prompt('Nuevo estado (pendiente, procesando, enviado, entregado, cancelado):', pedido.estado);
                    if (nuevo) cambiarEstado(pedido.id, nuevo);
                  }} title="Cambiar Estado">
                    📝
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
