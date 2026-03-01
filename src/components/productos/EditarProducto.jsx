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
  const [images, setImages] = useState([]) // { productoImagenId?, url, esPrincipal }
  const [newImageUrl, setNewImageUrl] = useState('')
  const [deletedImageIds, setDeletedImageIds] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch(`${API_BASE}/Categorias?estado=activo`)
      if (res.ok) {
        const data = await res.json()
        setCategorias(data)
      }
    } catch (err) {
      console.error('Error loading categories', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Cargar datos del producto cuando el componente se monta o cambia el producto
  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre || producto.nombreProducto || producto.name || '',
        precio: producto.precio || producto.price || 0,
        // map possible legacy states to the new enum
        estado: (producto.estado === 'activo' ? 'disponible' : (producto.estado === 'inactivo' ? 'oculto' : producto.estado)) || 'disponible',
        descripcion: producto.descripcion || producto.description || '',
        categoriaId: producto.categoriaId || '', // Try to use ID if available
        stock: producto.stock || producto.inventario || 0,
        imagenUrl: producto.imagenUrl || ''
      })
      // Map product image columns into images array for editing (imagenUrl..imagenUrl7)
      // La primera imagen (imagenUrl) siempre es la principal
      const imageCols = [producto.imagenUrl, producto.imagenUrl2, producto.imagenUrl3, producto.imagenUrl4, producto.imagenUrl5, producto.imagenUrl6, producto.imagenUrl7]
      const mapped = imageCols.filter(Boolean).map((url, idx) => ({ url: url, esPrincipal: idx === 0 }))
      setImages(mapped)
    }
  }, [producto])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    let parsed = value
    if (type === 'number') parsed = Number(value)
    setForm({
      ...form,
      [name]: parsed
    })
  }

  const handleNewImageChange = (e) => setNewImageUrl(e.target.value)

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
      // ensure a principal exists
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
    if (!id) {
      if (onError) onError('No se pudo identificar el producto a editar')
      return
    }

    setLoading(true)

    try {
      // Build payload matching the Productos table schema and include up to 5 image columns
      const payload = {
        productoId: id,
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio) || 0,
        stock: Number(form.stock) || 0,
        categoriaId: form.categoriaId || null,
        estado: form.estado || 'disponible'
      }

      // Map images state into imagenUrl..imagenUrl7, asegurando que la imagen principal siempre esté en imagenUrl
      const imageFields = ['imagenUrl', 'imagenUrl2', 'imagenUrl3', 'imagenUrl4', 'imagenUrl5', 'imagenUrl6', 'imagenUrl7']

      // Encontrar la imagen principal primero
      const principalImage = images.find(img => img.esPrincipal)
      const otherImages = images.filter(img => !img.esPrincipal)

      // Combinar ambas listas, con la principal primero
      const orderedImages = principalImage ? [principalImage, ...otherImages] : otherImages
      const imageValues = orderedImages.map(i => i.url).filter(Boolean)

      // Asignar los valores a los campos en el orden correcto
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

      // Notificar al componente padre sobre la actualización exitosa
      if (onProductoActualizado) onProductoActualizado()
    } catch (err) {
      if (onError) onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-content">
      <h3 className="card-title" style={{ color: 'white' }}>Editar Producto</h3>

      <form onSubmit={handleSubmit} className="producto-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>

        {/* Left Column - Basic Info */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          <div className="form-group">
            <label style={{ color: 'var(--text-muted)' }}>Nombre</label>
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              required
              style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)' }}
            />
          </div>
          <div className="form-group">
            <label style={{ color: 'var(--text-muted)' }}>Precio</label>
            <input
              name="precio"
              type="number"
              min="0"
              step="0.01"
              value={form.precio}
              onChange={handleChange}
              required
              style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)' }}
            />
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: 'var(--text-muted)' }}>Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
            style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)', width: '100%', borderRadius: '10px', padding: '12px' }}
          />
        </div>

        <div className="form-group">
          <label style={{ color: 'var(--text-muted)' }}>Categoría</label>
          <select
            name="categoriaId"
            value={form.categoriaId || ''}
            onChange={handleChange}
            disabled={loadingCategories}
            style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)' }}
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map(cat => (
              <option key={cat.categoriaId} value={cat.categoriaId}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ color: 'var(--text-muted)' }}>Stock</label>
          <input
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleChange}
            style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)' }}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: 'var(--text-muted)' }}>Link de Imagen Principal (URL)</label>
          <input
            name="imagenUrl"
            type="text"
            value={form.imagenUrl}
            onChange={handleChange}
            placeholder="https://..."
            style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)' }}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: 'var(--text-muted)' }}>Gestión de Imágenes</label>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Añadir otra URL de imagen"
              value={newImageUrl}
              onChange={handleNewImageChange}
              style={{ flex: 1, background: '#151521', color: 'white', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px' }}
            />
            <button type="button" onClick={addImage} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              + Agregar
            </button>
          </div>

          {/* Image Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
            {images.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay imágenes adicionales.</div>}

            {images.map((im, idx) => (
              <div key={idx} style={{ background: '#1e1e2d', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <img src={im.url} alt="preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="radio" name="principal-edit" checked={!!im.esPrincipal} onChange={() => markAsPrincipal(idx)} /> Princ.
                  </label>
                  <button type="button" onClick={() => removeImage(idx)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ color: 'var(--text-muted)' }}>Estado</label>
          <select
            name="estado"
            value={form.estado}
            onChange={handleChange}
            style={{ background: '#151521', color: 'white', border: '1px solid var(--border-light)', width: '100%' }}
          >
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
            <option value="descontinuado">Descontinuado</option>
            <option value="oculto">Oculto</option>
          </select>
        </div>

        <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancelar}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
