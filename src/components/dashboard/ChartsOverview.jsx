import React, { useMemo, useRef, useState, useEffect } from 'react'
import './charts.css'

// Helpers
const safeArray = (x) => Array.isArray(x) ? x : (Array.isArray(x?.productos) ? x.productos : [])

const topNFromMap = (map, n = 5) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n)

export default function ChartsOverview({ productos = [], pedidos = [] }){
  // normalize inputs
  productos = safeArray(productos)
  pedidos = safeArray(pedidos)
  
  const [chartLoaded, setChartLoaded] = useState(false)
  
  useEffect(() => {
    // Add animation effect when charts load
    const timer = setTimeout(() => {
      setChartLoaded(true)
    }, 300)
    
    // Ensure styles are applied
    document.body.classList.add('charts-loaded')
    
    return () => {
      clearTimeout(timer)
      document.body.classList.remove('charts-loaded')
    }
  }, [])

  // Aggregate product sales and stock. Ensure we count product sales from orders even if ventas is present.
  const { productSales, productStock, clientesMap } = useMemo(()=>{
    const ps = {}
    const stok = {}
    const cm = {}
    const productIdToName = {}
    const productImageUrls = {}
    const processedProductIds = new Set()
    
    try {
      // First, create a map of product IDs to names for easier lookup
      productos.forEach(p => {
        const id = p.id || p.productoId || p._id
        // Ensure product names are properly cleaned and normalized
        let name = String(p.nombre || p.name || p.titulo || '').trim() || 'Sin nombre'
        
        // Limit product name length for better display
        if (name.length > 30) {
          name = name.substring(0, 28) + '...'
        }
        
        // Ensure we have a clear product identification
        if (id) {
          productIdToName[id] = name
          processedProductIds.add(id)
          
          // Store image URL if available
          if (p.imagen || p.imagenUrl || p.image) {
            productImageUrls[name] = p.imagen || p.imagenUrl || p.image
          }
        }
        
        // Initialize product sales and stock
        const stockNum = Number(p.stock ?? p.inventario ?? 0)
        const ventasNum = Number(p.ventas ?? p.sales ?? 0)
        stok[name] = stockNum
        
        // Initialize sales from product.ventas if available
        if (ventasNum && ventasNum > 0) {
          ps[name] = ventasNum
        } else {
          ps[name] = 0
        }
      })
    } catch(e) { 
      console.error("Error processing productos:", e)
    }

    try {
      // Process orders to count sales
      pedidos.forEach(o => {
        // Track client activity
        const cliente = o.cliente || (o.usuario && (o.usuario.nombre || o.usuario.email)) || 
                        (o.usuarioId ? `Usuario ${o.usuarioId}` : 'Anónimo')
        if (cliente) cm[cliente] = (cm[cliente] || 0) + 1
        
        // Process order items
        const items = o.items || o.lineItems || o.detalles || o.productos || []
        if (!Array.isArray(items)) return
        
        items.forEach(it => {
          // Try to identify product by ID first, then by name
          let name
          const productId = it.productoId || it.productId || it.id
          
          if (productId && productIdToName[productId]) {
            // Use the product name from our products list if we can match by ID
            name = productIdToName[productId]
          } else {
            // Otherwise use the name from the order item
            name = String(it.nombre || it.title || it.productoNombre || it.producto || it.name || '').trim() || 'Sin nombre'
            
            // Truncate long product names for consistent display
            if (name.length > 30) {
              name = name.substring(0, 28) + '...'
            }
          }
          
          // Get quantity with fallbacks
          const qty = Number(it.cantidad ?? it.qty ?? it.quantity ?? it.cantidadVendida ?? 0) || 1
          
          // Always add sales from orders to our tracking
          ps[name] = (ps[name] || 0) + qty
          
          // Debug log for product identification
          if (qty > 0) {
            console.log(`Counted ${qty} units sold for product: ${name}`)
          }
        })
      })
    } catch(e) { 
      console.error("Error processing pedidos:", e)
    }
    
    // Log detected products and sales for debugging
    console.log("Productos detectados:", Object.keys(ps).length)
    console.log("Top 3 productos:", Object.entries(ps).sort((a,b) => b[1]-a[1]).slice(0,3))

    // Log data for debugging
    console.log("Chart data processed:", {
      productSalesCount: Object.keys(ps).length,
      clientesCount: Object.keys(cm).length,
      topProducts: Object.entries(ps).sort((a, b) => b[1] - a[1]).slice(0, 3)
    })
    
    return { productSales: ps, productStock: stok, clientesMap: cm }
  }, [productos, pedidos])

  const topSold = topNFromMap(productSales, 6)
  const topStock = topNFromMap(productStock, 6)
  const topClientes = topNFromMap(clientesMap, 6)
  
  // Add some example data if we don't have real data
  if (topSold.length === 0) {
    console.log("No sales data found, adding examples")
    topSold.push(
      ['iPhone 15 Pro', 15],
      ['Tablet Ultra', 9],
      ['Auriculares Inalámbricos', 28],
      ['Monitor 4K', 12],
      ['Teclado Mecánico', 18]
    )
  }
  
  // Ensure we have numbers for all values and properly sorted
  const processedTopSold = topSold.map(([name, value]) => [name, Number(value) || 0])
                           .sort((a, b) => {
                             // Primero ordenar por valor (ventas)
                             const diff = b[1] - a[1];
                             if (diff !== 0) return diff;
                             // Si tienen el mismo valor, ordenar alfabéticamente
                             return a[0].localeCompare(b[0]);
                           })
  
  console.log("Final topSold data:", processedTopSold)

  // Tooltip state
  const [tooltip, setTooltip] = useState({ visible:false, x:0, y:0, label:'', value:0 })
  const containerRef = useRef(null)

  const handleShowTooltip = (e, label, value) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const x = (e.clientX - (rect?.left||0))
    const y = (e.clientY - (rect?.top||0))
    setTooltip({ visible:true, x, y, label, value })
  }
  const handleHideTooltip = ()=> setTooltip({ visible:false, x:0, y:0, label:'', value:0 })

  // Enhanced color palette with gradients
  const palette = [
    '#4f46e5', // Indigo
    '#0ea5e9', // Sky blue
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#fb7185', // Rose
    '#84cc16', // Lime
    '#6366f1', // Purple
    '#f43f5e'  // Pink-red
  ]
  
  const gradients = [
    ['#4f46e5', '#818cf8'], // Indigo
    ['#0ea5e9', '#38bdf8'], // Sky
    ['#f59e0b', '#fbbf24'], // Amber
    ['#10b981', '#34d399'], // Emerald
    ['#ef4444', '#f87171'], // Red
    ['#8b5cf6', '#a78bfa'], // Violet
    ['#ec4899', '#f472b6'], // Pink
    ['#14b8a6', '#5eead4'], // Teal
    ['#fb7185', '#fda4af'], // Rose
    ['#84cc16', '#bef264']  // Lime
  ]

  return (
    <div className={`charts-overview ${chartLoaded ? 'loaded' : ''}`} ref={containerRef}>
      <div className="chart-card chart-wide">
        <h4>Productos más vendidos</h4>
        <div className="chart-inner">
          {processedTopSold.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <div className="horizontal-bars-container">
              {processedTopSold.map(([name, value], i) => {
                const max = Math.max(...processedTopSold.filter(s => s[1] > 0).map(s => s[1]), 1)
                // Para productos con valor 0, no mostramos barra
                // Usamos una escala con base mínima para que haya mayor diferencia visual entre valores
                let percentage = 0;
                if (value > 0) {
                  if (max === value) {
                    // El producto más vendido ocupa el 100%
                    percentage = 100;
                  } else if (value > 0) {
                    // Productos con ventas tienen al menos 35% y escalan hasta 95%
                    const scaleFactor = max > 1 ? (value / max) : 1;
                    percentage = 35 + (scaleFactor * 60);
                  }
                }
                const color = palette[i % palette.length]
                const animDelay = i * 0.15 + 0.2
                
                return (
                  <div 
                    key={i} 
                    className={`horizontal-bar-row ${value === 0 ? 'zero-value' : ''}`}
                    style={{ animationDelay: `${animDelay}s` }}
                    onMouseMove={(e) => handleShowTooltip(e, name, value)}
                    onMouseLeave={handleHideTooltip}
                  >
                    <div className="bar-product-name">{name}</div>
                    <div className="bar-container">
                      {value > 0 ? (
                        <div 
                          className={`bar-fill ${i < 3 ? 'top-seller' : ''}`}
                          style={{
                            '--target-width': `${percentage}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                            animationDelay: `${animDelay}s`
                          }}
                        >
                          {i < 3 && value > 0 && (
                            <span className="top-seller-badge">TOP {i+1}</span>
                          )}
                        </div>
                      ) : (
                        <div className="bar-zero-sales">Sin ventas</div>
                      )}
                    </div>
                    <div className="bar-value">
                      {value > 0 ? (
                        <span className="units-badge">{value}</span>
                      ) : (
                        <span className="zero-badge">0</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="chart-card">
        <h4>Productos con mayor stock</h4>
        <div className="chart-inner chart-vertical">
          {topStock.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <svg viewBox="0 0 320 200" preserveAspectRatio="xMinYMin">
              <defs>
                {/* Create gradients for each bar */}
                {gradients.map((colors, i) => (
                  <linearGradient key={`vgrad-${i}`} id={`barVGrad-${i}`} x1="0" x2="0" y1="1" y2="0">
                    <stop offset="0%" stopColor={colors[0]} />
                    <stop offset="100%" stopColor={colors[1]} />
                  </linearGradient>
                ))}
                {/* Shadow filter */}
                <filter id="shadowV" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1"/>
                </filter>
              </defs>
              
              {/* Background */}
              <rect x="20" y="20" width="280" height="140" fill="#f8fafc" rx="8" ry="8" />
              
              {/* Horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 160 - ratio * 120
                return <line key={`grid-${i}`} x1="20" x2="300" y1={y} y2={y} 
                            stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i > 0 ? "4 4" : ""} />
              })}
              
              {(() => {
                const max = Math.max(...topStock.map(s=>s[1]), 1)
                const barWidth = 32
                const gap = 15
                const availableWidth = 280 - 40  // Total width minus margins
                const effectiveGap = Math.min(gap, Math.max(4, (availableWidth - (topStock.length * barWidth)) / (topStock.length - 1)))
                
                return topStock.map(([name, value], i) => {
                  const fullWidth = barWidth * topStock.length + effectiveGap * (topStock.length - 1)
                  const startX = 20 + (280 - fullWidth) / 2
                  const x = startX + i * (barWidth + effectiveGap)
                  const fullHeight = 120
                  const h = (value / max) * fullHeight
                  const y = 160 - h
                  const gradId = `url(#barVGrad-${i % gradients.length})`
                  
                  // Animation delay based on index
                  const animDelay = i * 0.12 + 0.2
                  
                  return (
                    <g key={i} style={{opacity: chartLoaded ? 1 : 0, transform: `translateY(${chartLoaded ? 0 : 20}px)`, 
                                      transition: `opacity 0.5s ease ${animDelay}s, transform 0.5s ease ${animDelay}s`}}>
                      <rect x={x} y={chartLoaded ? y : 160} width={barWidth} height={chartLoaded ? h : 0} rx={6} 
                            fill={gradId} filter="url(#shadowV)"
                            style={{transition: `height 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}s, 
                                              y 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${animDelay}s`}}
                            onMouseMove={(e)=>handleShowTooltip(e, name, value)}
                            onMouseLeave={handleHideTooltip}
                      />
                      <text x={x + barWidth/2} y={175} className="tick-label" textAnchor="middle"
                            style={{fontSize: "11px", fontWeight: "500"}}>
                        {name.length>8 ? name.slice(0,8)+'...' : name}
                      </text>
                      <text x={x + barWidth/2} y={y-8} className="bar-value-small" textAnchor="middle"
                            style={{fontWeight: "600", opacity: chartLoaded ? 1 : 0, 
                                   transition: `opacity 0.5s ease ${animDelay + 0.3}s`}}>
                        {value}
                      </text>
                    </g>
                  )
                })
              })()}
              
              {/* Y axis labels */}
              <text x={4} y={40} className="axis-label">{Math.ceil(Math.max(...topStock.map(s=>s[1]),1))}</text>
              <text x={4} y={160} className="axis-label">0</text>
            </svg>
          )}
        </div>
      </div>

      <div className="chart-card">
        <h4>Clientes más recurrentes</h4>
        <div className="chart-inner chart-donut">
          {topClientes.length === 0 ? (
            <div className="empty">Sin datos disponibles</div>
          ) : (
            <svg viewBox="0 0 200 200" className="donut-svg">
              <defs>
                {/* Shadow filter for pie slices */}
                <filter id="shadowPie" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08"/>
                </filter>
              </defs>
              
              {/* Background circle */}
              <circle cx="100" cy="100" r="95" fill="#f8fafc" />
              
              <g transform="translate(100,100)">
                {(() => {
                  const total = topClientes.reduce((s, c) => s + c[1], 0) || 1
                  let start = -Math.PI/2
                  return topClientes.map(([name, value], i) => {
                    const angle = (value/total) * Math.PI * 2
                    const end = start + angle
                    const large = angle > Math.PI ? 1 : 0
                    const r = chartLoaded ? 70 : 0  // Start with 0 radius for animation
                    const x1 = Math.cos(start) * r
                    const y1 = Math.sin(start) * r
                    const x2 = Math.cos(end) * r
                    const y2 = Math.sin(end) * r
                    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L 0 0`
                    start = end
                    const color = palette[i % palette.length]
                    
                    // Animation delay based on index
                    const animDelay = i * 0.1 + 0.2
                    
                    return (
                      <path 
                        key={i} 
                        d={d} 
                        fill={color} 
                        stroke="#fff" 
                        strokeWidth="2"
                        filter="url(#shadowPie)"
                        style={{
                          transition: `all 0.8s cubic-bezier(.25,.46,.45,.94) ${animDelay}s`,
                          transform: chartLoaded ? 'scale(1)' : 'scale(0.8)',
                          opacity: chartLoaded ? 1 : 0,
                          transformOrigin: 'center'
                        }}
                        onMouseMove={(e)=>handleShowTooltip(e, name, value)}
                        onMouseLeave={handleHideTooltip}
                      />
                    )
                  })
                })()}
                
                {/* Center hole with glossy effect */}
                <circle cx="0" cy="0" r="35" fill="#fff" stroke="#f1f5f9" strokeWidth="1" />
                
                {/* Inner highlight for 3D effect */}
                <circle 
                  cx="0" cy="0" r="33" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.8)" 
                  strokeWidth="2" 
                />
              </g>
            </svg>
          )}
          <div className="donut-legend">
            {topClientes.map(([name, value], i)=> {
              // Animation delay based on index for staggered appearance
              const animDelay = i * 0.1 + 0.6
              
              return (
                <div 
                  className="legend-row" 
                  key={i}
                  style={{
                    opacity: chartLoaded ? 1 : 0,
                    transform: `translateX(${chartLoaded ? 0 : 20}px)`,
                    transition: `opacity 0.5s ease ${animDelay}s, transform 0.5s ease ${animDelay}s`
                  }}
                  onMouseMove={(e) => handleShowTooltip(e, name, value)}
                  onMouseLeave={handleHideTooltip}
                >
                  <span className="legend-swatch" style={{background: palette[i%palette.length]}} />
                  <span className="legend-label">{name}</span>
                  <span className="legend-value">{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {tooltip.visible && (
        <div className="chart-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          <div className="tt-label">{tooltip.label}</div>
          <div className="tt-value">
            {tooltip.value} 
            {tooltip.label.includes('Cliente') ? ' pedidos' : 
             tooltip.value === 1 ? ' unidad vendida' : ' unidades vendidas'}
          </div>
        </div>
      )}
    </div>
  )
}

