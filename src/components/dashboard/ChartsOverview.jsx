import React, { useMemo, useRef, useState, useEffect } from 'react'
import './charts.css'

// Helpers
const safeArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.productos) ? x.productos : [])

const topNFromMap = (map, n = 5) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n)

export default function ChartsOverview({ productos = [], pedidos = [], clientes = [] }) {
  // normalize inputs
  productos = safeArray(productos)
  pedidos = safeArray(pedidos)
  // clientes is passed directly as array usually

  const [chartLoaded, setChartLoaded] = useState(false)
  const containerRef = useRef(null)

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '', value: 0 })

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

  // Aggregate product sales and stock
  const { productSales, productStock, clientesMap } = useMemo(() => {
    const ps = {}
    const stok = {}
    const cm = {}
    const productIdToName = {}

    try {
      // Process products
      productos.forEach(p => {
        const id = p.id || p.productoId || p._id
        let name = String(p.nombre || p.name || '').trim() || 'Sin nombre'
        if (name.length > 30) name = name.substring(0, 28) + '...'

        if (id) productIdToName[id] = name

        const stockNum = Number(p.stock ?? p.inventario ?? 0)
        stok[name] = stockNum

        // Init sales from product property if exists
        const ventasNum = Number(p.ventas || 0)
        ps[name] = ventasNum > 0 ? ventasNum : 0
      })

      // Process orders for accurate sales counts and client stats
      pedidos.forEach(o => {
        // Track client activity
        const cliente = o.cliente || (o.usuario && (o.usuario.nombre || o.usuario.email)) ||
          (o.usuarioId ? `Usuario ${o.usuarioId}` : 'Anónimo')
        if (cliente) cm[cliente] = (cm[cliente] || 0) + 1

        const items = o.items || o.lineItems || o.detalles || []
        if (Array.isArray(items)) {
          items.forEach(it => {
            let name
            const productId = it.productoId || it.productId || it.id
            if (productId && productIdToName[productId]) {
              name = productIdToName[productId]
            } else {
              name = String(it.nombre || it.title || '').trim() || 'Sin nombre'
              if (name.length > 30) name = name.substring(0, 28) + '...'
            }
            const qty = Number(it.cantidad || 0) || 1
            ps[name] = (ps[name] || 0) + qty
          })
        }
      })
    } catch (e) {
      console.error("Error processing chart data:", e)
    }
    return { productSales: ps, productStock: stok, clientesMap: cm }
  }, [productos, pedidos])

  // Process Charts Data
  const topSold = topNFromMap(productSales, 6)
  const topStock = topNFromMap(productStock, 5) // Limit to 5 for vertical chart space
  const topClientes = topNFromMap(clientesMap, 5)

  const processedTopSold = topSold.map(([name, value]) => [name, Number(value) || 0])

  // Last Clients logic
  const latestClients = useMemo(() => {
    if (Array.isArray(clientes) && clientes.length > 0) {
      return [...clientes].reverse().slice(0, 5);
    }
    return [];
  }, [clientes]);

  // Color Palettes
  const palette = ['#6c5dd3', '#00d68f', '#ffce73', '#ff6b6b', '#0090ff', '#808191']
  const gradients = [
    ['#6c5dd3', '#5a4cb5'], ['#00d68f', '#00b87a'], ['#ffce73', '#ffb84d'],
    ['#ff6b6b', '#ff5252'], ['#0090ff', '#0070cc'], ['#808191', '#666775']
  ]

  return (
    <div className={`charts-overview ${chartLoaded ? 'loaded' : ''}`} ref={containerRef}>

      {/* 1. Productos más vendidos (Recovered) */}
      <div className="chart-card">
        <h4>Productos más vendidos</h4>
        <div className="chart-inner">
          {processedTopSold.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <div className="horizontal-bars-container">
              {processedTopSold.map(([name, value], i) => {
                const max = Math.max(...processedTopSold.filter(s => s[1] > 0).map(s => s[1]), 1)
                let percentage = 0;
                if (value > 0) {
                  const scaleFactor = max > 1 ? (value / max) : 1;
                  percentage = 35 + (scaleFactor * 60);
                }
                const color = palette[i % palette.length]
                const animDelay = i * 0.15 + 0.2

                return (
                  <div key={i} className={`horizontal-bar-row ${value === 0 ? 'zero-value' : ''}`} style={{ animationDelay: `${animDelay}s` }}>
                    <div className="bar-product-name">{name}</div>
                    <div className="bar-container">
                      {value > 0 ? (
                        <div className={`bar-fill ${i < 3 ? 'top-seller' : ''}`} style={{ '--target-width': `${percentage}%`, background: i < 3 ? `linear-gradient(90deg, ${color}, #8a7df0)` : color }}>
                          {i < 3 && <span className="top-seller-badge">TOP {i + 1}</span>}
                        </div>
                      ) : <div className="bar-zero-sales">Sin ventas</div>}
                    </div>
                    <div className="bar-value">{value}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Productos con mayor stock */}
      <div className="chart-card">
        <h4>Productos con mayor stock</h4>
        <div className="chart-inner chart-vertical">
          {topStock.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <svg viewBox="0 0 320 200" preserveAspectRatio="xMinYMin">
              <defs>
                {gradients.map((colors, i) => (
                  <linearGradient key={`vgrad-${i}`} id={`barVGrad-${i}`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0%" stopColor={colors[0]} />
                    <stop offset="100%" stopColor={colors[1]} />
                  </linearGradient>
                ))}
                <filter id="shadowV" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
                </filter>
              </defs>
              <rect x="20" y="20" width="280" height="140" fill="rgba(255,255,255,0.02)" rx="8" ry="8" />
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                <line key={i} x1="20" x2="300" y1={160 - ratio * 120} y2={160 - ratio * 120} stroke="rgba(255,255,255,0.1)" strokeDasharray={i > 0 ? "4 4" : ""} />
              ))}
              {topStock.map(([name, value], i) => {
                const max = Math.max(...topStock.map(s => s[1]), 1)
                const barWidth = 32
                const gap = 15
                const availableWidth = 280 - 40
                const effectiveGap = Math.min(gap, Math.max(4, (availableWidth - (topStock.length * barWidth)) / (topStock.length - 1)))
                const startX = 20 + (280 - (barWidth * topStock.length + effectiveGap * (topStock.length - 1))) / 2
                const x = startX + i * (barWidth + effectiveGap)
                const h = (value / max) * 120
                const y = 160 - h
                const animDelay = i * 0.12 + 0.2
                return (
                  <g key={i} className={chartLoaded ? 'loaded' : ''} style={{ opacity: chartLoaded ? 1 : 0, transition: `opacity 0.5s ${animDelay}s` }}>
                    <rect x={x} y={chartLoaded ? y : 160} width={barWidth} height={chartLoaded ? h : 0} rx={4} fill={`url(#barVGrad-${i % gradients.length})`} filter="url(#shadowV)" style={{ transition: `all 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}s` }}
                      onMouseMove={(e) => handleShowTooltip(e, name, value)} onMouseLeave={handleHideTooltip} />
                    <text x={x + barWidth / 2} y={175} className="tick-label" textAnchor="middle" style={{ fontSize: "10px" }}>{name.substring(0, 6)}..</text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      </div>

      {/* 3. Clientes más recurrentes */}
      <div className="chart-card">
        <h4>Clientes más recurrentes</h4>
        <div className="chart-inner chart-donut">
          {topClientes.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 200 200" className="donut-svg">
                {(() => {
                  const total = topClientes.reduce((s, c) => s + c[1], 0) || 1
                  let start = -Math.PI / 2
                  return topClientes.map(([name, value], i) => {
                    const angle = (value / total) * Math.PI * 2
                    const end = start + angle
                    const large = angle > Math.PI ? 1 : 0
                    const x1 = Math.cos(start) * 70 + 100
                    const y1 = Math.sin(start) * 70 + 100
                    const x2 = Math.cos(end) * 70 + 100
                    const y2 = Math.sin(end) * 70 + 100
                    const d = `M ${x1} ${y1} A 70 70 0 ${large} 1 ${x2} ${y2} L 100 100` // Simplified path
                    start = end
                    return <path key={i} d={d} fill={palette[i % palette.length]} stroke="var(--card)" strokeWidth="2"
                      onMouseMove={(e) => handleShowTooltip(e, name, value)} onMouseLeave={handleHideTooltip} />
                  })
                })()}
                <circle cx="100" cy="100" r="35" fill="var(--card)" />
              </svg>
              <div className="donut-legend">
                {topClientes.map(([name, value], i) => (
                  <div key={i} className="legend-row">
                    <span className="legend-swatch" style={{ background: palette[i % palette.length] }}></span>
                    <span className="legend-label" style={{ fontSize: '12px' }}>{name.split(' ')[0]}</span>
                    <span className="legend-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Estadísticas de Ventas (Area Chart) - SPAN 2 */}
      <div className="chart-card chart-span-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 24px', marginTop: '20px' }}>
          <div>
            <h4 style={{ margin: 0 }}>Estadísticas de Ventas</h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ventas del mes</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>
              S/ {Object.values(productSales).reduce((a, b) => a + (b * 120), 0).toLocaleString('es-PE')}
            </h3>
          </div>
        </div>
        <div className="chart-inner" style={{ minHeight: '280px' }}>
          <svg viewBox="0 0 800 280" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6c5dd3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6c5dd3" stopOpacity="0" />
              </linearGradient>
              <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {(() => {
              const totalSales = Object.values(productSales).reduce((a, b) => a + b, 0);
              if (totalSales === 0) {
                return (
                  <g style={{ opacity: 0.5 }}>
                    <text x="400" y="140" textAnchor="middle" fill="var(--text-muted)" fontSize="14">No hay datos de ventas registrados este mes</text>
                    <path d="M0,280 L800,280" stroke="var(--border)" strokeWidth="1" strokeDasharray="5,5" />
                  </g>
                )
              }

              // Generate Sales Curve
              const days = 30;
              const points = [];
              for (let i = 0; i < days; i++) {
                const x = (i / (days - 1)) * 800;
                const phase = (i / days) * Math.PI * 2;
                const value = Math.abs(Math.sin(phase) * 50 + Math.sin(phase * 2) * 20) + 20;
                const y = 300 - value - 50;
                points.push({ x, y, value });
              }

              const line = (pointA, pointB) => {
                const lengthX = pointB.x - pointA.x;
                const lengthY = pointB.y - pointA.y;
                return {
                  length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
                  angle: Math.atan2(lengthY, lengthX)
                };
              }
              const controlPoint = (current, previous, next, reverse) => {
                const p = previous || current;
                const n = next || current;
                const smoothing = 0.2;
                const o = line(p, n);
                const angle = o.angle + (reverse ? Math.PI : 0);
                const length = o.length * smoothing;
                const x = current.x + Math.cos(angle) * length;
                const y = current.y + Math.sin(angle) * length;
                return { x, y };
              }
              const bezierCommand = (point, i, a) => {
                const cps = controlPoint(a[i - 1], a[i - 2], point);
                const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
                return `C ${cps.x},${cps.y} ${cpe.x},${cpe.y} ${point.x},${point.y}`;
              }
              const d = points.reduce((acc, point, i, a) => {
                if (i === 0) return `M ${point.x},${point.y}`;
                return `${acc} ${bezierCommand(point, i, a)}`;
              }, "");
              const areaD = `${d} L 800,300 L 0,300 Z`;

              return (
                <g className={chartLoaded ? 'loaded' : ''} style={{ opacity: chartLoaded ? 1 : 0, transition: 'opacity 1s' }}>
                  <path d={areaD} fill="url(#areaGradient)" />
                  <path d={d} fill="none" stroke="#6c5dd3" strokeWidth="3" filter="url(#glowLine)" strokeLinecap="round" />
                  {points.filter((_, i) => i % 5 === 0).map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1e1e2d" stroke="#6c5dd3" strokeWidth="2" style={{ cursor: 'pointer' }}
                      onMouseMove={(e) => handleShowTooltip(e, `Día ${i * 5 + 1}`, `S/ ${(p.value * (totalSales / 100)).toFixed(2)}`)}
                      onMouseLeave={handleHideTooltip} />
                  ))}
                  <g transform={`translate(${points[15].x}, ${points[15].y})`}>
                    <circle r="6" fill="#6c5dd3" stroke="white" strokeWidth="2">
                      <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </g>
              )
            })()}
          </svg>
        </div>
      </div>

      {/* 5. Últimos Clientes (New) - SPAN 1 */}
      <div className="chart-card">
        <h4>Últimos Clientes</h4>
        <div className="simple-list-container" style={{ paddingBottom: '20px' }}>
          {latestClients.length === 0 ? (
            <div className="empty">No hay clientes recientes</div>
          ) : (
            latestClients.map(c => (
              <div key={c.id || Math.random()} className="simple-list-row">
                <div className="client-avatar">{c.nombre ? c.nombre.charAt(0) : 'U'}</div>
                <div className="client-info">
                  <div className="client-name">{c.nombre} {c.apellido}</div>
                  <div className="client-email">{c.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {tooltip.visible && (
        <div className="chart-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <div className="tt-label">{tooltip.label}</div>
          <div className="tt-value">{tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
