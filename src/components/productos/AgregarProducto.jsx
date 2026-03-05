import React, { useState } from 'react'
import { API_BASE } from '../../utils/api'

export default function AgregarProducto({ onProductoCreado, onCancelar, onError }) {
  const [form, setForm] = useState({
    nombre: '',
    precio: 0,
    precioAntes: 0,
    estado: 'disponible',
    descripcion: '',
    categoriaId: '',
    imagenUrl: '',
    stock: 0,
    marca: ''
  })
  const [imagenes, setImagenes] = useState([{ url: '', esPrincipal: true }])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  React.useEffect(() => { fetchCategorias() }, [])

  const fetchCategorias = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch(`${API_BASE}/Categorias?estado=activo`)
      if (res.ok) setCategorias(await res.json())
    } catch (err) { console.error('Error loading categories', err) }
    finally { setLoadingCategories(false) }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'number' ? Number(value) : value })
  }

  const addImage = () => {
    const url = (newImageUrl || '').trim()
    if (!url || imagenes.length >= 7) return
    setImagenes(prev => [...prev, { url, esPrincipal: prev.length === 0 }])
    setNewImageUrl('')
  }

  const removeImage = (index) => {
    if (imagenes.length <= 1) return
    setImagenes(prev => {
      const copy = prev.filter((_, i) => i !== index)
      if (!copy.some(i => i.esPrincipal) && copy.length > 0) copy[0].esPrincipal = true
      return copy
    })
  }

  const markAsPrincipal = (index) => {
    setImagenes(prev => prev.map((im, i) => ({ ...im, esPrincipal: i === index })))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const imagenesValidas = imagenes.filter(im => im.url.trim())
    if (imagenesValidas.length === 0) {
      if (onError) onError('Se requiere al menos una imagen para el producto')
      return
    }

    setLoading(true)
    try {
      const principalImage = imagenesValidas.find(im => im.esPrincipal) || imagenesValidas[0]
      const otherImages = imagenesValidas.filter(im => !im.esPrincipal)
      const ordered = [principalImage, ...otherImages].map(im => im.url)

      const imageFields = ['imagenUrl', 'imagenUrl2', 'imagenUrl3', 'imagenUrl4', 'imagenUrl5', 'imagenUrl6', 'imagenUrl7']
      const payload = {
        ...form,
        precio: Number(form.precio) || 0,
        precioAntes: Number(form.precioAntes) > 0 ? Number(form.precioAntes) : null,
        stock: Number(form.stock) || 0,
        categoriaId: form.categoriaId || null,
      }
      imageFields.forEach((field, i) => { payload[field] = ordered[i] || null })

      const res = await fetch(`${API_BASE}/Productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Error al crear el producto')
      }

      if (onProductoCreado) onProductoCreado()
    } catch (err) {
      if (onError) onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Shared styles (same as EditarProducto) ── */
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

      {/* Row: Nombre + Precio oferta + Precio antes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Nombre del producto</label>
          <input name="nombre" type="text" value={form.nombre} onChange={handleChange} required style={inputStyle} placeholder="Nombre del producto" />
        </div>
        <div>
          <label style={labelStyle}>Precio Oferta (S/.)</label>
          <input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={handleChange} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Precio Antes (Opcional)</label>
          <input name="precioAntes" type="number" min="0" step="0.01" value={form.precioAntes || ''} onChange={handleChange} style={inputStyle} placeholder="Ej: 99.90" />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Marca</label>
          <input name="marca" type="text" value={form.marca} onChange={handleChange} style={inputStyle} placeholder="Ej: Nike, Sony..." />
        </div>
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
        <label style={labelStyle}>
          Imágenes del producto
          <span style={{ marginLeft: 8, fontSize: '0.78rem', color: '#b0b0bd', fontWeight: 400 }}>{imagenes.filter(i => i.url).length}/7</span>
        </label>

        {/* Input añadir imagen */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Pega aquí la URL de la imagen"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={addImage}
            disabled={!newImageUrl.trim() || imagenes.length >= 7}
            style={{
              padding: '10px 20px',
              background: 'var(--text-main)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '0.9rem',
              opacity: (!newImageUrl.trim() || imagenes.length >= 7) ? 0.5 : 1,
            }}
          >
            + Agregar
          </button>
        </div>

        {/* Grid de imágenes */}
        {imagenes.filter(im => im.url).length === 0 ? (
          <div style={{
            border: '2px dashed #e8e8ed',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <p style={{ margin: 0 }}>Sin imágenes. Agrega al menos una URL de imagen.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
            {imagenes.map((im, idx) => im.url ? (
              <div key={idx} style={{
                background: '#fafafa',
                padding: '10px',
                borderRadius: '12px',
                border: im.esPrincipal ? '2px solid var(--text-main)' : '1px solid #e8e8ed',
                position: 'relative',
              }}>
                {im.esPrincipal && (
                  <div style={{
                    position: 'absolute', top: -8, left: 8,
                    background: 'var(--text-main)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: 6, letterSpacing: '0.5px'
                  }}>PRINCIPAL</div>
                )}
                <img src={im.url} alt="preview" style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="radio" name="principal-add" checked={!!im.esPrincipal} onChange={() => markAsPrincipal(idx)} />
                    Principal
                  </label>
                  <button type="button" onClick={() => removeImage(idx)} style={{
                    background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem', padding: '2px 4px'
                  }}>✕</button>
                </div>
              </div>
            ) : null)}
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
          {loading ? 'Creando...' : 'Crear Producto'}
        </button>
      </div>
    </form>
  )
}
