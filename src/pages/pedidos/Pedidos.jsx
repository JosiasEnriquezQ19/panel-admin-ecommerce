import React, { useEffect, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import DetallePedido from '../../components/pedidos/DetallePedido'
import ListaPedidos from '../../components/pedidos/ListaPedidos'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './pedidos-modern.css'
import { formatDatePeru, getDateFromPeriod } from '../../utils/dateUtils'

import { API_BASE } from '../../utils/api'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPedido, setSelectedPedido] = useState(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const fetchPedidos = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const tryWithUserUrl = `${API_BASE}/Pedidos/with-user`
      let res = await fetch(tryWithUserUrl, { headers })
      let data = null

      if (res.ok) {
        data = await res.json()
      } else if (res.status === 404) {
        const fallbackUrl = `${API_BASE}/Pedidos`
        const res2 = await fetch(fallbackUrl, { headers })
        if (!res2.ok) {
          const errBody = await res2.json().catch(() => null)
          throw new Error(errBody?.message || `Error ${res2.status} al obtener pedidos`)
        }
        data = await res2.json()

        const pedidosArray = Array.isArray(data) ? data : data.items || []
        const userIds = Array.from(new Set(pedidosArray.map(p => p.usuarioId ?? p.userId ?? p.usuario?.usuarioId).filter(Boolean)))

        const usuariosMap = {}
        if (userIds.length > 0) {
          await Promise.all(userIds.map(async (uid) => {
            try {
              const r = await fetch(`${API_BASE}/Usuarios/${uid}`, { headers })
              if (r.ok) usuariosMap[uid] = await r.json()
            } catch (e) { }
          }))
        }

        data = pedidosArray.map(p => ({ ...(p || {}), usuario: usuariosMap[p.usuarioId ?? p.userId ?? p.usuario?.usuarioId] ?? p.usuario }))
      } else {
        throw new Error(`Error ${res.status} al obtener pedidos`)
      }

      const mapped = (Array.isArray(data) ? data : data.items || []).map(p => ({
        id: p.pedidoId ?? p.id ?? p.orderId,
        usuarioObj: p.usuario ?? null,
        usuario: p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}` : (p.usuarioNombre || `#${p.usuarioId || '?'}`),
        fecha: p.fechaPedido ?? p.fecha ?? p.createdAt ?? null,
        productos: Array.isArray(p.detalles) ? p.detalles.length : (p.productosCount ?? p.productos ?? '-'),
        total: p.total ?? p.totalAmount ?? (p.subtotal ? Number(p.subtotal) + Number(p.costoEnvio || 0) + Number(p.impuestos || 0) : 0),
        estado: p.estado ?? 'pendiente',
        raw: p
      }))

      setPedidos(mapped)
    } catch (err) {
      setError(err.message || 'Error al cargar pedidos')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos()

    // Configurar SignalR para tiempo real
    const hubUrl = API_BASE.replace('/api', '') + '/notificaciones'
    console.log('[SignalR] Conectando a:', hubUrl)

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build()

    connection.start()
      .then(() => {
        console.log('[SignalR] Conectado exitosamente')

        // Escuchar cuando llega un nuevo pedido
        connection.on('PedidoRecibido', (data) => {
          console.log('[SignalR] ¡Nuevo pedido recibido!', data)
          // Refrescar lista sin mostrar el spinner de carga completo para que no sea molesto
          fetchPedidos(false)

          // Opcional: Sonido de notificación
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
            audio.play().catch(e => console.log('Bloqueo de audio por navegador'))
          } catch (e) { }
        })

        // Escuchar cuando se actualiza un pedido
        connection.on('PedidoActualizado', (data) => {
          console.log('[SignalR] Pedido actualizado:', data)
          fetchPedidos(false)
        })
      })
      .catch(err => console.error('[SignalR] Error al conectar:', err))

    return () => {
      if (connection) {
        connection.stop()
      }
    }
  }, [])

  function verDetalle(pedido) {
    setSelectedPedido(pedido)
    setShowDetalleModal(true)
  }

  function cerrarDetalleModal() {
    setShowDetalleModal(false)
    setSelectedPedido(null)
  }

  async function cambiarEstado(pedidoId, nuevoEstado) {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const res = await fetch(`${API_BASE}/Pedidos/${pedidoId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ estado: nuevoEstado })
    })
    if (!res.ok) {
      const errBody = await res.json().catch(() => null)
      throw new Error(errBody?.message || `Error ${res.status} al cambiar estado`)
    }
    // Actualizar pedido en la lista local
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    // Actualizar el pedido seleccionado en el modal
    if (selectedPedido && selectedPedido.id === pedidoId) {
      setSelectedPedido(prev => ({ ...prev, estado: nuevoEstado }))
    }
  }

  if (loading) return (
    <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
      <p>Cargando pedidos...</p>
    </div>
  )
  if (error) return (
    <div className="prod-error" style={{ margin: '24px' }}>
      <span>{error}</span>
      <button onClick={() => setError(null)}>×</button>
    </div>
  )

  // Dashboard calculations based on real orders
  const ordersExcludingCancelled = pedidos.filter(p => p.estado.toLowerCase() !== 'cancelado');
  const totalOrders = ordersExcludingCancelled.length;
  const returnsOrders = pedidos.filter(p => p.estado.toLowerCase() === 'cancelado').length;
  const fulfilledOrders = pedidos.filter(p => p.estado.toLowerCase() === 'enviado' || p.estado.toLowerCase() === 'entregado').length;

  // Data agrupada por fecha para el gráfico funcional
  const chartData = pedidos.reduce((acc, pedido) => {
    if (!pedido.fecha) return acc;
    const dateObj = new Date(pedido.fecha);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const key = `${day}/${month}`;

    const existing = acc.find(item => item.name === key);
    const total = Number(pedido.total || 0);
    if (existing) {
      existing.ventas += total;
    } else {
      acc.push({ name: key, ventas: total });
    }
    return acc;
  }, []).sort((a, b) => {
    const [d1, m1] = a.name.split('/');
    const [d2, m2] = b.name.split('/');
    return new Date(2025, Number(m1) - 1, Number(d1)) - new Date(2025, Number(m2) - 1, Number(d2));
  });

  // Calculate total reimbursed for mock stats
  const totalReimbursed = pedidos.filter(p => p.estado.toLowerCase() === 'cancelado').reduce((sum, p) => sum + Number(p.total || 0), 0);

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtroEstado === 'todos') return true;
    return p.estado.toLowerCase() === filtroEstado;
  });

  const counts = {
    todos: pedidos.length,
    pendiente: pedidos.filter(p => p.estado.toLowerCase() === 'pendiente').length,
    procesando: pedidos.filter(p => p.estado.toLowerCase() === 'procesando').length,
    enviado: pedidos.filter(p => p.estado.toLowerCase() === 'enviado').length,
    entregado: pedidos.filter(p => p.estado.toLowerCase() === 'entregado').length,
    cancelado: pedidos.filter(p => p.estado.toLowerCase() === 'cancelado').length,
  };

  return (
    <div className="pedidos-dashboard">
      <header className="pd-header">
        <h2 className="pd-title">
          <div className="pd-title-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
          </div>
          Pedidos
        </h2>
        <div className="pd-header-right">
          <div className="pd-date-filter">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Última actualización: {formatDatePeru(new Date())}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="pd-stats-grid">
        <div className="pd-stat-card" onClick={() => setFiltroEstado('todos')} style={{ cursor: 'pointer', border: filtroEstado === 'todos' ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
          <div className="pd-stat-header">
            <div className="pd-stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              Total Pedidos
            </div>
          </div>
          <div className="pd-stat-value-row">
            <div>
              <div className="pd-stat-value">{totalOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="pd-stat-card" onClick={() => setFiltroEstado('cancelado')} style={{ cursor: 'pointer', border: filtroEstado === 'cancelado' ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
          <div className="pd-stat-header">
            <div className="pd-stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              Pedidos Cancelados
            </div>
          </div>
          <div className="pd-stat-value-row">
            <div>
              <div className="pd-stat-value">{returnsOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="pd-stat-card" onClick={() => setFiltroEstado('entregado')} style={{ cursor: 'pointer', border: filtroEstado === 'entregado' ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
          <div className="pd-stat-header">
            <div className="pd-stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Pedidos Completados
            </div>
          </div>
          <div className="pd-stat-value-row" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="pd-stat-value">{fulfilledOrders.toLocaleString()}</div>
              <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{
                  width: `${totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width 0.5s ease-out'
                }}></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0}% del total activo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid Analysis */}
      <div style={{ marginBottom: '24px' }}>
        <div className="pd-card">
          <div className="pd-card-header">
            <h3 className="pd-card-title">Análisis de Pedidos</h3>
            <div className="pd-card-actions">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>■ Reembolsado S/ {totalReimbursed.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `S/ ${val}`} dx={-10} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                    formatter={(value) => [`S/ ${value}`, 'Ventas']}
                    labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="ventas" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No hay datos suficientes para graficar</div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros de Tabla */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'procesando', label: 'Procesando' },
          { id: 'enviado', label: 'Enviados' },
          { id: 'entregado', label: 'Entregados' },
          { id: 'cancelado', label: 'Cancelados' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFiltroEstado(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #e8e8ed',
              background: filtroEstado === tab.id ? 'var(--text-main)' : '#fff',
              color: filtroEstado === tab.id ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              background: filtroEstado === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
              padding: '2px 6px',
              borderRadius: '10px'
            }}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      <ListaPedidos
        pedidos={pedidosFiltrados}
        verDetalle={verDetalle}
        cambiarEstado={cambiarEstado}
      />

      {showDetalleModal && selectedPedido && (
        <div className="pd-modal-overlay" onClick={cerrarDetalleModal}>
          <div className="pd-modal" onClick={e => e.stopPropagation()}>
            <div className="pd-modal-header-bar">
              <h3>Detalle del Pedido #{selectedPedido.id}</h3>
              <button className="pd-modal-close" onClick={cerrarDetalleModal}>✕</button>
            </div>
            <div className="pd-modal-body">
              <DetallePedido
                pedido={selectedPedido}
                onClose={cerrarDetalleModal}
                onCambiarEstado={cambiarEstado}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
