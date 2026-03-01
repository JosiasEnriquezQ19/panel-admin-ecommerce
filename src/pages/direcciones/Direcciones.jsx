import React, { useState } from 'react'
import ListaDirecciones from '../../components/direcciones/ListaDirecciones'

import { API_BASE } from '../../utils/api'

export default function Direcciones() {
  const [usuarioId, setUsuarioId] = useState('')
  const [direcciones, setDirecciones] = useState([])
  const [usuarioInfo, setUsuarioInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPorUsuario = async () => {
    if (!usuarioId) { setError('Ingresa un usuarioId'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${API_BASE}/Direcciones/usuario/${encodeURIComponent(usuarioId)}`)
      if (!res.ok) throw new Error('Error al obtener direcciones')
      const data = await res.json()
      setDirecciones(data)
      try {
        const ures = await fetch(`${API_BASE}/Usuarios/${usuarioId}`)
        if (ures.ok) setUsuarioInfo(await ures.json())
        else setUsuarioInfo(null)
      } catch (e) { setUsuarioInfo(null) }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Está seguro que desea eliminar esta dirección?')) return
    try {
      const res = await fetch(`${API_BASE}/Direcciones/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar dirección')
      setDirecciones(direcciones.filter(d => d.direccionId !== id && d.direccionId !== Number(id)))
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="direcciones-page" style={{ padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header className="page-header" style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '600', color: 'white', margin: 0 }}>Gestión de Direcciones</h2>
        </header>

        {error && <div className="alert-error" style={{ marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>}

        <div className="busqueda-usuario" style={{ background: '#1e1e2d', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '1.1rem' }}>Buscar por Usuario</h3>
          <div className="form-busqueda" style={{ display: 'flex', gap: '12px' }}>
            <input
              placeholder="Ingresa el ID del usuario (ej. 1)"
              value={usuarioId}
              onChange={e => setUsuarioId(e.target.value)}
              className="input-usuario"
              style={{ flex: 1, background: '#151521', border: '1px solid var(--border-light)', color: 'white', padding: '12px 16px', borderRadius: '10px', fontSize: '1rem' }}
            />
            <button
              className="btn-primary"
              onClick={fetchPorUsuario}
              disabled={loading}
              style={{ padding: '0 24px', whiteSpace: 'nowrap' }}
            >
              {loading ? '⏳ Buscando...' : '🔍 Buscar'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => { setUsuarioId(''); setDirecciones([]); setError(null); setUsuarioInfo(null) }}
              style={{ padding: '0 20px' }}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="direcciones-container">
          {loading ? (
            <div className="loading-container" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div className="spinner-sm"></div>
              <p>Cargando direcciones...</p>
            </div>
          ) : (
            <ListaDirecciones
              direcciones={direcciones}
              usuarioInfo={usuarioInfo}
              onEliminar={handleEliminar}
            />
          )}
        </div>
      </div>
    </div>
  )
}
