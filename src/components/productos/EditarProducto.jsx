import React, { useState, useEffect } from 'react'
import { API_BASE } from '../../utils/api'

export default function EditarProducto({ producto, onProductoActualizado, onCancelar, onError }) {
  const [form, setForm] = useState({ 
    nombre: '', 
    precio: 0, 
    descripcion: '', 
    categoria: '',
    stock: 0
  ,
  imagenUrl: '',
  estado: 'disponible'
  })
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([]) // { productoImagenId?, url, esPrincipal }
  const [newImageUrl, setNewImageUrl] = useState('')
  const [deletedImageIds, setDeletedImageIds] = useState([])

  // Cargar datos del producto cuando el componente se monta o cambia el producto
  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre || producto.nombreProducto || producto.name || '',
        precio: producto.precio || producto.price || 0,
  // map possible legacy states to the new enum
  estado: (producto.estado === 'activo' ? 'disponible' : (producto.estado === 'inactivo' ? 'oculto' : producto.estado)) || 'disponible',
        descripcion: producto.descripcion || producto.description || '',
        categoria: producto.categoria || producto.category || '',
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
        categoria: form.categoria || '',
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
    <div className="editar-producto-container">
      <h3>Editar Producto</h3>
      
      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-grupo">
          <label htmlFor="nombre">Nombre:</label>
          <input 
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Nombre del producto"
          />
        </div>
        
        <div className="form-grupo">
          <label htmlFor="precio">Precio:</label>
          <input 
            id="precio"
            name="precio"
            type="number"
            min="0"
            step="0.01"
            value={form.precio}
            onChange={handleChange}
            required
          />
        </div>
        
  <div className="form-grupo full">
          <label htmlFor="descripcion">Descripción:</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
            placeholder="Descripción del producto"
            rows="3"
          />
        </div>
        
        <div className="form-grupo">
          <label htmlFor="categoria">Categoría:</label>
          <input
            id="categoria"
            name="categoria"
            type="text"
            value={form.categoria}
            onChange={handleChange}
            placeholder="Categoría"
          />
        </div>
        
        <div className="form-grupo">
          <label htmlFor="stock">Stock:</label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-grupo full">
          <label htmlFor="imagenUrl">Imagen (URL):</label>
          <input
            id="imagenUrl"
            name="imagenUrl"
            type="text"
            value={form.imagenUrl}
            onChange={handleChange}
            placeholder="https://.../imagen.jpg"
            required
          />
          
          <div className="multi-image-input">
            <input type="text" placeholder="Añadir URL de imagen" value={newImageUrl} onChange={handleNewImageChange} />
            <button type="button" onClick={addImage} className="btn-primario">
              <i className="fas fa-plus-circle"></i> Agregar imagen
            </button>
          </div>

          <div className="imagen-list">
            {images.length === 0 && 
              <div className="preview-placeholder">
                <i className="fas fa-images"></i>
                <span>No hay imágenes</span>
              </div>}
            {images.map((im, idx) => (
              <div key={idx} className="imagen-item">
                <img src={im.url} alt={`img-${idx}`} onError={(e) => e.currentTarget.classList.add('invalid')} />
                <div className="imagen-item-actions">
                  <label>
                    <input type="radio" name="principal-edit" checked={!!im.esPrincipal} onChange={() => markAsPrincipal(idx)} /> Principal
                  </label>
                  <button type="button" onClick={() => removeImage(idx)} className="btn-secundario">Quitar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

  <div className="form-grupo full">
          <label htmlFor="estado">Estado:</label>
          <select
            id="estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
          >
            <option value="disponible">Disponible</option>
            <option value="agotado">Agotado</option>
            <option value="descontinuado">Descontinuado</option>
            <option value="oculto">Oculto</option>
          </select>
        </div>
        
  <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primario"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button 
            type="button" 
            className="btn-secundario"
            onClick={onCancelar}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
