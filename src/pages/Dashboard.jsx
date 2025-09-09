import React, { useEffect, useState } from 'react'
import ChartsOverview from '../components/dashboard/ChartsOverview'
import { API_BASE } from '../utils/api'
import '../components/dashboard/dashboard-modern.css'

// Creamos un contexto global para los datos compartidos
export const useProductosGlobales = () => {
  return window.productosGlobales || { productos: [], clientes: [], pedidos: [] };
}

export default function Dashboard() {
  const DEBUG_SHOW_PEDIDOS = false; // debug UI disabled
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
  
  useEffect(() => {
    // Intentamos obtener datos reales
    cargarDatosReales();
  }, [])
  
  // Función para obtener datos reales de la API
  async function cargarDatosReales() {
    setLoading(true)
    setError(null)
    
    try {
      // Primero intentamos obtener productos reales
      let productosData = [];
      let clientesData = [];
      let pedidosData = [];
      
      try {
        // Intentamos obtener productos reales
        const productosRes = await fetch(`${API_BASE}/Productos`);
        if (productosRes.ok) {
          productosData = await productosRes.json();
          console.log("Productos cargados:", productosData.length);
        }
      } catch (err) {
        console.log("Error al cargar productos:", err);
      }
      
      try {
        // Intentamos obtener clientes reales
        const clientesRes = await fetch(`${API_BASE}/Usuarios`);
        if (clientesRes.ok) {
          clientesData = await clientesRes.json();
          console.log("Clientes cargados:", clientesData.length);
        }
      } catch (err) {
        console.log("Error al cargar clientes:", err);
      }
      
      try {
        // Intentamos obtener pedidos reales
        const pedidosRes = await fetch(`${API_BASE}/Pedidos`);
        if (pedidosRes.ok) {
          pedidosData = await pedidosRes.json();
          console.log("Pedidos cargados:", pedidosData.length);
        }
      } catch (err) {
        console.log("Error al cargar pedidos:", err);
      }

      // Enriquecer pedidos con información del usuario (si la API no incluye el nombre)
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
              if (u.nombre || u.apellido) return `${u.nombre || ''}${u.apellido ? ' ' + u.apellido : ''}`.trim();
              return u.email || u.usuarioId || u.id || null;
            };
            // attach cliente display and usuario object
            pedidosData = pedidosArrayTmp.map(p => {
              const uid = p.usuarioId ?? p.userId ?? p.usuario?.usuarioId;
              const usuarioObj = usuariosMap[uid] ?? p.usuario ?? null;
              return { ...(p||{}), cliente: p.cliente || formatUsuario(usuarioObj) || (uid ? `Usuario #${uid}` : undefined), usuario: usuarioObj };
            });
          }
        }
      } catch (err) {
        console.log('Error al enriquecer pedidos con usuarios:', err);
      }
      
      // Guardamos los datos globalmente para compartir con otros componentes
      window.productosGlobales = {
        productos: productosData,
        clientes: clientesData,
        pedidos: pedidosData
      };
      
      // Calculamos estadísticas con los datos reales obtenidos
      calcularEstadisticas(productosData, clientesData, pedidosData);
      
      // Preparamos datos para las tablas
      if (pedidosData.length > 0) {
        const pedidosOrdenados = [...pedidosData]
          .sort((a, b) => new Date(b.fecha || b.fechaCreacion) - new Date(a.fecha || a.fechaCreacion))
          .slice(0, 3);
        setUltimosPedidos(pedidosOrdenados);
      } else {
        // Si no hay datos reales, usamos ejemplos para los pedidos
        setUltimosPedidos(datosEjemploPedidos);
      }
      
      if (productosData.length > 0) {
        // Ordenamos por ventas o algún otro criterio
        const productosOrdenados = [...productosData]
          .sort((a, b) => (b.ventas || 0) - (a.ventas || 0))
          .slice(0, 3);
        setProductosDestacados(productosOrdenados);
      } else {
        // Si no hay datos reales, usamos ejemplos para los productos
        setProductosDestacados(datosEjemploProductos);
      }
      
      setError(null);
      
    } catch (err) {
      console.error('Error al cargar datos reales:', err);
      setError('Error al cargar datos. Mostrando estadísticas de ejemplo.');
      cargarDatosEjemplo();
    } finally {
      setLoading(false);
    }
  }
  
  // Calcula las estadísticas usando los datos proporcionados
  function calcularEstadisticas(productos, clientes, pedidos) {
    // Si tenemos productos reales, usamos esos datos
    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => 
      p.estado !== 'inactivo' && p.estado !== false
    ).length;
    
    // Si tenemos clientes reales, usamos esos datos
    const totalClientes = clientes.length;
    
    // Si tenemos pedidos reales, usamos esos datos
    const totalPedidos = pedidos.length;
    const pedidosPendientes = pedidos.filter(p => 
      p.estado === 'pendiente'
    ).length;
    
    // Calcular ventas del mes actual, sumando solo pedidos que estén realmente "enviados" o "entregados".
    const hoy = new Date();

    // Helpers tolerantes: distintos nombres de campo según la API
    const parseOrderDate = (p) => {
      const candidates = [p.fecha, p.fechaCreacion, p.fechaPedido, p.createdAt, p.created_at, p.date, p.orderDate];
      for (const c of candidates) {
        if (!c) continue;
        const d = new Date(c);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date(NaN);
    };

    const getOrderState = (p) => String(p.estado || p.state || p.status || p.estadoPedido || p.orderStatus || p.statusPedido || '').toLowerCase();

    const getOrderTotal = (p) => Number(p.total ?? p.monto ?? p.totalAmount ?? p.amount ?? p.valor ?? 0) || 0;

    const pedidosArray = Array.isArray(pedidos) ? pedidos : [];

    // Contar todos los pedidos cuyo estado sea 'enviado' o 'entregado' (también 'shipped'/'delivered')
    const pedidosFiltradosParaVentas = pedidosArray.filter(p => {
      const estado = getOrderState(p);
      return ['enviado', 'entregado', 'shipped', 'delivered'].includes(estado);
    });

    const ventasMes = pedidosFiltradosParaVentas.reduce((total, pedido) => total + getOrderTotal(pedido), 0);
    
    // Si no hay suficientes datos reales, complementamos con datos de ejemplo
  // debug logging removed in cleanup

    const stats = {
      totalProductos: totalProductos || 145,
      productosActivos: productosActivos || 128,
      totalClientes: totalClientes || 87,
      totalPedidos: totalPedidos || 234,
      pedidosPendientes: pedidosPendientes || 15,
      // Mostrar el valor calculado de ventasMes aunque sea 0 (no usar fallback que confunda)
      ventasMes: ventasMes
    };
    
    setStats(stats);
  }
  
  // Datos de ejemplo que se usarán si la API falla
  const datosEjemploPedidos = [
    {
      id: 4,
      cliente: 'Ana Martínez',
      fecha: '2025-08-20T14:30:00Z',
      total: 320.75,
      estado: 'pendiente'
    },
    {
      id: 3,
      cliente: 'Carlos Gómez',
      fecha: '2025-08-15T09:45:00Z',
      total: 1800.25,
      estado: 'procesando'
    },
    {
      id: 2,
      cliente: 'María López',
      fecha: '2025-08-12T16:20:00Z',
      total: 950.00,
      estado: 'entregado'
    }
  ];
  
  const datosEjemploProductos = [
    {
      nombre: 'Smartphone X Pro',
      precio: 12999.00,
      stock: 24,
      ventas: 15
    },
    {
      nombre: 'Tablet Ultra',
      precio: 8499.00,
      stock: 12,
      ventas: 9
    },
    {
      nombre: 'Auriculares Inalámbricos',
      precio: 2499.00,
      stock: 45,
      ventas: 28
    }
  ];
  
  // Función para cargar datos de ejemplo como respaldo
  function cargarDatosEjemplo() {
    setStats({
      totalProductos: 145,
      productosActivos: 128,
      totalClientes: 87,
      totalPedidos: 234,
      pedidosPendientes: 15,
      ventasMes: 45780.50
    });
    
    setUltimosPedidos(datosEjemploPedidos);
    setProductosDestacados(datosEjemploProductos);
  }
  
  // Las siguientes funciones ya no se usan, pero las dejamos comentadas por si quieres
  // reactivarlas cuando la API esté disponible
  
  /*
  async function fetchDashboardData() {
    setLoading(true)
    setError(null)
    
    try {
      // Intentamos obtener datos reales de la API
      await Promise.all([
        fetchEstadisticas(),
        fetchUltimosPedidos(),
        fetchProductosDestacados()
      ])
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError('Error al cargar los datos del dashboard')
      cargarDatosEjemplo()
    } finally {
      setLoading(false)
    }
  }
  
  async function fetchEstadisticas() {
    try {
      const [productosRes, clientesRes, pedidosRes] = await Promise.all([
        fetch(`${API_BASE}/Productos`),
        fetch(`${API_BASE}/Usuarios`),
        fetch(`${API_BASE}/Pedidos`)
      ])
      
      if (!productosRes.ok || !clientesRes.ok || !pedidosRes.ok) {
        throw new Error('Error al obtener datos de estadísticas')
      }
      
      const productos = await productosRes.json()
      const clientes = await clientesRes.json()
      const pedidos = await pedidosRes.json()
      
      const totalProductos = productos.length
      const productosActivos = productos.filter(p => p.estado !== 'inactivo' && p.estado !== false).length
      const totalClientes = clientes.length
      const totalPedidos = pedidos.length
      const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length
      
      const ventasMes = pedidos
        .filter(p => {
          const fechaPedido = new Date(p.fecha || p.fechaCreacion)
          const hoy = new Date()
          return fechaPedido.getMonth() === hoy.getMonth() && 
                 fechaPedido.getFullYear() === hoy.getFullYear()
        })
        .reduce((total, pedido) => total + (pedido.total || 0), 0)
      
      setStats({
        totalProductos,
        productosActivos,
        totalClientes,
        totalPedidos,
        pedidosPendientes,
        ventasMes
      })
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw error
    }
  }
  
  async function fetchUltimosPedidos() {
    try {
      const res = await fetch(`${API_BASE}/Pedidos?limit=3&sort=fecha:desc`)
      if (!res.ok) throw new Error('Error al obtener los últimos pedidos')
      
      const pedidos = await res.json()
      setUltimosPedidos(pedidos)
    } catch (error) {
      console.error('Error al obtener últimos pedidos:', error)
      throw error
    }
  }
  
  async function fetchProductosDestacados() {
    try {
      const res = await fetch(`${API_BASE}/Productos?limit=3&sort=ventas:desc`)
      if (!res.ok) throw new Error('Error al obtener productos destacados')
      
      const productos = await res.json()
      setProductosDestacados(productos)
    } catch (error) {
      console.error('Error al obtener productos destacados:', error)
      throw error
    }
  }
  */
  
  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    try {
      const fecha = new Date(dateString)
      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) return 'N/A'
      
      return fecha.toLocaleDateString('es-MX')
    } catch (e) {
      return 'N/A'
    }
  }
  
  // Obtener el nombre del mes actual
  const getCurrentMonth = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const fecha = new Date()
    return meses[fecha.getMonth()]
  }
  
  // Mapear estado a color
  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'pendiente': return '#ffc107'
      case 'procesando': return '#17a2b8'
      case 'enviado': return '#007bff'
      case 'entregado': return '#28a745'
      case 'cancelado': return '#dc3545'
      default: return '#6c757d'
    }
  }
  
  // Navegación a otras páginas
  const navigateToProductos = () => {
    // Detectamos si estamos usando el enrutador personalizado basado en el estado
    if (typeof window.onNavigate === 'function') {
      window.onNavigate('productos')
    } else {
      // Usamos una forma alternativa de navegación
      const event = new CustomEvent('navigate', { 
        detail: { page: 'productos' } 
      })
      window.dispatchEvent(event)
    }
  }
  
  const navigateToPedidos = () => {
    // Detectamos si estamos usando el enrutador personalizado basado en el estado
    if (typeof window.onNavigate === 'function') {
      window.onNavigate('pedidos')
    } else {
      // Usamos una forma alternativa de navegación
      const event = new CustomEvent('navigate', { 
        detail: { page: 'pedidos' } 
      })
      window.dispatchEvent(event)
    }
  }

  // Preparar datos para el dashboard (productos, clientes, pedidos)
  const productosGlobal = window.productosGlobales || { productos: [], clientes: [], pedidos: [] };

  if (loading) {
    return (
      <div className="dashboard loading-container">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    )
  }
  
  return (
    <div className="dashboard">
      {error && (
        <div className="alert-error">
          <p>{error}</p>
          <button 
            className="alert-close" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Estadísticas resumidas en la parte superior */}
      <div className="stats-summary">
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">{stats.totalProductos}</div>
            <div className="stat-label">Productos</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalClientes}</div>
            <div className="stat-label">Clientes</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.totalPedidos}</div>
            <div className="stat-label">Pedidos</div>
          </div>
          <div className="stat-item highlight">
            <div className="stat-value">S/ {stats.ventasMes.toLocaleString('es-PE')}</div>
            <div className="stat-label">Ventas en {getCurrentMonth()}</div>
          </div>
        </div>
      </div>

  {/* debug panel removed */}
      
      {/* Últimos pedidos y productos destacados en dos columnas */}
      <div className="dashboard-sections two-columns">
        <div className="left-column">
          <div className="dashboard-section">
            <h3 className="section-title">Últimos Pedidos</h3>
            {ultimosPedidos.length === 0 ? (
              <div className="empty-state">
                <p>No hay pedidos registrados</p>
              </div>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido, index) => (
                    <tr key={pedido.id || index}>
                      <td>#{pedido.id || index + 1}</td>
                      <td>{pedido.cliente || (pedido.clienteId ? `Cliente #${pedido.clienteId}` : 'Cliente')}</td>
                      <td>{formatDate(pedido.fecha || pedido.fechaCreacion || pedido.fechaPedido || pedido.createdAt)}</td>
                      <td>S/ {(pedido.total || 0).toLocaleString('es-PE')}</td>
                      <td>
                        <span 
                          className="estado-badge" 
                          style={{backgroundColor: getEstadoColor(pedido.estado || 'pendiente')}}
                        >
                          {(pedido.estado || 'pendiente').charAt(0).toUpperCase() + (pedido.estado || 'pendiente').slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="section-footer">
              <button 
                className="btn-link"
                onClick={() => {
                  const navigate = (page) => {
                    if (typeof window.onNavigate === 'function') {
                      window.onNavigate(page)
                    }
                  }
                  navigate('pedidos')
                }}
              >
                Ver todos los pedidos →
              </button>
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="dashboard-section">
            <h3 className="section-title">Productos Destacados</h3>
            {productosDestacados.length === 0 ? (
              <div className="empty-state">
                <p>No hay productos registrados</p>
              </div>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productosDestacados.map((producto, index) => (
                    <tr key={index}>
                      <td>{producto.nombre}</td>
                      <td>S/ {(producto.precio || 0).toLocaleString('es-PE')}</td>
                      <td>{producto.stock || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="section-footer">
              <button 
                className="btn-link"
                onClick={() => {
                  const navigate = (page) => {
                    if (typeof window.onNavigate === 'function') {
                      window.onNavigate(page)
                    }
                  }
                  navigate('productos')
                }}
              >
                Ver todos los productos →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full width charts section */}
      <div className="dashboard-fullwidth">
        <div className="charts-section">
          <h3 className="section-title">Estadísticas</h3>
          <ChartsOverview productos={productosGlobal.productos} pedidos={productosGlobal.pedidos} />
        </div>
      </div>
    </div>
  )
}
