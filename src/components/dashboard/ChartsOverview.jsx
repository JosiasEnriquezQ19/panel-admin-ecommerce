import React, { useMemo, useRef, useState, useEffect } from 'react'
import './charts.css'

// Helpers robustos para normalizar datos de la API
const normalizeData = (x) => {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    return x.items || x.data || x.productos || x.pedidos || [];
  }
  return [];
};

const topNFromMap = (map, n = 5) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n)

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ChartsOverview({ productos = [], pedidos = [], clientes = [] }) {
  const normalizedProductos = useMemo(() => normalizeData(productos), [productos]);
  const normalizedPedidos = useMemo(() => normalizeData(pedidos), [pedidos]);

  const [chartLoaded, setChartLoaded] = useState(false)
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '', value: 0 })

  // Estados para filtros
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Efecto para auto-seleccionar el mes con datos si el actual está vacío
  useEffect(() => {
    if (normalizedPedidos.length > 0) {
      const activeStates = ['pendiente', 'procesando', 'enviado', 'entregado', 'shipped', 'delivered', 'pending', 'processing'];
      const validPedidos = normalizedPedidos.filter(o => activeStates.includes(String(o.estado || '').toLowerCase()));

      if (validPedidos.length > 0) {
        const hasDataCurrent = validPedidos.some(o => {
          const d = new Date(o.fechaPedido || o.fecha || o.createdAt || o.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });

        if (!hasDataCurrent) {
          const sorted = [...validPedidos].sort((a, b) => {
            const da = new Date(a.fechaPedido || a.fecha || a.createdAt || a.date);
            const db = new Date(b.fechaPedido || b.fecha || b.createdAt || b.date);
            return db - da;
          });
          const mostRecent = new Date(sorted[0].fechaPedido || sorted[0].fecha || sorted[0].createdAt || sorted[0].date);
          if (!isNaN(mostRecent.getTime())) {
            setSelectedMonth(mostRecent.getMonth());
            setSelectedYear(mostRecent.getFullYear());
          }
        }
      }
    }
  }, [normalizedPedidos]);

  const handleShowTooltip = (e, label, value) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const x = (e.clientX - (rect?.left || 0))
    const y = (e.clientY - (rect?.top || 0))
    setTooltip({ visible: true, x, y, label, value })
  }
  const handleHideTooltip = () => setTooltip({ visible: false, x: 0, y: 0, label: '', value: 0 })

  useEffect(() => {
    const timer = setTimeout(() => { setChartLoaded(true) }, 300)
    return () => clearTimeout(timer)
  }, [])

  // 1. Procesar datos base
  const { productSales, productStock, clientesMap } = useMemo(() => {
    const ps = {}; const stok = {}; const cm = {}; const productIdToName = {};

    normalizedProductos.forEach(p => {
      const id = p.id || p.productoId;
      let name = String(p.nombre || '').trim() || 'Producto';
      if (name.length > 25) name = name.substring(0, 23) + '...';
      if (id) productIdToName[id] = name;
      stok[name] = Number(p.stock || 0);
    });

    normalizedPedidos.forEach(o => {
      const estado = String(o.estado || '').toLowerCase();
      if (['cancelado', 'eliminado', 'failed'].includes(estado)) return;

      const cliente = o.cliente || (o.usuario && o.usuario.nombre) || 'Anónimo';
      cm[cliente] = (cm[cliente] || 0) + 1;

      const items = o.items || o.detalles || o.lineItems || [];
      items.forEach(it => {
        const prodId = it.productoId || it.id || it.productId;
        const name = productIdToName[prodId] || it.nombre || it.title || 'Producto';
        ps[name] = (ps[name] || 0) + Number(it.cantidad || 1);
      });
    });

    return { productSales: ps, productStock: stok, clientesMap: cm };
  }, [normalizedProductos, normalizedPedidos]);

  // 2. Procesar Ventas Filtradas
  const { salesByDayOfWeek, salesTimeline, totalVentasFiltradas } = useMemo(() => {
    const timeline = new Array(31).fill(0);
    const weekStats = new Array(7).fill(0);
    let total = 0;

    normalizedPedidos.forEach(o => {
      const estado = String(o.estado || '').toLowerCase();
      const activeStates = ['procesando', 'enviado', 'entregado', 'shipped', 'delivered', 'processing'];
      if (!activeStates.includes(estado)) return;

      const fechaRaw = o.fechaPedido || o.fecha || o.createdAt || o.date;
      if (!fechaRaw) return;
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return;

      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        const dayOfMonth = d.getDate() - 1;
        const dayOfWeek = d.getDay();
        const monto = Number(o.total ?? o.monto ?? o.totalAmount ?? o.subtotal ?? 0);

        if (dayOfMonth >= 0 && dayOfMonth < 31) timeline[dayOfMonth] += monto;
        weekStats[dayOfWeek] += monto;
        total += monto;
      }
    });

    return {
      salesByDayOfWeek: weekStats,
      salesTimeline: timeline,
      totalVentasFiltradas: total
    };
  }, [normalizedPedidos, selectedMonth, selectedYear]);

  const topSold = topNFromMap(productSales, 5);
  const topStock = topNFromMap(productStock, 5);
  const topClientes = topNFromMap(clientesMap, 5);
  const palette = ['#6c5dd3', '#00d68f', '#ffce73', '#ff6b6b', '#0090ff', '#808191'];

  return (
    <div className={`charts-overview ${chartLoaded ? 'loaded' : ''}`} ref={containerRef}>

      {/* SECCIÓN FILTROS PREMIUM */}
      <div className="chart-card chart-span-full" style={{ padding: '24px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1a1d1f' }}>Reporte de Ventas Estacional</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span className="metric-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                Actualizado ahora
              </span>
              <span style={{ fontSize: '12px', color: '#6f767e', fontWeight: 500 }}>
                Analizando {normalizedPedidos.length} pedidos históricos
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', background: '#f4f4f4', padding: '6px', borderRadius: '14px' }}>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="pd-filter-select">
              {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="pd-filter-select">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Ventas por Día de la Semana */}
      <div className="chart-card">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4" /></svg>
          Rendimiento Semanal
        </h4>
        <div className="chart-inner" style={{ height: '200px', padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '12px', width: '100%' }}>
            {salesByDayOfWeek.map((monto, i) => {
              const max = Math.max(...salesByDayOfWeek, 1);
              const height = (monto / max) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    onMouseMove={(e) => handleShowTooltip(e, diasSemana[i], `S/ ${monto.toFixed(2)}`)}
                    onMouseLeave={handleHideTooltip}
                    style={{
                      width: '100%',
                      height: `${Math.max(height, 5)}%`,
                      background: i === now.getDay() ? 'var(--accent)' : 'rgba(108, 93, 211, 0.15)',
                      borderRadius: '6px',
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      cursor: 'pointer'
                    }}
                    className="bar-hover-effect"
                  ></div>
                  <span style={{ fontSize: '11px', color: '#6f767e', fontWeight: 600 }}>{diasSemana[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Productos más vendidos */}
      <div className="chart-card">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" /></svg>
          Top Ventas
        </h4>
        <div className="chart-inner" style={{ padding: '0 24px 24px' }}>
          <div className="horizontal-bars-container" style={{ padding: 0 }}>
            {topSold.length === 0 ? <div className="empty">Sin ventas registradas</div> : topSold.map(([name, val], i) => (
              <div key={i} className="horizontal-bar-row" style={{ gridTemplateColumns: '1fr 100px 40px', background: 'transparent', padding: '8px 0', border: 'none' }}>
                <div className="bar-product-name" style={{ fontSize: '12px', fontWeight: 600 }}>{name}</div>
                <div className="bar-container" style={{ height: '8px', background: '#f4f4f4' }}>
                  <div className="bar-fill" style={{ '--target-width': `${(val / Math.max(...topSold.map(s => s[1]), 1)) * 100}%`, background: palette[i], boxShadow: 'none' }}></div>
                </div>
                <div className="bar-value" style={{ fontSize: '12px', textAlign: 'right' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Comportamiento Clientes */}
      <div className="chart-card">
        <h4>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" /></svg>
          Clientes
        </h4>
        <div className="chart-inner" style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#f9f9fb', padding: '20px', borderRadius: '18px', width: '100%' }}>
            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e6e8ec" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray={`${(topClientes.length / 10) * 264} 264`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: '1.2rem', color: '#1a1d1f' }}>{topClientes.length}</div>
            </div>
            <div>
              <div style={{ color: '#6f767e', fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>Clientes Activos</div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#1a1d1f' }}>{clientes.length || 0}</div>
              <div style={{ fontSize: '10px', color: '#00d68f', fontWeight: 700, marginTop: '2px' }}>▲ Total histórico</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Gráfico de Área (Ventas del Mes Seleccionado) */}
      <div className="chart-card chart-span-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 24px 10px' }}>
          <div>
            <h4 style={{ margin: 0 }}>Fluctuación de Ingresos</h4>
            <span style={{ fontSize: '12px', color: '#6f767e', fontWeight: 500 }}>Ventas diarias de {meses[selectedMonth]}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: '#6f767e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Facturado</span>
            <div style={{ fontWeight: 800, fontSize: '22px', color: '#1a1d1f' }}>S/ {totalVentasFiltradas.toLocaleString('es-PE')}</div>
          </div>
        </div>
        <div className="chart-inner" style={{ height: '220px', padding: '10px 24px 24px' }}>
          {totalVentasFiltradas === 0 ? (
            <div className="empty" style={{ width: '100%', borderStyle: 'dashed', background: '#fafafb', margin: '10px 0' }}>
              No hay ventas facturadas en este periodo
            </div>
          ) : (
            <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
                <filter id="areaShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--accent)" floodOpacity="0.1" />
                </filter>
              </defs>
              {(() => {
                const max = Math.max(...salesTimeline, 10);
                const points = salesTimeline.map((v, i) => `${(i / 30) * 800},${200 - (v / max) * 160 - 10}`).join(' ');
                const area = `0,200 ${points} 800,200`;
                return (
                  <>
                    <polygon points={area} fill="url(#gradV)" />
                    <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#areaShadow)" />
                    {salesTimeline.map((v, i) => v > 0 && (
                      <circle key={i} cx={(i / 30) * 800} cy={200 - (v / max) * 160 - 10} r="6" fill="#fff" stroke="var(--accent)" strokeWidth="3"
                        onMouseMove={(e) => handleShowTooltip(e, `Día ${i + 1}`, `S/ ${v.toFixed(2)}`)} onMouseLeave={handleHideTooltip}
                        style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                      />
                    ))}
                  </>
                )
              })()}
            </svg>
          )}
        </div>
      </div>

      {tooltip.visible && (
        <div className="chart-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <div className="tt-label" style={{ fontWeight: 700, color: '#1a1d1f' }}>{tooltip.label}</div>
          <div className="tt-value" style={{ color: 'var(--accent)', fontWeight: 800 }}>{tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
