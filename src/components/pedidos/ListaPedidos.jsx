import React, { useState } from 'react';
import '../../pages/pedidos/pedidos-modern.css';
import { formatDatePeru } from '../../utils/dateUtils';

export default function ListaPedidos({ pedidos, verDetalle, cambiarEstado }) {
  if (!pedidos || pedidos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>No hay pedidos disponibles</p>
      </div>
    );
  }

  const statusMap = {
    'pendiente': 'Pendiente',
    'procesando': 'Procesando',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  };

  return (
    <div className="pd-table-wrapper">
      <div className="pd-table-header">
        <h3 className="pd-table-title">Lista de Pedidos</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="pd-btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exportar a CSV
          </button>
        </div>
      </div>

      <table className="pd-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}><input type="checkbox" /></th>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Fecha Pedido</th>
            <th>Precio Total</th>
            <th>Estado del Pedido</th>
            <th>Cantidad</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map(pedido => {
            const rawStatus = pedido.estado?.toLowerCase() || 'pendiente';
            const mappedStatus = statusMap[rawStatus] || 'Pendiente';
            const statusClass = (rawStatus === 'enviado' || rawStatus === 'entregado') ? 'entregado' :
              (rawStatus === 'cancelado') ? 'cancelado' :
                (rawStatus === 'procesando') ? 'procesando' : 'pendiente';

            const clientName = pedido.usuarioObj ? `${pedido.usuarioObj.nombre} ${pedido.usuarioObj.apellido}` : pedido.usuario;

            return (
              <tr key={pedido.id}>
                <td><input type="checkbox" /></td>
                <td style={{ fontWeight: 500 }}>#{pedido.id.toString().padStart(6, '0')}</td>
                <td>{clientName}</td>
                <td>{formatDatePeru(pedido.fecha).split(' ')[0]}</td>
                <td style={{ fontWeight: 600 }}>S/ {(Number(pedido.total || 0)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                <td>
                  <span className={`pd-status-badge ${statusClass}`}>
                    <span className="pd-status-dot"></span>
                    {mappedStatus}
                  </span>
                </td>
                <td>{pedido.productos} unids</td>
                <td>
                  <div className="pd-action-icon" onClick={() => verDetalle(pedido)} title="Ver Detalles">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

