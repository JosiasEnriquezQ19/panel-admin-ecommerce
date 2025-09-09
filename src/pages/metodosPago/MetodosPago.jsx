import React, { useState } from 'react'
import ListaMetodosPago from '../../components/metodosPago/ListaMetodosPago'

import { API_BASE } from '../../utils/api'

export default function MetodosPago(){
  const [usuarioId, setUsuarioId] = useState('')
  const [metodos, setMetodos] = useState([])
  const [usuarioInfo, setUsuarioInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPorUsuario = async () => {
    if (!usuarioId) {
      setError('Ingresa un usuarioId')
      return
    }
    setLoading(true)
    setError(null)
    try{
      const res = await fetch(`${API_BASE}/MetodosPago/usuario/${usuarioId}`)
      if(!res.ok) throw new Error('Error al obtener métodos de pago')
      const data = await res.json()
      setMetodos(data)
      // intentar cargar datos del usuario
      try{
        const ures = await fetch(`${API_BASE}/Usuarios/${usuarioId}`)
        if (ures.ok) setUsuarioInfo(await ures.json())
        else setUsuarioInfo(null)
      }catch(e){ setUsuarioInfo(null) }
    }catch(err){ setError(err.message) }
    setLoading(false)
  }

  const handleEliminar = async (id) => {
    if(!confirm('¿Está seguro que desea eliminar este método de pago?')) return
    try{
      const res = await fetch(`${API_BASE}/MetodosPago/${id}`, { method: 'DELETE' })
      if(!res.ok) throw new Error('Error al eliminar método de pago')
      setMetodos(metodos.filter(m => m.metodoPagoId !== id && m.metodoPagoId !== Number(id)))
    }catch(err){ setError(err.message) }
  }

  return (
    <div className="metodos-pago-page">
      <h2 className="page-title">Métodos de Pago por Usuario</h2>
      
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
            onClick={fetchPorUsuario} 
            className="btn-primario"
            disabled={loading}
          >
            {loading ? 'Buscando...' : 'Buscar Métodos'}
          </button>
          <button 
            onClick={()=>{ setUsuarioId(''); setMetodos([]); setError(null); setUsuarioInfo(null) }} 
            className="btn-secundario"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="metodos-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando métodos de pago...</p>
          </div>
        ) : (
          <ListaMetodosPago 
            metodos={metodos} 
            usuarioInfo={usuarioInfo} 
            onEliminar={handleEliminar} 
          />
        )}
      </div>
    </div>
  )
}
