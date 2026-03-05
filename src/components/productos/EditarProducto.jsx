import React, { useState, useEffect } from 'react'
import { API_BASE } from '../../utils/api'

export default function EditarProducto({ producto, onProductoActualizado, onCancelar, onError }) {
  const [form, setForm] = useState({
    nombre: '',
    precio: 0,
    descripcion: '',
    categoriaId: '',
    stock: 0,
    imagenUrl: '',
    estado: 'disponible'
  })
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => { fetchCategorias() }, [])

  const fetchCategorias = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch(`${API_BASE}/Categorias?estado=activo`)
      if (res.ok) setCategorias(await res.json())
    } catch (err) { console.error('Error loading categories', err) }
    finally { setLoadingCategories(false) }
  }

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre || producto.nombreProducto || producto.name || '',
        precio: producto.precio || producto.price || 0,
        estado: (producto.estado === 'activo' ? 'disponible' : (producto.estado === 'inactivo' ? 'oculto' : producto.estado)) || 'disponible',
        descripcion: producto.descripcion || producto.description || '',
        categoriaId: producto.categoriaId || '',
        stock: producto.stock || producto.inventario || 0,
        imagenUrl: producto.imagenUrl || ''
      })
      const imageCols = [producto.imagenUrl, producto.imagenUrl2, producto.imagenUrl3, producto.imagenUrl4, producto.imagenUrl5, producto.imagenUrl6, producto.imagenUrl7]
      setImages(imageCols.filter(Boolean).map((url, idx) => ({ url, esPrincipal: idx === 0 })))
    }
  }, [producto])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'number' ? Number(value) : value })
  }

  const addImage = () => {
    const url = (newImageUrl || '').trim()
    if (!url) return
    setImages(prev => [...prev, { url, esPrincipal: prev.length === 0 }])
    setNewImageUrl('')
  }

  const removeImage = (index) => {
    setImages(prev => {
      const copy = [...prev]
      const removed = copy.splice(index, 1)[0]
      if (removed?.productoImagenId) setDeletedImageIds(d => [...d, removed.productoImagenId])
      if (!copy.some(i => i.esPrincipal) && copy.length > 0) copy[0].esPrincipal = true
      return copy
    })
  }

  const markAsPrincipal = (index) => {
    setImages(prev => prev.map((im, i) => ({ ...im, esPrincipal: i === index })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = producto?.productoId || producto?.id
    if (!id) { if (onError) onError('No se pudo identificar el producto'); return }

    setLoading(true)
    try {
      const payload = {
        productoId: id,
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio) || 0,
        stock: Number(form.stock) || 0,
        categoriaId: form.categoriaId || null,
        estado: form.estado || 'disponible'
      }

      const imageFields = ['imagenUrl', 'imagenUrl2', 'imagenUrl3', 'imagenUrl4', 'imagenUrl5', 'imagenUrl6', 'imagenUrl7']
      const principalImage = images.find(img => img.esPrincipal)
      const otherImages = images.filter(img => !img.esPrincipal)
      const orderedImages = principalImage ? [principalImage, ...otherImages] : otherImages
      const imageValues = orderedImages.map(i => i.url).filter(Boolean)
      for (let i = 0; i < imageFields.length; i++) {
        payload[imageFields[i]] = imageValues[i] || ''
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/Productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Error al actualizar el producto')
      }

      if (onProductoActualizado) onProductoActualizado()
    } catch (err) {
      if (onError) onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Estilos del formulario (tema claro) ── */
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#fafafa',
    border: '1px solid #e8e8ed',
    borderRadius: '10px',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginBottom: '8px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Row: Nombre + Precio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Nombre del producto</label>
          <input name="nombre" type="text" value={form.nombre} onChange={handleChange} required style={inputStyle} placeholder="Nombre" />
        </div>
        <div>
          <label style={labelStyle}>Precio (S/.)</label>
          <input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required style={inputStyle} />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label style={labelStyle}>Descripción</label>
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows="3"
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Describe el producto..."
        />
      </div>

      {/* Row: Categoría + Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Categoría</label>
          <select name="categoriaId" value={form.categoriaId || ''} onChange={handleChange} disabled={loadingCategories} style={inputStyle}>
            <option value="">Seleccione categoría</option>
            {categorias.map(cat => (
              <option key={cat.categoriaId} value={cat.categoriaId}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Stock disponible</label>
          <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      {/* Estado */}
      <div>
        <label style={labelStyle}>Estado del producto</label>
        <select name="estado" value={form.estado} onChange={handleChange} style={inputStyle}>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
          <option value="descontinuado">Descontinuado</option>
          <option value="oculto">Oculto</option>
        </select>
      </div>

      {/* Imágenes */}
      <div>
        <label style={labelStyle}>Imágenes del producto</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="URL de imagen"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="button" onClick={addImage} style={{
            padding: '10px 20px',
            background: 'var(--text-main)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: '0.9rem',
          }}>
            + Agregar
          </button>
        </div>

        {images.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>Sin imágenes agregadas.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
            {images.map((im, idx) => (
              <div key={idx} style={{
                background: '#fafafa',
                padding: '10px',
                borderRadius: '12px',
                border: im.esPrincipal ? '2px solid var(--accent)' : '1px solid #e8e8ed',
              }}>
                <img src={im.url} alt="preview" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="principal-edit" checked={!!im.esPrincipal} onChange={() => markAsPrincipal(idx)} /> Principal
                  </label>
                  <button type="button" onClick={() => removeImage(idx)} style={{
                    background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.9rem'
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e8e8ed' }}>
        <button type="button" onClick={onCancelar} disabled={loading} style={{
          padding: '12px 24px',
          background: '#fff',
          color: 'var(--text-muted)',
          border: '1px solid #e8e8ed',
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading} style={{
          padding: '12px 28px',
          background: 'var(--text-main)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
