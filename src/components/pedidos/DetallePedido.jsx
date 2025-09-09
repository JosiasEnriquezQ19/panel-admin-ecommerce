import React, { useState, useEffect } from 'react';
import './pedidos-styles.css';
import './pedidos-minimalista.css';
import { formatDatePeru } from '../../utils/dateUtils';
import { API_BASE } from '../../utils/api';

// Estados de pedido
const estadosPedido = {
  'pendiente': { color: '#ffc107', label: 'Pendiente' },
  'procesando': { color: '#17a2b8', label: 'Procesando' },
  'enviado': { color: '#28a745', label: 'Enviado' },
  'entregado': { color: '#6c757d', label: 'Entregado' },
  'cancelado': { color: '#dc3545', label: 'Cancelado' }
};

export default function DetallePedido({ 
  pedido, 
  onClose, 
  onCambiarEstado
}) {
  if (!pedido) return null;
  
  // Helper: calcula subtotal sumando cantidad * precioUnitario de los detalles
  const calculateSubtotalFromDetalles = (detalles) => {
    if (!Array.isArray(detalles)) return 0;
    return detalles.reduce((sum, d) => {
      const cantidad = d.cantidad ?? 1;
      const precio = Number(d.precioUnitario ?? d.precio ?? (d.producto?.precio ?? 0));
      return sum + (cantidad * precio);
    }, 0);
  };
  
  // Función para cambiar estado con UI mejorada
  const [nuevoEstado, setNuevoEstado] = useState(pedido.estado || 'pendiente')
  const [cambiando, setCambiando] = useState(false)
  const [errorCambio, setErrorCambio] = useState(null)

  const handleCambiarEstado = async (e) => {
    e.preventDefault()
    setErrorCambio(null)
    if (!nuevoEstado || nuevoEstado === pedido.estado) return
    if (!confirm(`Cambiar estado a "${nuevoEstado}"?`)) return
    try {
      setCambiando(true)
      await onCambiarEstado(pedido.id, nuevoEstado)
    } catch (err) {
      setErrorCambio(err?.message || String(err) || 'Error al cambiar estado')
    } finally {
      setCambiando(false)
    }
  }

  // Estado para la dirección del cliente
  const [direccion, setDireccion] = useState(null)
  const [loadingDireccion, setLoadingDireccion] = useState(false)
  
  // Obtener dirección desde varias posibles ubicaciones en el objeto pedido
  useEffect(() => {
    const obtenerDireccion = async () => {
      const candidatoDireccion = pedido.raw?.direccion || pedido.usuarioObj?.direccion || pedido.usuario?.direccion || pedido.direccion
      
      if (candidatoDireccion) {
        if (typeof candidatoDireccion === 'string') {
          setDireccion({ raw: candidatoDireccion })
        } else {
          setDireccion(candidatoDireccion)
        }
        return
      }
      
      // Si no encontramos dirección y tenemos usuarioId, intentar buscar direcciones del usuario
      const usuarioId = pedido.raw?.usuarioId || 
                       (pedido.usuarioObj?.usuarioId || pedido.usuarioObj?.id) || 
                       (pedido.raw?.usuario?.usuarioId || pedido.raw?.usuario?.id)
      
      if (usuarioId) {
        setLoadingDireccion(true)
        try {
          const res = await fetch(`${API_BASE}/Direcciones/usuario/${usuarioId}`)
          if (res.ok) {
            const direcciones = await res.json()
            if (Array.isArray(direcciones) && direcciones.length > 0) {
              setDireccion(direcciones[0])
            }
          }
        } catch (error) {
          console.error("Error al obtener dirección:", error)
        } finally {
          setLoadingDireccion(false)
        }
      }
    }
    
    obtenerDireccion()
  }, [pedido])

  // Imprimir una hoja simple con la información necesaria para el encargado
  const handlePrintShipping = () => {
    try {
      const recipient = pedido.usuario || pedido.raw?.cliente || pedido.raw?.usuario?.nombre || 'Cliente'
      const phone = pedido.raw?.telefono || (direccion && (direccion.telefono || direccion.phone)) || pedido.raw?.usuario?.telefono || '-'

      const address = (() => {
        if (!direccion) return (pedido.raw?.direccion || pedido.raw?.direccionEntrega || pedido.raw?.direccionString || '')
        if (typeof direccion === 'string') return direccion
        const lines = []
        if (direccion.calle || direccion.callePrincipal || direccion.direccion) lines.push(direccion.calle || direccion.callePrincipal || direccion.direccion)
        if (direccion.colonia || direccion.barrio) lines.push(direccion.colonia || direccion.barrio)
        const ciudadProv = [(direccion.ciudad || direccion.city), (direccion.estado || direccion.provincia)].filter(Boolean).join(', ')
        if (ciudadProv) lines.push(ciudadProv)
        if (direccion.codigoPostal || direccion.cp) lines.push('CP: ' + (direccion.codigoPostal || direccion.cp))
        return lines.join('<br>')
      })()

      const orderId = pedido.id || pedido.pedidoId || pedido.PedidoId || '-'

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Etiqueta de Envío</title>
          <style>
            @page { size: auto; margin: 4mm; }
            body { font-family: Arial, Helvetica, sans-serif; padding: 4px; color: #000; margin:0 }
            .label-box { border: 1px solid #222; padding: 10px 12px; width: 380px; max-width: 96%; box-sizing: border-box; display:flex; flex-direction:column; justify-content:flex-start; gap:6px; position: relative }
            .small { font-size: 12px; color: #333; text-align: left }
            .order-id { font-size: 12px; margin: 0 }
            .recipient { font-size: 14px; font-weight: 700; margin: 0 }
            .address { font-size: 16px; font-weight: 700; line-height: 1.1; margin: 0; text-align:left; word-break: break-word }
            .meta { font-size: 12px; color: #444; margin-top: auto; align-self: flex-end }
            .tel { font-size: 16px; font-weight: 700; color: #222 }
            .store-name { font-size: 12px; font-weight: 700; color: #222 }
            @media print { body { -webkit-print-color-adjust: exact; } .label-box { border-style: solid; } }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="store-name">Tienda +</div>
            ${recipient ? `<div class="recipient">${escapeHtml(recipient)}</div>` : ''}
            <div class="address">${address || '-'}</div>
            ${pedido.raw?.numeroSeguimiento ? `<div class="small">Tracking: ${escapeHtml(pedido.raw.numeroSeguimiento)}</div>` : ''}
            ${pedido.raw?.referencia ? `<div class="small">Ref: ${escapeHtml(pedido.raw.referencia)}</div>` : ''}
            <div class="tel">Tel: ${escapeHtml(phone)}</div>
            <div class="meta">Pegar esta etiqueta en el paquete</div>
          </div>
        </body>
        </html>
      `

      const w = window.open('', '_blank', 'width=700,height=900')
      if (!w) {
        alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de pop-ups.');
        return;
      }
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => { try { w.print(); w.close(); } catch(e) { } }, 300)
    } catch (e) {
      console.error('Error al generar impresión de envío:', e)
      alert('Error al generar impresión de envío')
    }
  }

  // Imprimir comprobante tipo ticket mejorado
  const handlePrintComprobante = () => {
    try {
      const tienda = 'Tienda +'
      const cliente = pedido.usuario || pedido.raw?.cliente || pedido.raw?.usuario?.nombre || 'Cliente'
      
      // Formatear solo la fecha sin horas
      const formatDateOnly = (date) => {
        if (!date) return new Date().toLocaleDateString('es-PE');
        try {
          const dateObj = new Date(date);
          const options = { timeZone: 'America/Lima' };
          const fechaPeru = new Date(dateObj.toLocaleString('en-US', options));
          const dia = fechaPeru.getDate().toString().padStart(2, '0');
          const mes = (fechaPeru.getMonth() + 1).toString().padStart(2, '0');
          const anio = fechaPeru.getFullYear();
          return `${dia}/${mes}/${anio}`;
        } catch (error) {
          return new Date().toLocaleDateString('es-PE');
        }
      };
      
      const fecha = formatDateOnly(pedido.fecha)
      const detalles = pedido.raw?.detalles || []

      // Calcular totales
      const subtotalCalc = calculateSubtotalFromDetalles(detalles)
      const costoEnvio = Number(pedido.raw?.costoEnvio) || 0
      const impuestos = Number(pedido.raw?.impuestos) || 0
      const total = (pedido.raw && typeof pedido.raw.total !== 'undefined' && !Number.isNaN(Number(pedido.raw.total)))
        ? Number(pedido.raw.total)
        : (subtotalCalc + costoEnvio + impuestos)

      // Generar contenido aleatorio para el QR
      const randomSeed = `${pedido.id || Date.now()}-${Math.random().toString(36).slice(2,9)}`

      // Filas de productos con mejor formato
      const rowsHtml = detalles.map(d => {
        const prod = d.producto || {}
        const nombre = prod.nombre || d.nombre || prod.productoNombre || 'Producto'
        const cantidad = d.cantidad ?? 1
        const precio = Number(d.precioUnitario ?? d.precio ?? prod.precio ?? 0)
        const subtotal = cantidad * precio
        
        // Formatear precios
        const precioFmt = precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const subtotalFmt = subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        
        return `
          <tr>
            <td class="col-name">${escapeHtml(nombre)}</td>
            <td class="col-qty">${cantidad}</td>
            <td class="col-price">S/${precioFmt}</td>
            <td class="col-sub">S/${subtotalFmt}</td>
          </tr>`
      }).join('')

      const html = `
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprobante de Pedido</title>
          <style>
            /* Estilos mejorados para ticket */
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            * {
              box-sizing: border-box;
              font-family: 'Courier New', monospace;
            }
            body {
              width: 80mm;
              margin: 0;
              padding: 4mm;
              font-size: 12px;
              color: #000;
            }
            .ticket {
              width: 100%;
              border: 1px solid #000;
              padding: 8px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #000;
            }
            .store-name {
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 4px;
            }
            .order-info {
              margin-bottom: 10px;
              font-size: 11px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            .info-label {
              font-weight: bold;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: 11px;
            }
            .products-table th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding: 5px 2px;
              font-weight: bold;
            }
            .products-table td {
              padding: 4px 2px;
              vertical-align: top;
            }
            .col-name {
              width: 40%;
            }
            .col-qty {
              width: 15%;
              text-align: center;
            }
            .col-price {
              width: 20%;
              text-align: right;
            }
            .col-sub {
              width: 25%;
              text-align: right;
            }
            .totals {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .final-total {
              font-weight: bold;
              font-size: 14px;
              margin-top: 6px;
              border-top: 1px solid #000;
              padding-top: 6px;
            }
            .qr-container {
              text-align: center;
              margin: 12px 0 8px;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 8px;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="store-name">${escapeHtml(tienda)}</div>
              <div>COMPROBANTE DE VENTA</div>
            </div>
            
            <div class="order-info">
              <div class="info-row">
                <span class="info-label">Pedido:</span>
                <span>#${pedido.id || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span>${fecha}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cliente:</span>
                <span>${escapeHtml(cliente)}</span>
              </div>
              
            </div>
            
            <table class="products-table">
              <thead>
                <tr>
                  <th class="col-name">Producto</th>
                  <th class="col-qty">Cant</th>
                  <th class="col-price">P.Unit</th>
                  <th class="col-sub">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="4" style="text-align:center">No hay productos</td></tr>'}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>S/ ${subtotalCalc.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              ${costoEnvio > 0 ? `
              <div class="total-row">
                <span>Envío:</span>
                <span>S/ ${costoEnvio.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              ${impuestos > 0 ? `
              <div class="total-row">
                <span>Impuestos:</span>
                <span>S/ ${impuestos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="total-row final-total">
                <span>TOTAL:</span>
                <span>S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            <div class="qr-container">
              <canvas id="qr"></canvas>
              <div style="font-size:10px; margin-top:4px;">Ref: ${escapeHtml(String(pedido.id || randomSeed))}</div>
            </div>
            
            <div class="footer">
              <div>¡Gracias por su compra!</div>
              <div>${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
          </div>

          <!-- Cargar QRious desde CDN -->
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
          <script>
            try {
              const value = ${JSON.stringify(randomSeed)};
              const canvas = document.getElementById('qr');
              const qrSize = 100;
              canvas.width = qrSize;
              canvas.height = qrSize;
              const qr = new QRious({
                element: canvas,
                value: value,
                size: qrSize,
                level: 'L'
              });
            } catch(e) {
              console.error('Error generando QR:', e);
            }
            
            // Imprimir automáticamente
            setTimeout(() => {
              try {
                window.print();
                setTimeout(() => {
                  window.close();
                }, 500);
              } catch(e) {
                console.error('Error al imprimir:', e);
              }
            }, 500);
          </script>
        </body>
        </html>
      `

      const w = window.open('', '_blank', 'width=400,height=700')
      if (!w) {
        alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de pop-ups.')
        return
      }
      
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      
    } catch (err) {
      console.error('Error al generar comprobante:', err)
      alert('Error al generar comprobante: ' + err.message)
    }
  }

  // escape simple para texto dentro de HTML
  const escapeHtml = (str) => {
    if (!str && str !== 0) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
  
  return (
    <div className="order-detail">
      <div className="order-detail-header">
        <div className="header-left">
          <h2 className="order-title">Pedido #{pedido.id}</h2>
          <div className="order-user">{pedido.usuario}</div>
        </div>
        <div className="header-right">
          <div className="order-date">
            {formatDatePeru(pedido.fecha)}
          </div>
          <div className="order-status">
            <span 
              className="status-badge" 
              style={{ backgroundColor: estadosPedido[pedido.estado]?.color || '#ccc' }}
            >
              {estadosPedido[pedido.estado]?.label || pedido.estado}
            </span>
          </div>
          <div className="order-actions">
            <form onSubmit={handleCambiarEstado} className="status-change-form">
              <select 
                value={nuevoEstado}
                onChange={e=>setNuevoEstado(e.target.value)}
                className="status-select"
              >
                <option value="pendiente">Pendiente</option>
                <option value="procesando">Procesando</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button 
                className="update-status-btn" 
                type="submit" 
                disabled={cambiando}
              >
                {cambiando ? 'Guardando...' : 'Cambiar'}
              </button>
            </form>
            {errorCambio && <div className="error-message">{errorCambio}</div>}
          </div>
        </div>
      </div>

      <div className="detail-cards">
        <div className="detail-card products-card">
          <h3 className="card-title">Productos</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Nombre</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(pedido.raw?.detalles || []).map((d, i) => {
                const prod = d.producto || {};
                const cantidad = d.cantidad ?? 1;
                const precio = Number(d.precioUnitario ?? d.precio ?? prod.precio ?? 0);
                const subtotalLinea = cantidad * precio;
                return (
                  <tr key={i}>
                    <td className="product-image">
                      {prod.imagenUrl ? (
                        <img 
                          src={prod.imagenUrl} 
                          alt={prod.nombre || prod.name} 
                          className="product-thumbnail"
                        />
                      ) : (
                        <div className="product-thumbnail-placeholder" />
                      )}
                    </td>
                    <td className="product-name">{prod.nombre || d.nombre || prod.productoNombre || 'Producto sin nombre'}</td>
                    <td className="product-quantity">{cantidad}</td>
                    <td className="product-price">S/ {precio.toLocaleString('es-PE')}</td>
                    <td className="product-subtotal">S/ {subtotalLinea.toLocaleString('es-PE')}</td>
                  </tr>
                );
              })}
              {!pedido.raw?.detalles || pedido.raw.detalles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No hay detalles disponibles para este pedido</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="detail-info-row">
          <div className="detail-card shipping-card">
            <h3 className="card-title">Dirección de envío</h3>
              {loadingDireccion ? (
                <div className="address-loading">
                  <p>Cargando dirección...</p>
                </div>
              ) : direccion ? (
                typeof direccion === 'object' && direccion.raw ? (
                  <div className="address-info">
                    <p>{direccion.raw}</p>
                  </div>
                ) : (typeof direccion === 'object' ? (
                  <div className="address-info">
                    <p>{direccion.calle || direccion.callePrincipal || direccion.direccion || ''}</p>
                    {(direccion.colonia || direccion.barrio) && (
                      <p>{direccion.colonia || direccion.barrio}</p>
                    )}
                    <p>{(direccion.ciudad || direccion.city || '') + 
                       (direccion.estado || direccion.provincia ? ', ' + 
                       (direccion.estado || direccion.provincia) : '')}</p>
                    {(direccion.codigoPostal || direccion.cp) && (
                      <p>CP: {direccion.codigoPostal || direccion.cp}</p>
                    )}
                    {direccion.usuarioId && (
                      <div className="address-meta">
                        <span className="address-label">ID Usuario:</span>
                        <span className="address-value">{direccion.usuarioId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="address-info">
                    <p>{String(direccion)}</p>
                  </div>
                ))
              ) : (
                <p className="no-data">No hay dirección registrada</p>
              )}
          </div>
          
          <div className="detail-card tracking-card">
            <h3 className="card-title">Información</h3>
            <div className="tracking-info">
              <div className="info-row">
                <span className="info-label">Tracking:</span>
                <span className="info-value">{pedido.raw?.numeroSeguimiento || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">ID Pedido:</span>
                <span className="info-value">{pedido.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">UsuarioId:</span>
                <span className="info-value">{pedido.raw?.usuarioId ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card totals-card">
          <h3 className="card-title">Resumen</h3>
          <div className="totals-content">
            <div className="total-row">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">
                S/ {(Number(pedido.raw?.subtotal) || calculateSubtotalFromDetalles(pedido.raw?.detalles)).toLocaleString('es-PE')}
              </span>
            </div>
            <div className="total-row">
              <span className="total-label">Costo envío:</span>
              <span className="total-value">
                S/ {(Number(pedido.raw?.costoEnvio) || 0).toLocaleString('es-PE')}
              </span>
            </div>
            <div className="total-row">
              <span className="total-label">Impuestos:</span>
              <span className="total-value">
                S/ {(Number(pedido.raw?.impuestos) || 0).toLocaleString('es-PE')}
              </span>
            </div>
            <div className="total-row final-total">
              <span className="total-label">Total:</span>
              <span className="total-value">
                S/ {(Number(pedido.raw?.total) || 0).toLocaleString('es-PE')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="order-detail-footer">
        <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
          <button className="print-shipping-btn" onClick={handlePrintShipping}>
            🖨️ Imprimir detalles del envío
          </button>
          <button className="print-ticket-btn" onClick={handlePrintComprobante}>
            🧾 Imprimir comprobante
          </button>
          <button className="back-button" onClick={onClose}>
            <span className="back-icon">←</span>
            Volver a la lista de pedidos
          </button>
        </div>
      </div>
    </div>
  );
}