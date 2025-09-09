import React, { useState } from 'react'
import ListaDirecciones from '../../components/direcciones/ListaDirecciones'

import { API_BASE } from '../../utils/api'

export default function Direcciones(){
  const [usuarioId, setUsuarioId] = useState('')
  const [direcciones, setDirecciones] = useState([])
  const [usuarioInfo, setUsuarioInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPorUsuario = async () => {
    if (!usuarioId) { setError('Ingresa un usuarioId'); return }
    setLoading(true); setError(null)
    try{
      const res = await fetch(`${API_BASE}/Direcciones/usuario/${encodeURIComponent(usuarioId)}`)
      if(!res.ok) throw new Error('Error al obtener direcciones')
      const data = await res.json()
      setDirecciones(data)
      try{
        const ures = await fetch(`${API_BASE}/Usuarios/${usuarioId}`)
        if (ures.ok) setUsuarioInfo(await ures.json())
        else setUsuarioInfo(null)
      }catch(e){ setUsuarioInfo(null) }
    }catch(err){ setError(err.message) }
    setLoading(false)
  }

  const handleEliminar = async (id) => {
    if(!confirm('¿Está seguro que desea eliminar esta dirección?')) return
    try{
      const res = await fetch(`${API_BASE}/Direcciones/${id}`, { method: 'DELETE' })
      if(!res.ok) throw new Error('Error al eliminar dirección')
      setDirecciones(direcciones.filter(d => d.direccionId !== id && d.direccionId !== Number(id)))
    }catch(err){ setError(err.message) }
  }

  return (
    <div className="direcciones-page">
      <h2 className="page-title">Direcciones por Usuario</h2>
      
      {error && <div className="alert-error">
        <p>{error}</p>
        <button className="alert-close" onClick={() => setError(null)}>×</button>
      </div>}

      <div className="busqueda-usuario">
        <div className="form-busqueda">
          <input 
            placeholder="Ingresa el ID del usuario" 
            value={usuarioId} 
            onChange={e=>setUsuarioId(e.target.value)}
            className="input-usuario"
          />
          <button 
            className="btn-primario" 
            onClick={fetchPorUsuario}
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar Direcciones'}
          </button>
          <button 
            className="btn-secundario" 
            onClick={()=>{ setUsuarioId(''); setDirecciones([]); setError(null); setUsuarioInfo(null) }}
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="direcciones-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
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
  )
}
