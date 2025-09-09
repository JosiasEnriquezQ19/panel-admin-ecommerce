import React, { useState, useEffect } from 'react'

import { API_BASE } from '../../utils/api'

export default function FormCliente({ initial, onSaved, onCancel, onError }){
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', estado: 'activo' })
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ if(initial) setForm({
    nombre: initial.nombre || '',
    apellido: initial.apellido || '',
    email: initial.email || '',
    telefono: initial.telefono || '',
    estado: initial.estado || 'activo'
  }) }, [initial])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try{
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      let res
      if (initial && initial.usuarioId) {
        // actualizar
        res = await fetch(`${API_BASE}/Usuarios/${initial.usuarioId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(form)
        })
        if (!res.ok) throw new Error('Error al actualizar el usuario')
      } else {
        // crear
        res = await fetch(`${API_BASE}/Usuarios`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...form, password: form.password || 'changeme123' })
        })
        if (!res.ok) {
          const body = await res.json().catch(()=>null)
          throw new Error(body?.message || 'Error al crear usuario')
        }
      }

      if (onSaved) onSaved()
    } catch(err){ if(onError) onError(err.message) }
    finally{ setLoading(false) }
  }

  return (
    <div className="form-cliente card">
      <h4>{initial ? 'Editar Cliente' : 'Crear Cliente'}</h4>
      <form onSubmit={handleSubmit} className="cliente-form">
        <label>Nombre</label>
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
        <label>Apellido</label>
        <input name="apellido" value={form.apellido} onChange={handleChange} required />
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
        <label>Teléfono</label>
        <input name="telefono" value={form.telefono} onChange={handleChange} />
        <label>Estado</label>
        <select name="estado" value={form.estado} onChange={handleChange}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>

        <div className="form-actions">
          <button type="submit" className="btn-primario" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn-secundario" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
