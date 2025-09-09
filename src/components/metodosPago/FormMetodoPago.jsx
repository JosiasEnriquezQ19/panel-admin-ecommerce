import React, { useState } from 'react'

import { API_BASE } from '../../utils/api'

export default function FormMetodoPago({ usuarioId, onCreado, onError }){
  const [form, setForm] = useState({ usuarioId: usuarioId || '', tipoTarjeta: 'VISA', ultimosCuatroDigitos: '', mesExpiracion:'', añoExpiracion:'', esPrincipal:false })
  const [loading, setLoading] = useState(false)

  React.useEffect(()=>{
    setForm(f => ({ ...f, usuarioId: usuarioId || '' }))
  }, [usuarioId])

  const handleChange = (e)=>{
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e)=>{
    e.preventDefault()
    if (!form.usuarioId) return onError && onError('UsuarioId requerido')
    setLoading(true)
    try{
      const res = await fetch(`${API_BASE}/MetodosPago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if(!res.ok) throw new Error('Error al crear método de pago')
      const data = await res.json()
      setForm({ usuarioId: usuarioId || '', tipoTarjeta: 'VISA', ultimosCuatroDigitos: '', mesExpiracion:'', añoExpiracion:'', esPrincipal:false })
      if(onCreado) onCreado(data)
    }catch(err){ if(onError) onError(err.message) }
    setLoading(false)
  }

  return (
    <div className="form-metodo-pago card">
      <div className="card-body">
        <h4>Agregar Método de Pago</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-grupo">
            <label>UsuarioId</label>
            <input name="usuarioId" value={form.usuarioId} onChange={handleChange} />
          </div>

          <div className="form-grupo">
            <label>Tipo Tarjeta</label>
            <select name="tipoTarjeta" value={form.tipoTarjeta} onChange={handleChange}>
              <option>VISA</option>
              <option>MASTERCARD</option>
              <option>AMEX</option>
            </select>
          </div>

          <div className="form-grupo">
            <label>Últimos 4 dígitos</label>
            <input name="ultimosCuatroDigitos" value={form.ultimosCuatroDigitos} onChange={handleChange} maxLength={4} />
          </div>

          <div className="form-grupo">
            <label>Mes Expiración</label>
            <input name="mesExpiracion" value={form.mesExpiracion} onChange={handleChange} />
          </div>

          <div className="form-grupo">
            <label>Año Expiración</label>
            <input name="añoExpiracion" value={form.añoExpiracion} onChange={handleChange} />
          </div>

          <div className="form-grupo">
            <label>
              <input type="checkbox" name="esPrincipal" checked={form.esPrincipal} onChange={handleChange} /> Es principal
            </label>
          </div>

          <div className="form-actions">
            <button className="btn-primario" disabled={loading}>{loading ? 'Guardando...' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
