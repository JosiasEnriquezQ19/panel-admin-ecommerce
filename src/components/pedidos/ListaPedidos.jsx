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
    <div className="lista-pedidos-container">
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => (
            <tr key={pedido.id} className="order-row">
              <td className="order-id">{pedido.id}</td>
              <td className="order-user">
                <div className="user-info">
                  <span className="user-name">{pedido.usuario}</span>
                  {pedido.usuarioObj && pedido.usuarioObj.telefono && 
                    <span className="user-phone">{pedido.usuarioObj.telefono}</span>
                  }
                </div>
              </td>
              <td className="order-date">{formatDatePeru(pedido.fecha)}</td>
              <td className="order-products">{pedido.productos}</td>
              <td className="order-total">S/ {(Number(pedido.total) || 0).toLocaleString('es-PE')}</td>
              <td className="order-status">
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: estadosPedido[pedido.estado]?.color || '#ccc' }}
                >
                  {estadosPedido[pedido.estado]?.label || pedido.estado}
                </span>
              </td>
              <td className="order-actions">
                <button className="action-button view-button" onClick={() => verDetalle(pedido)}>
                  <span className="action-icon">👁️</span>
                  <span className="action-text">Ver</span>
                </button>
                
                <button 
                  className={`action-button ship-button ${pedido.estado === 'enviado' || pedido.estado === 'entregado' || pedido.estado === 'cancelado' ? 'disabled' : ''}`}
                  onClick={() => cambiarEstado(pedido.id, 'enviado')}
                  disabled={pedido.estado === 'enviado' || pedido.estado === 'entregado' || pedido.estado === 'cancelado'}
                >
                  <span className="action-icon">📦</span>
                  <span className="action-text">Enviar</span>
                </button>
                
                <button className="action-button status-button" onClick={() => {
                  const nuevo = prompt('Nuevo estado (pendiente, procesando, enviado, entregado, cancelado):', pedido.estado);
                  if (nuevo) cambiarEstado(pedido.id, nuevo);
                }}>
                  <span className="action-icon">📝</span>
                  <span className="action-text">Estado</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
