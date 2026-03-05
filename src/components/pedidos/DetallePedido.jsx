import React, { useState, useEffect } from 'react';
import { formatDatePeru } from '../../utils/dateUtils';
import { API_BASE } from '../../utils/api';

const estadosPedido = {
  'pendiente': { bg: '#fef2f2', color: '#ef4444', border: 'rgba(239,68,68,0.25)', label: 'Pendiente' },
  'procesando': { bg: '#fff7ed', color: '#f97316', border: 'rgba(249,115,22,0.25)', label: 'Procesando' },
  'enviado': { bg: '#f0fdf4', color: '#22c55e', border: 'rgba(34,197,94,0.25)', label: 'Enviado' },
  'entregado': { bg: '#f0fdf4', color: '#16a34a', border: 'rgba(22,163,74,0.25)', label: 'Entregado' },
  'cancelado': { bg: '#f3f4f6', color: '#6b7280', border: 'rgba(107,114,128,0.25)', label: 'Cancelado' }
};

/* ── SVG Icons ── */
const PrinterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
);
const PackageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);

export default function DetallePedido({ pedido, onClose, onCambiarEstado }) {
  if (!pedido) return null;

  const [nuevoEstado, setNuevoEstado] = useState(pedido.estado || 'pendiente')
  const [cambiando, setCambiando] = useState(false)
  const [errorCambio, setErrorCambio] = useState(null)
  const [successCambio, setSuccessCambio] = useState(false)
  const [direccion, setDireccion] = useState(null)
  const [loadingDireccion, setLoadingDireccion] = useState(false)

  useEffect(() => { setNuevoEstado(pedido.estado || 'pendiente') }, [pedido.estado])

  const handleCambiarEstado = async (e) => {
    e.preventDefault()
    setErrorCambio(null)
    setSuccessCambio(false)
    if (!nuevoEstado || nuevoEstado === pedido.estado) return
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return
    try {
      setCambiando(true)
      await onCambiarEstado(pedido.id, nuevoEstado)
      setSuccessCambio(true)
      setTimeout(() => setSuccessCambio(false), 3000)
    } catch (err) {
      setErrorCambio(err?.message || 'Error al cambiar estado')
    } finally {
      setCambiando(false)
    }
  }

  useEffect(() => {
    const obtenerDireccion = async () => {
      const candidato = pedido.raw?.direccion || pedido.usuarioObj?.direccion || pedido.direccion
      if (candidato) {
        setDireccion(typeof candidato === 'string' ? { raw: candidato } : candidato)
        return
      }
      const uid = pedido.raw?.usuarioId || pedido.usuarioObj?.usuarioId || pedido.usuarioObj?.id
      if (uid) {
        setLoadingDireccion(true)
        try {
          const res = await fetch(`${API_BASE}/Direcciones/usuario/${uid}`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) setDireccion(data[0])
          }
        } catch (e) { console.error(e) }
        finally { setLoadingDireccion(false) }
      }
    }
    obtenerDireccion()
  }, [pedido])

  const calculateSubtotal = (detalles) => {
    if (!Array.isArray(detalles)) return 0;
    return detalles.reduce((sum, d) => {
      return sum + ((d.cantidad ?? 1) * Number(d.precioUnitario ?? d.precio ?? d.producto?.precio ?? 0));
    }, 0);
  }

  const formatDireccion = (d) => {
    if (!d) return null
    if (d.raw) return d.raw
    return [d.calle || d.callePrincipal || d.direccion, d.colonia || d.barrio, d.ciudad || d.city, d.codigoPostal ? `CP ${d.codigoPostal}` : null].filter(Boolean).join(', ')
  }

  const escapeHtml = (str) => {
    if (!str && str !== 0) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  }

  const handlePrintShipping = () => {
    try {
      const recipient = pedido.usuario || pedido.raw?.cliente || 'Cliente'
      const phone = pedido.raw?.telefono || (direccion && (direccion.telefono || direccion.phone)) || pedido.raw?.usuario?.telefono || '-'
      const address = formatDireccion(direccion) || pedido.raw?.direccion || pedido.raw?.direccionEntrega || '-'
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Etiqueta de Envío</title><style>@page{size:auto;margin:4mm}body{font-family:Arial,sans-serif;padding:4px;color:#000;margin:0}.label-box{border:1px solid #222;padding:10px 12px;width:380px;max-width:96%;box-sizing:border-box;display:flex;flex-direction:column;gap:6px}.small{font-size:12px;color:#333}.recipient{font-size:14px;font-weight:700}.address{font-size:16px;font-weight:700;line-height:1.1;word-break:break-word}.tel{font-size:16px;font-weight:700;color:#222}.store-name{font-size:12px;font-weight:700;color:#222}.meta{font-size:12px;color:#444;margin-top:auto;align-self:flex-end}</style></head><body><div class="label-box"><div class="store-name">Tienda +</div><div class="recipient">${escapeHtml(recipient)}</div><div class="address">${escapeHtml(address)}</div>${pedido.raw?.numeroSeguimiento ? `<div class="small">Tracking: ${escapeHtml(pedido.raw.numeroSeguimiento)}</div>` : ''}<div class="tel">Tel: ${escapeHtml(phone)}</div><div class="meta">Pegar esta etiqueta en el paquete</div></div></body></html>`
      const w = window.open('', '_blank', 'width=700,height=900')
      if (!w) { alert('Bloqueador de pop-ups'); return }
      w.document.open(); w.document.write(html); w.document.close(); w.focus()
      setTimeout(() => { try { w.print(); w.close() } catch (e) { } }, 300)
    } catch (e) { alert('Error al imprimir') }
  }

  const handlePrintComprobante = () => {
    try {
      const cliente = pedido.usuario || 'Cliente'
      const fecha = pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE')
      const detalles = pedido.raw?.detalles || []
      const subtotalCalc = calculateSubtotal(detalles)
      const costoEnvio = Number(pedido.raw?.costoEnvio) || 0
      const impuestos = Number(pedido.raw?.impuestos) || 0
      const total = Number(pedido.raw?.total) || (subtotalCalc + costoEnvio + impuestos)
      const rows = detalles.map(d => {
        const prod = d.producto || {}; const cant = d.cantidad ?? 1; const precio = Number(d.precioUnitario ?? d.precio ?? prod.precio ?? 0)
        return `<tr><td>${escapeHtml(prod.nombre || d.nombre || 'Producto')}</td><td style="text-align:center">${cant}</td><td style="text-align:right">S/${precio.toFixed(2)}</td><td style="text-align:right">S/${(cant * precio).toFixed(2)}</td></tr>`
      }).join('')
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Comprobante</title><style>@page{size:80mm auto;margin:0}*{box-sizing:border-box;font-family:'Courier New',monospace}body{width:80mm;margin:0;padding:4mm;font-size:12px;color:#000}.ticket{width:100%;border:1px solid #000;padding:8px}.header{text-align:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px dashed #000}.store-name{font-weight:bold;font-size:16px;margin-bottom:4px}.info-row{display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px}.info-label{font-weight:bold}table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}th{text-align:left;border-bottom:1px dashed #000;padding:5px 2px;font-weight:bold}td{padding:4px 2px}.totals{margin-top:10px;border-top:1px dashed #000;padding-top:8px}.total-row{display:flex;justify-content:space-between;margin-bottom:4px}.final-total{font-weight:bold;font-size:14px;border-top:1px solid #000;padding-top:6px;margin-top:6px}.footer{text-align:center;font-size:10px;margin-top:10px;border-top:1px dashed #000;padding-top:8px}</style></head><body><div class="ticket"><div class="header"><div class="store-name">Tienda +</div><div>COMPROBANTE DE VENTA</div></div><div><div class="info-row"><span class="info-label">Pedido:</span><span>#${pedido.id || 'N/A'}</span></div><div class="info-row"><span class="info-label">Fecha:</span><span>${fecha}</span></div><div class="info-row"><span class="info-label">Cliente:</span><span>${escapeHtml(cliente)}</span></div></div><table><thead><tr><th>Producto</th><th>Cant</th><th style="text-align:right">P.Unit</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${rows || '<tr><td colspan="4" style="text-align:center">Sin productos</td></tr>'}</tbody></table><div class="totals"><div class="total-row"><span>Subtotal:</span><span>S/ ${subtotalCalc.toFixed(2)}</span></div>${costoEnvio > 0 ? `<div class="total-row"><span>Envío:</span><span>S/ ${costoEnvio.toFixed(2)}</span></div>` : ''}<div class="total-row final-total"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div></div><div class="footer"><div>¡Gracias por su compra!</div></div></div></body></html>`
      const w = window.open('', '_blank', 'width=400,height=700')
      if (!w) { alert('Bloqueador de pop-ups'); return }
      w.document.open(); w.document.write(html); w.document.close(); w.focus()
      setTimeout(() => { try { w.print(); w.close() } catch (e) { } }, 400)
    } catch (e) { alert('Error al imprimir comprobante') }
  }

  const detalles = pedido.raw?.detalles || []
  const subtotalCalc = calculateSubtotal(detalles)
  const costoEnvio = Number(pedido.raw?.costoEnvio) || 0
  const impuestos = Number(pedido.raw?.impuestos) || 0
  const total = Number(pedido.raw?.total) || (subtotalCalc + costoEnvio + impuestos)
  const estadoInfo = estadosPedido[pedido.estado] || estadosPedido['pendiente']

  /* ── Estilos (tema claro del sistema) ── */
  const sectionTitle = { color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '10px' }
  const iconWrap = { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: 'rgba(232,87,61,0.08)', color: 'var(--accent)', flexShrink: 0 }
  const cardStyle = { background: '#fafafa', borderRadius: '14px', border: '1px solid #f0f0f2', padding: '18px' }

  return (
    <div>
      {/* ── Header: Info del pedido + Estado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid #f0f0f2' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>{pedido.usuario}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{formatDatePeru(pedido.fecha)}</span>
            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600,
              background: estadoInfo.bg, color: estadoInfo.color, border: `1px solid ${estadoInfo.border}`,
            }}>
              {estadoInfo.label}
            </span>
          </div>
        </div>

        {/* Cambiar estado */}
        <form onSubmit={handleCambiarEstado} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={nuevoEstado}
            onChange={e => setNuevoEstado(e.target.value)}
            style={{
              padding: '8px 14px', background: '#fafafa', border: '1px solid #e8e8ed',
              borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-main)', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="pendiente">Pendiente</option>
            <option value="procesando">Procesando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button type="submit" disabled={cambiando || nuevoEstado === pedido.estado} style={{
            padding: '8px 18px', background: nuevoEstado === pedido.estado ? '#e8e8ed' : 'var(--text-main)',
            color: nuevoEstado === pedido.estado ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: '10px',
            fontSize: '0.85rem', fontWeight: 600, cursor: nuevoEstado === pedido.estado ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s', opacity: cambiando ? 0.6 : 1,
          }}>
            {cambiando ? 'Guardando...' : 'Actualizar'}
          </button>
        </form>
      </div>

      {successCambio && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#16a34a', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
          Estado actualizado correctamente
        </div>
      )}
      {errorCambio && (
        <div style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
          {errorCambio}
        </div>
      )}

      {/* ── Tabla de Productos (estilo categorías) ── */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={sectionTitle}><span style={iconWrap}><PackageIcon /></span> Productos del pedido</h4>
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8e8ed', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ background: '#fafafa', padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8ed' }}>Producto</th>
                <th style={{ background: '#fafafa', padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8ed' }}>Nombre</th>
                <th style={{ background: '#fafafa', padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8ed' }}>Cant.</th>
                <th style={{ background: '#fafafa', padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8ed' }}>P. Unit.</th>
                <th style={{ background: '#fafafa', padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8e8ed' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detalles.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay productos en este pedido</td></tr>
              ) : detalles.map((d, i) => {
                const prod = d.producto || {};
                const cant = d.cantidad ?? 1;
                const precio = Number(d.precioUnitario ?? d.precio ?? prod.precio ?? 0);
                return (
                  <tr key={i} style={{ borderBottom: i < detalles.length - 1 ? '1px solid #f0f0f2' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      {prod.imagenUrl ? (
                        <img src={prod.imagenUrl} alt="" style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #f0f0f2' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0f0f2' }} />
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-main)', fontWeight: 500, fontSize: '0.92rem' }}>
                      {prod.nombre || d.nombre || 'Producto'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-main)', fontWeight: 500 }}>{cant}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>S/ {precio.toFixed(2)}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>S/ {(cant * precio).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Grid: Dirección + Info + Resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Dirección */}
        <div style={cardStyle}>
          <h4 style={sectionTitle}><span style={iconWrap}><MapPinIcon /></span> Dirección</h4>
          {loadingDireccion ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Cargando...</p>
          ) : direccion ? (
            <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', margin: 0, lineHeight: 1.7 }}>{formatDireccion(direccion)}</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>Sin dirección registrada</p>
          )}
        </div>

        {/* Info */}
        <div style={cardStyle}>
          <h4 style={sectionTitle}><span style={iconWrap}><InfoIcon /></span> Información</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Tracking', val: pedido.raw?.numeroSeguimiento || '-' },
              { label: 'ID Pedido', val: pedido.id },
              { label: 'Usuario ID', val: pedido.raw?.usuarioId ?? '-' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{row.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div style={cardStyle}>
          <h4 style={sectionTitle}><span style={iconWrap}><FileIcon /></span> Resumen</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ color: 'var(--text-main)' }}>S/ {subtotalCalc.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Envío</span>
              <span style={{ color: 'var(--text-main)' }}>S/ {costoEnvio.toFixed(2)}</span>
            </div>
            {impuestos > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Impuestos</span>
                <span style={{ color: 'var(--text-main)' }}>S/ {impuestos.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, paddingTop: '10px', borderTop: '1px solid #e8e8ed', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-main)' }}>Total</span>
              <span style={{ color: 'var(--text-main)' }}>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer: Botones de impresión ── */}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #f0f0f2' }}>
        <button onClick={handlePrintShipping} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          background: '#fff', color: 'var(--text-main)', border: '1px solid #e8e8ed',
          borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
        }}>
          <PrinterIcon /> Imprimir envío
        </button>
        <button onClick={handlePrintComprobante} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
          background: '#fff', color: 'var(--text-main)', border: '1px solid #e8e8ed',
          borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
        }}>
          <FileIcon /> Imprimir comprobante
        </button>
      </div>
    </div>
  );
}