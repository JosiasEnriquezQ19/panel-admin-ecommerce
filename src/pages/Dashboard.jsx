import React, { useEffect, useState } from 'react'
import ChartsOverview from '../components/dashboard/ChartsOverview'
import { API_BASE } from '../utils/api'
import '../components/dashboard/dashboard-modern.css'
// Import icon library if available, otherwise usage of i tags with classes (FontAwesome assumed or generic)

// Creamos un contexto global para los datos compartidos
export const useProductosGlobales = () => {
  return window.productosGlobales || { productos: [], clientes: [], pedidos: [] };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    productosActivos: 0,
    totalClientes: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    ventasMes: 0
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ultimosPedidos, setUltimosPedidos] = useState([])
  const [productosDestacados, setProductosDestacados] = useState([])

  // RAW DATA states for charts
  const [rawProductos, setRawProductos] = useState([])
  const [rawClientes, setRawClientes] = useState([])
  const [rawPedidos, setRawPedidos] = useState([])

  useEffect(() => {
    cargarDatosReales();
  }, [])

  async function cargarDatosReales() {
    setLoading(true)
    setError(null)

    try {
      let productosData = [];
      let clientesData = [];
      let pedidosData = [];

      try {
        const productosRes = await fetch(`${API_BASE}/Productos`);
        if (productosRes.ok) productosData = await productosRes.json();
      } catch (err) { console.log("Error productos", err); }

      try {
        const clientesRes = await fetch(`${API_BASE}/Usuarios`);
        if (clientesRes.ok) clientesData = await clientesRes.json();
      } catch (err) { console.log("Error clientes", err); }

      try {
        const pedidosRes = await fetch(`${API_BASE}/Pedidos`);
        if (pedidosRes.ok) pedidosData = await pedidosRes.json();
      } catch (err) { console.log("Error pedidos", err); }

      // Enriquecer pedidos
      try {
        const pedidosArrayTmp = Array.isArray(pedidosData) ? pedidosData : (pedidosData && pedidosData.items) ? pedidosData.items : [];
        if (pedidosArrayTmp.length > 0) {
          const userIds = Array.from(new Set(pedidosArrayTmp.map(p => p.usuarioId ?? p.userId ?? p.usuario?.usuarioId).filter(Boolean)));
          if (userIds.length > 0) {
            const usuariosResponses = await Promise.all(userIds.map(id =>
              fetch(`${API_BASE}/Usuarios/${encodeURIComponent(id)}`).then(r => r.ok ? r.json() : null).catch(() => null)
            ));
            const usuariosMap = {};
            userIds.forEach((id, i) => { if (usuariosResponses[i]) usuariosMap[id] = usuariosResponses[i]; });
            const formatUsuario = (u) => {
              if (!u) return null;
              if (u.nombre || u.apellido) return `${u.nombre || ''} ${u.apellido ? u.apellido : ''}`.trim();
              return u.email || (`Usuario #${u.usuarioId || u.id}`);
            };
            pedidosData = pedidosArrayTmp.map(p => {
              const uid = p.usuarioId ?? p.userId ?? p.usuario?.usuarioId;
              const usuarioObj = usuariosMap[uid] ?? p.usuario ?? null;
              return { ...(p || {}), cliente: p.cliente || formatUsuario(usuarioObj) || (uid ? `Usuario #${uid}` : undefined), usuario: usuarioObj };
            });
          }
        }
      } catch (err) { console.log('Error enriqueciendo pedidos:', err); }

      setRawProductos(productosData);
      setRawClientes(clientesData);
      setRawPedidos(pedidosData);

      calcularEstadisticas(productosData, clientesData, pedidosData);

      if (pedidosData.length > 0) {
        const getFecha = (p) => {
          const raw = p.fechaPedido || p.fecha || p.createdAt || p.fechaCreacion || p.date;
          return raw ? new Date(raw) : null;
        };

        const ahora = new Date();
        const cincoDiasAtras = new Date();
        cincoDiasAtras.setDate(ahora.getDate() - 5);

        const pedidosRecientes = pedidosData.filter(p => {
          const fecha = getFecha(p);
          return fecha && fecha >= cincoDiasAtras;
        });

        const pedidosOrdenados = [...pedidosRecientes]
          .sort((a, b) => getFecha(b) - getFecha(a))
          .slice(0, 5);

        setUltimosPedidos(pedidosOrdenados);
      } else {
        setUltimosPedidos([]);
      }

      // Calcular productos más vendidos dinámicamente excluyendo cancelados
      if (pedidosData.length > 0 && productosData.length > 0) {
        const ventasPorProducto = {};

        // Solo contar pedidos que NO están cancelados
        const pedidosValidos = pedidosData.filter(p => {
          const estado = String(p.estado || '').toLowerCase();
          return estado !== 'cancelado' && estado !== 'eliminado';
        });

        pedidosValidos.forEach(pedido => {
          const detalles = pedido.detalles || pedido.raw?.detalles || [];
          detalles.forEach(detalle => {
            const prodId = detalle.productoId || detalle.id;
            if (prodId) {
              ventasPorProducto[prodId] = (ventasPorProducto[prodId] || 0) + (detalle.cantidad || 1);
            }
          });
        });

        // Mapear y ordenar
        const productosConVentasReales = productosData.map(prod => ({
          ...prod,
          ventasReales: ventasPorProducto[prod.id || prod.productoId] || 0
        })).sort((a, b) => b.ventasReales - a.ventasReales);

        setProductosDestacados(productosConVentasReales.slice(0, 3));
      } else if (productosData.length > 0) {
        // Fallback si no hay pedidos cargados aún
        const productosOrdenados = [...productosData].sort((a, b) => (b.ventas || 0) - (a.ventas || 0)).slice(0, 3);
        setProductosDestacados(productosOrdenados);
      } else {
        setProductosDestacados([]);
      }

      setError(null);
    } catch (err) {
      console.error('Error al cargar datos reales:', err);
      setError('Error al cargar datos.');
      cargarDatosEjemplo();
    } finally {
      setLoading(false);
    }
  }

  function calcularEstadisticas(productos, clientes, pedidos) {
    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => p.estado !== 'inactivo' && p.estado !== false).length;
    const totalClientes = clientes.length;
    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];
    const totalPedidos = pedidosArray.filter(p => String(p.estado || '').toLowerCase() !== 'cancelado').length;
    const pedidosPendientes = pedidosArray.filter(p => String(p.estado || '').toLowerCase() === 'pendiente').length;

    const getOrderState = (p) => String(p.estado || p.state || p.status || '').toLowerCase();
    const getOrderTotal = (p) => Number(p.total ?? p.monto ?? p.totalAmount ?? 0) || 0;

    const pedidosFiltradosParaVentas = pedidosArray.filter(p => {
      const estado = getOrderState(p);
      return ['enviado', 'entregado', 'shipped', 'delivered'].includes(estado);
    });

    const ventasMes = pedidosFiltradosParaVentas.reduce((total, pedido) => total + getOrderTotal(pedido), 0);

    setStats({
      totalProductos: totalProductos || 0,
      productosActivos: productosActivos || 0,
      totalClientes: totalClientes || 0,
      totalPedidos: totalPedidos || 0,
      pedidosPendientes: pedidosPendientes || 0,
      ventasMes: ventasMes
    });
  }

  // Demo data removed

  function cargarDatosEjemplo() {
    setStats({ totalProductos: 0, productosActivos: 0, totalClientes: 0, totalPedidos: 0, pedidosPendientes: 0, ventasMes: 0 });
    setUltimosPedidos([]);
    setProductosDestacados([]);
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const fecha = new Date(dateString)
      if (isNaN(fecha.getTime())) return 'N/A'
      return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch (e) { return 'N/A' }
  }

  const navigateTo = (page) => {
    if (typeof window.onNavigate === 'function') window.onNavigate(page)
    else window.dispatchEvent(new CustomEvent('navigate', { detail: { page } }))
  }


  if (loading) return <div className="dashboard loading-container"><div className="spinner"></div></div>

  const getEstadoColor = (estado) => {
    switch (String(estado || '').toLowerCase()) {
      case 'entregado': return '#00d68f'; // Success
      case 'pendiente': return '#ffce73'; // Warning
      case 'procesando': return '#6c5dd3'; // Accent
      case 'enviado': return '#0090ff'; // Blue
      case 'cancelado': return '#ff6b6b'; // Danger
      default: return '#808191'; // Muted
    }
  }

  return (
    <div className="dashboard-minimal">
      <div className="dashboard-header">
        <div>
          <h2>Panel Principal</h2>
          <div className="date-display">Bienvenido de nuevo, Josias</div>
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '24px' }}>
          <p>{error}</p>
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Grid Principal */}
      <div className="minimal-grid">

        {/* Fila 1: Métricas Clave */}
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'rgba(108, 93, 211, 0.1)', color: '#6c5dd3' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4" /></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Ventas Totales</span>
              <h3 className="metric-value">S/ {stats.ventasMes.toLocaleString('es-PE')}</h3>
              {stats.ventasMes > 0 ? (
                <span className="metric-trend positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6" /></svg>
                  +100% este mes
                </span>
              ) : (
                <span className="metric-trend" style={{ color: 'var(--text-muted)' }}>Sin ventas aún</span>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'rgba(0, 214, 143, 0.1)', color: '#00d68f' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Pedidos</span>
              <h3 className="metric-value">{stats.totalPedidos}</h3>
              {stats.totalPedidos > 0 ? (
                <span className="metric-trend positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6" /></svg>
                  Activos
                </span>
              ) : (
                <span className="metric-trend" style={{ color: 'var(--text-muted)' }}>Sin pedidos</span>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon" style={{ background: 'rgba(255, 206, 115, 0.1)', color: '#ffce73' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="metric-info">
              <span className="metric-label">Productos Activos</span>
              <h3 className="metric-value">{stats.productosActivos}</h3>
              <span className="metric-trend">En inventario</span>
            </div>
          </div>
        </div>

        {/* Fila 2: Gráficos y Estadísticas */}
        <ChartsOverview
          productos={rawProductos}
          pedidos={rawPedidos}
          clientes={rawClientes}
        />

        {/* Fila 3: Pedidos Recientes (Tabla Simple) */}
        <div className="recent-orders-minimal">
          <div className="section-header">
            <h3>Pedidos Recientes</h3>
            <button className="btn-text" onClick={() => navigateTo('pedidos')}>Ver todos</button>
          </div>

          <div className="minimal-table-container">
            {ultimosPedidos.length === 0 ? (
              <div className="empty-state-small" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay pedidos recientes</div>
            ) : (
              <table className="minimal-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido, index) => (
                    <tr key={pedido.id || index}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-small">{pedido.cliente?.charAt(0) || 'U'}</div>
                          <span>{pedido.cliente}</span>
                        </div>
                      </td>
                      <td>
                        <span className="status-dot" style={{ background: getEstadoColor(pedido.estado) }}></span>
                        {pedido.estado}
                      </td>
                      <td style={{ fontWeight: 600 }}>S/ {Number(pedido.total || 0).toLocaleString('es-PE')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon-small">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
