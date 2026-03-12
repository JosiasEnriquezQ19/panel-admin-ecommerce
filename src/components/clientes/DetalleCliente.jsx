import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/api'

/* ── SVG Icons ── */
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.8.33 1.58.59 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.76.26 1.54.46 2.34.59A2 2 0 0 1 22 16.92z" /></svg>
);
const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
);
const MapPinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const ShoppingBagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default function DetalleCliente({ cliente }) {
  const [direcciones, setDirecciones] = useState([])
  const [pedidosValidos, setPedidosValidos] = useState(0)
  const [loadingDirecciones, setLoadingDirecciones] = useState(false)

  useEffect(() => {
    if (cliente && (cliente.usuarioId || cliente.id)) {
      const uId = cliente.usuarioId || cliente.id
      fetchDirecciones(uId)
      fetchPedidosCount(uId)
    }
  }, [cliente])

  const fetchPedidosCount = async (usuarioId) => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE}/Pedidos/usuario/${usuarioId}`, { headers })
      if (res.ok) {
        const data = await res.json()
        const pedidos = Array.isArray(data) ? data : []
        // Filtrar solo pedidos: procesando, enviado o entregado
        const validos = pedidos.filter(p => 
          ['procesando', 'enviado', 'entregado'].includes(p.estado?.toLowerCase())
        ).length
        setPedidosValidos(validos)
      }
    } catch (err) {
      console.error('Error al cargar pedidos del cliente', err)
    }
  }

  const fetchDirecciones = async (usuarioId) => {
    setLoadingDirecciones(true)
    try {
      const res = await fetch(`${API_BASE}/Direcciones/usuario/${usuarioId}`)
      if (res.ok) {
        const data = await res.json()
        setDirecciones(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error al cargar direcciones', err)
    } finally {
      setLoadingDirecciones(false)
    }
  }

  const formatDireccion = (d) => {
    return [
      d.calle || d.callePrincipal || d.direccion,
      d.colonia || d.barrio,
      d.ciudad || d.city,
      d.codigoPostal ? `CP ${d.codigoPostal}` : null
    ].filter(Boolean).join(', ')
  }

  if (!cliente) return null;

  const nombre = cliente.nombre || '';
  const apellido = cliente.apellido || '';
  const email = cliente.email || '';
  const telefono = cliente.telefono || '';
  const id = cliente.usuarioId || cliente.id || '';
  const estado = (cliente.estado === 'inactivo' || cliente.estado === false) ? 'inactivo' : 'activo';
  const avatarUrl = cliente.profilePictureUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre + ' ' + apellido)}&background=E8573D&color=fff&size=200`;
  const fechaRegistro = cliente.fechaCreacion
    ? new Date(cliente.fechaCreacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No disponible';
  const ultimaActividad = cliente.fechaActualizacion
    ? new Date(cliente.fechaActualizacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Reciente';

  /* ── Estilos reutilizables ── */
  const infoRow = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f2',
  };
  const iconWrap = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: 'rgba(232, 87, 61, 0.08)',
    color: 'var(--accent)',
    flexShrink: 0,
  };
  const labelStyle = {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '2px',
  };
  const valueStyle = {
    color: 'var(--text-main)',
    fontWeight: 500,
    fontSize: '0.95rem',
  };

  return (
    <div>
      {/* Perfil principal */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={avatarUrl}
            alt={nombre}
            style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          <div style={{
            position: 'absolute', bottom: '-3px', right: '-3px',
            width: '18px', height: '18px',
            backgroundColor: estado === 'activo' ? 'var(--success)' : 'var(--danger)',
            borderRadius: '50%',
            border: '3px solid #fff',
          }} />
        </div>

        {/* Info principal */}
        <div style={{ flex: 1 }}>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', margin: '0 0 4px', fontWeight: 700 }}>{nombre} {apellido}</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 10px', fontSize: '0.85rem' }}>ID: {id}</p>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '99px',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: estado === 'activo' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
            color: estado === 'activo' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${estado === 'activo' ? 'rgba(52,199,89,0.25)' : 'rgba(255,59,48,0.25)'}`,
          }}>
            {estado === 'activo' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Información de contacto */}
      <div style={{ background: '#fafafa', borderRadius: '14px', padding: '4px 20px', marginBottom: '20px', border: '1px solid #f0f0f2' }}>
        <div style={infoRow}>
          <div style={iconWrap}><MailIcon /></div>
          <div>
            <div style={labelStyle}>Correo electrónico</div>
            <div style={valueStyle}>{email || 'No registrado'}</div>
          </div>
        </div>
        <div style={infoRow}>
          <div style={iconWrap}><PhoneIcon /></div>
          <div>
            <div style={labelStyle}>Teléfono</div>
            <div style={valueStyle}>{telefono || 'No registrado'}</div>
          </div>
        </div>
        <div style={{ ...infoRow, borderBottom: 'none' }}>
          <div style={iconWrap}><CalendarIcon /></div>
          <div>
            <div style={labelStyle}>Miembro desde</div>
            <div style={valueStyle}>{fechaRegistro}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: <ShoppingBagIcon />, label: 'Ventas Realizadas', val: pedidosValidos },
          { icon: <ClockIcon />, label: 'Última actividad', val: ultimaActividad },
          { icon: <UserIcon />, label: 'Tipo de cuenta', val: 'Cliente' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#fafafa',
            borderRadius: '14px',
            padding: '16px',
            border: '1px solid #f0f0f2',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ ...iconWrap, width: '30px', height: '30px' }}>{stat.icon}</div>
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>{stat.val}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Direcciones */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={iconWrap}><MapPinIcon /></div>
          <h4 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1rem', fontWeight: 600 }}>Direcciones de envío</h4>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {direcciones.length} registrada{direcciones.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingDirecciones ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Cargando...</p>
        ) : direcciones.length === 0 ? (
          <div style={{
            padding: '28px', textAlign: 'center',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px dashed #e0e0e5',
          }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              Este cliente no tiene direcciones registradas.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {direcciones.map((dir, idx) => (
              <div key={idx} style={{
                background: '#fafafa',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #f0f0f2',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-main)' }}>
                  <MapPinIcon />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Dirección {idx + 1}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                  {formatDireccion(dir)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
