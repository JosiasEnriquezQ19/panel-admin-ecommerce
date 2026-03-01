import React, { useEffect, useState } from 'react'
import DetallePedido from '../../components/pedidos/DetallePedido'
import ListaPedidos from '../../components/pedidos/ListaPedidos'
import '../../components/pedidos/pedidos-styles.css'
import '../../components/pedidos/pedidos-minimalista.css'
import { formatDatePeru, getDateFromPeriod } from '../../utils/dateUtils'

import { API_BASE } from '../../utils/api'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [pedidosFiltrados, setPedidosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [periodoFilter, setPeriodoFilter] = useState('')
  const [selectedPedido, setSelectedPedido] = useState(null)

  useEffect(() => {
    const fetchPedidos = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        // Primero intentamos el endpoint combinado /pedidos/with-user (backend puede no existir)
        const tryWithUserUrl = userIdFilter ? `${API_BASE}/Pedidos/with-user?usuarioId=${encodeURIComponent(userIdFilter)}` : `${API_BASE}/Pedidos/with-user`
        let res = await fetch(tryWithUserUrl, { headers })
        let data = null

        if (res.ok) {
          data = await res.json()
        } else if (res.status === 404) {
          // Fallback: el backend no expone /with-user -> obtener pedidos y luego usuarios por separado
          const fallbackUrl = userIdFilter ? `${API_BASE}/Pedidos/usuario/${encodeURIComponent(userIdFilter)}` : `${API_BASE}/Pedidos`
          const res2 = await fetch(fallbackUrl, { headers })
          if (!res2.ok) {
            const errBody = await res2.json().catch(() => null)
            throw new Error(errBody?.message || `Error ${res2.status} al obtener pedidos`)
          }
          data = await res2.json()

          // data es array de pedidos; extraer userIds únicos
          const pedidosArray = Array.isArray(data) ? data : data.items || []
          const userIds = Array.from(new Set(pedidosArray.map(p => p.usuarioId ?? p.userId ?? p.usuario?.usuarioId).filter(Boolean)))

          // Buscar usuarios en paralelo (GET /Usuarios/{id})
          const usuariosMap = {}
          if (userIds.length > 0) {
            await Promise.all(userIds.map(async (uid) => {
              try {
                const r = await fetch(`${API_BASE}/Usuarios/${uid}`, { headers })
                if (r.ok) {
                  const u = await r.json()
                  usuariosMap[uid] = u
                }
              } catch (e) {
                // ignore per-user fetch errors
              }
            }))
          }

          // Adjuntar usuarioObj a cada pedido
          data = pedidosArray.map(p => ({ ...(p || {}), usuario: usuariosMap[p.usuarioId ?? p.userId ?? p.usuario?.usuarioId] ?? p.usuario }))
        } else {
          const errBody = await res.json().catch(() => null)
          throw new Error(errBody?.message || `Error ${res.status} al obtener pedidos`)
        }

        // Mapear respuesta del backend a la forma que espera la UI
        const mapped = (Array.isArray(data) ? data : data.items || []).map(p => ({
          id: p.pedidoId ?? p.id ?? p.orderId,
          usuarioObj: p.usuario ?? null,
          usuario: p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido} (${p.usuario.email})` : (p.usuarioNombre || p.userEmail || (p.usuarioId ? `#${p.usuarioId}` : '-')),
          fecha: p.fechaPedido ?? p.fecha ?? p.createdAt ?? null,
          productos: Array.isArray(p.detalles) ? p.detalles.length : (p.productosCount ?? p.productos ?? '-'),
          total: p.total ?? p.totalAmount ?? (p.subtotal ? Number(p.subtotal) + Number(p.costoEnvio || 0) + Number(p.impuestos || 0) : 0),
          estado: p.estado ?? 'pendiente',
          raw: p
        }))

        setPedidos(mapped)
        // También actualizamos los pedidos filtrados aplicando el filtro de periodo si existe
        aplicarFiltros(mapped, periodoFilter)
      } catch (err) {
        setError(err.message || 'Error al cargar pedidos')
      } finally {
        setLoading(false)
      }
    }

    fetchPedidos()
  }, [periodoFilter])

  // Refrescar con filtro actual
  async function refreshPedidos() {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      // Try with-user first, fallback to plain pedidos + users
      const tryWithUserUrl = userIdFilter ? `${API_BASE}/Pedidos/with-user?usuarioId=${encodeURIComponent(userIdFilter)}` : `${API_BASE}/Pedidos/with-user`
      let res = await fetch(tryWithUserUrl, { headers })
      let data = null

      if (res.ok) {
        data = await res.json()
      } else if (res.status === 404) {
        const fallbackUrl = userIdFilter ? `${API_BASE}/Pedidos/usuario/${encodeURIComponent(userIdFilter)}` : `${API_BASE}/Pedidos`
        const res2 = await fetch(fallbackUrl, { headers })
        if (!res2.ok) {
          const errBody = await res2.json().catch(() => null)
          throw new Error(errBody?.message || `Error ${res2.status} al obtener pedidos`)
        }
        const pedidosArray = await res2.json()
        const pedidosList = Array.isArray(pedidosArray) ? pedidosArray : pedidosArray.items || []
        const userIds = Array.from(new Set(pedidosList.map(p => p.usuarioId ?? p.userId ?? p.usuario?.usuarioId).filter(Boolean)))
        const usuariosMap = {}
        if (userIds.length > 0) {
          await Promise.all(userIds.map(async (uid) => {
            try {
              const r = await fetch(`${API_BASE}/Usuarios/${uid}`, { headers })
              if (r.ok) usuariosMap[uid] = await r.json()
            } catch (e) { }
          }))
        }
        data = pedidosList.map(p => ({ ...(p || {}), usuario: usuariosMap[p.usuarioId ?? p.userId ?? p.usuario?.usuarioId] ?? p.usuario }))
      } else {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.message || `Error ${res.status} al obtener pedidos`)
      }

      const mapped = (Array.isArray(data) ? data : data.items || []).map(p => ({
        id: p.pedidoId ?? p.id ?? p.orderId,
        usuarioObj: p.usuario ?? null,
        usuario: p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido} (${p.usuario.email})` : (p.usuarioNombre || p.userEmail || (p.usuarioId ? `#${p.usuarioId}` : '-')),
        fecha: p.fechaPedido ?? p.fecha ?? p.createdAt ?? null,
        productos: Array.isArray(p.detalles) ? p.detalles.length : (p.productosCount ?? p.productos ?? '-'),
        total: p.total ?? p.totalAmount ?? (p.subtotal ? Number(p.subtotal) + Number(p.costoEnvio || 0) + Number(p.impuestos || 0) : 0),
        estado: p.estado ?? 'pendiente',
        raw: p
      }))

      setPedidos(mapped)
    } catch (err) {
      setError(err.message || 'Error al cargar pedidos')
    } finally { setLoading(false) }
  }

  // Cambiar estado del pedido
  async function cambiarEstado(pedidoId, nuevoEstado) {
    return new Promise(async (resolve, reject) => {
      if (!confirm(`Cambiar estado a "${nuevoEstado}"?`)) return reject(new Error('Cancelado por usuario'))
      try {
        const token = localStorage.getItem('token')
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/Pedidos/${pedidoId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ estado: nuevoEstado })
        })
        if (!res.ok) {
          const b = await res.json().catch(() => null)
          const err = new Error(b?.message || 'Error al cambiar estado')
          setError(err.message)
          return reject(err)
        }
        // refrescar la lista de pedidos
        await refreshPedidos()
        // refrescar productos si la función está disponible globalmente
        if (window.fetchProductos) {
          try { await window.fetchProductos() } catch { }
        }
        // si está abierto el detalle, actualizarlo con los datos nuevos
        if (selectedPedido && selectedPedido.id === pedidoId) {
          // intentar obtener el pedido actualizado de la lista
          const updated = pedidos.find(p => p.id === pedidoId)
          if (updated) {
            setSelectedPedido({ ...updated, estado: nuevoEstado })
          } else {
            // si no está en la lista, intentar refetch del pedido individual
            try {
              const r2 = await fetch(`${API_BASE}/Pedidos/${pedidoId}`)
              if (r2.ok) {
                const pData = await r2.json()
                setSelectedPedido({ id: pData.pedidoId ?? pData.id, usuarioObj: pData.usuario ?? null, usuario: pData.usuario?.nombre ? `${pData.usuario.nombre} ${pData.usuario.apellido}` : (pData.usuarioNombre || ''), fecha: pData.fechaPedido ?? pData.fecha, productos: Array.isArray(pData.detalles) ? pData.detalles.length : 0, total: pData.total ?? pData.totalAmount, estado: pData.estado ?? nuevoEstado, raw: pData })
              }
            } catch (e) { }
          }
        }
        resolve(true)
      } catch (err) { setError(err.message); reject(err) }
    })
  }

  // Función para aplicar filtros de periodo a la lista de pedidos
  function aplicarFiltros(listaPedidos, periodo) {
    if (!periodo) {
      // Si no hay filtro de periodo, mostrar todos los pedidos
      setPedidosFiltrados(listaPedidos);
      return;
    }

    const fechaLimite = getDateFromPeriod(periodo);

    // Filtrar pedidos por fecha
    const filtrados = listaPedidos.filter(pedido => {
      if (!pedido.fecha) return false;

      const fechaPedido = new Date(pedido.fecha);
      return fechaPedido >= fechaLimite;
    });

    setPedidosFiltrados(filtrados);
  }

  // Función para cambiar el filtro de periodo
  function cambiarPeriodo(nuevoPeriodo) {
    setPeriodoFilter(nuevoPeriodo);
    // Los pedidos se filtrarán en el efecto cuando cambie periodoFilter
  }

  function verDetalle(pedido) {
    setSelectedPedido(pedido)
  }

  if (loading) return <div>Cargando pedidos...</div>
  if (error) return <div className="error">{error}</div>

  // Si hay un pedido seleccionado, mostrar solo el detalle
  if (selectedPedido) {
    return (
      <div>
        <DetallePedido
          pedido={selectedPedido}
          onClose={() => setSelectedPedido(null)}
          onCambiarEstado={cambiarEstado}
        />
      </div>
    );
  }

  // Si no hay pedido seleccionado, mostrar la lista
  // Si no hay pedido seleccionado, mostrar la lista
  return (
    <div className="pedidos-page" style={{ padding: '30px', minHeight: '100vh', width: '100%', backgroundColor: '#0e0e12' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', margin: 0 }}>Gestión de Pedidos</h2>
            <p style={{ color: 'var(--text-muted)', margin: '5px 0 0 0' }}>Administra y actualiza el estado de los pedidos</p>
          </div>
          {periodoFilter && (
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500' }}>
              {(periodoFilter ? pedidosFiltrados : pedidos).length} resultados
            </span>
          )}
        </header>

        <div className="filter-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '30px' }}>
          {/* Filter by User */}
          <div className="filter-card" style={{ background: '#1e1e2d', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span> Filtrar por Usuario
            </h3>
            <div className="filter-content">
              <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={userIdFilter}
                  onChange={e => setUserIdFilter(e.target.value)}
                  placeholder="ID de usuario (ej. 1)"
                  className="filter-input"
                  style={{ flex: 1, background: '#151521', border: '1px solid var(--border-light)', color: 'white', padding: '10px 15px', borderRadius: '10px', fontSize: '0.95rem' }}
                />
                <button
                  className="btn-primary"
                  onClick={refreshPedidos}
                  style={{ padding: '0 16px' }}
                >
                  🔍
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => { setUserIdFilter(''); refreshPedidos() }}
                  disabled={!userIdFilter}
                  style={{ padding: '0 16px' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          {/* Filter by Period */}
          <div className="filter-card" style={{ background: '#1e1e2d', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📅</span> Filtrar por Período
              </h3>
              {periodoFilter && (
                <div style={{ fontSize: '0.85rem', color: '#00d68f' }}>
                  Desde: {formatDatePeru(getDateFromPeriod(periodoFilter))}
                </div>
              )}
            </div>

            <div className="filter-content">
              <div className="input-group" style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={periodoFilter}
                  onChange={(e) => cambiarPeriodo(e.target.value)}
                  className="filter-select"
                  style={{ flex: 1, background: '#151521', border: '1px solid var(--border-light)', color: 'white', padding: '10px 15px', borderRadius: '10px', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  <option value="">Todos los períodos</option>
                  <option value="hoy">Pedidos de hoy</option>
                  <option value="ayer">Pedidos de ayer</option>
                  <option value="semana">Última semana</option>
                  <option value="mes">Último mes</option>
                  <option value="trimestre">Último trimestre</option>
                  <option value="año">Último año</option>
                </select>
                <button
                  className="btn-secondary"
                  onClick={() => cambiarPeriodo('')}
                  disabled={!periodoFilter}
                  style={{ padding: '0 16px' }}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pedidos-container" style={{ background: '#1e1e2d', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-light)' }}>
          <ListaPedidos
            pedidos={periodoFilter ? pedidosFiltrados : pedidos}
            verDetalle={verDetalle}
            cambiarEstado={cambiarEstado}
          />
        </div>
      </div>
    </div>
  )
}

// Helper: calcula subtotal sumando cantidad * precioUnitario de los detalles
function calculateSubtotalFromDetalles(detalles) {
  if (!Array.isArray(detalles)) return 0
  return detalles.reduce((sum, d) => {
    const cantidad = d.cantidad ?? 1
    const precio = Number(d.precioUnitario ?? d.precio ?? (d.producto?.precio ?? 0))
    return sum + (cantidad * precio)
  }, 0)
}
