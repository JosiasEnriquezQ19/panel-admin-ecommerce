import React, { useState } from 'react'
import { API_BASE } from '../../utils/api'

export default function AgregarProducto({ onProductoCreado, onCancelar, onError }) {
  const [form, setForm] = useState({
    nombre: '',
    precio: 0,
    estado: 'disponible',
    descripcion: '',
    categoria: '',
    imagenUrl: '',
    stock: 0
  })
  const [imagenes, setImagenes] = useState(['']) // Array de URLs de imágenes, la primera es la principal
  const [loading, setLoading] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0) // Índice de la imagen que se está previsualizando
  const [imgValid, setImgValid] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  React.useEffect(() => {
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

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm({
      ...form,
      [name]: type === 'number' ? Number(value) : value
    })
  }

  const handleImagenChange = (index, value) => {
    const nuevasImagenes = [...imagenes];
    nuevasImagenes[index] = value;
    setImagenes(nuevasImagenes);
    setImgValid(true);
  }

  const handleAddImage = () => {
    if (imagenes.length >= 7) return; // máximo 7 imágenes
    setImagenes([...imagenes, '']);
  }

  const handleRemoveImage = (index) => {
    if (imagenes.length <= 1) return; // debe quedar al menos una imagen
    const nuevasImagenes = imagenes.filter((_, i) => i !== index);
    setImagenes(nuevasImagenes);

    // Ajustar el índice de previsualización si es necesario
    if (previewIndex === index) {
      setPreviewIndex(0); // Volver a la primera imagen
    } else if (previewIndex > index) {
      setPreviewIndex(previewIndex - 1); // Ajustar el índice si eliminamos una imagen anterior
    }
  }

  const handleMakePrincipal = (index) => {
    if (index === 0) return; // Ya es la principal

    const nuevasImagenes = [...imagenes];
    // Mover la imagen seleccionada a la primera posición
    const imagen = nuevasImagenes.splice(index, 1)[0];
    nuevasImagenes.unshift(imagen);
    setImagenes(nuevasImagenes);

    // Ajustar el índice de previsualización
    if (previewIndex === index) {
      setPreviewIndex(0);
    } else if (previewIndex === 0) {
      setPreviewIndex(index);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filtrar imágenes vacías y recortar espacios
      const imagenesValidas = imagenes
        .map(url => (url || '').trim())
        .filter(url => url);

      if (imagenesValidas.length === 0) {
        throw new Error('Se requiere al menos una imagen para el producto');
      }

      // Preparar payload con las imágenes
      const payload = {
        ...form,
        imagenUrl: imagenesValidas[0] || '',
        imagenUrl2: imagenesValidas[1] || null,
        imagenUrl3: imagenesValidas[2] || null,
        imagenUrl4: imagenesValidas[3] || null,
        imagenUrl5: imagenesValidas[4] || null,
        imagenUrl6: imagenesValidas[5] || null,
        imagenUrl7: imagenesValidas[6] || null
      }

      const res = await fetch(`${API_BASE}/Productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.message || 'Error al crear el producto')
      }

      // Las imágenes se almacenan como columnas en la tabla Productos
      // El backend devuelve el objeto del producto creado
      let created = null
      try { created = await res.json() } catch (e) { created = null }
      console.debug('Producto creado (respuesta):', created)

      // Limpiar formulario después de éxito
      setForm({
        nombre: '',
        precio: 0,
        estado: 'disponible',
        descripcion: '',
        categoria: '',
        imagenUrl: '',
        stock: 0
      })
      setImagenes([''])
      setPreviewIndex(0)

      // Notificar al componente padre
      if (onProductoCreado) onProductoCreado()
    } catch (err) {
      if (onError) onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="agregar-producto-container card-content"> {/* Added card style */}
      <h3 className="card-title">Agregar Nuevo Producto</h3>

      <form onSubmit={handleSubmit} className="producto-form">
        <div className="form-row"> {/* Grid layout */}
          <div className="form-group half">
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

          <div className="form-group half">
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
        </div>

        <div className="form-group full">
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

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="categoriaId">Categoría:</label>
            <select
              id="categoriaId"
              name="categoriaId"
              value={form.categoriaId || ''}
              onChange={handleChange}
              required
              disabled={loadingCategories}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map(cat => (
                <option key={cat.categoriaId} value={cat.categoriaId}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group half">
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
        </div>

        <div className="form-group">
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

        <div className="form-group full">
          <label>Imágenes del producto (máx. 7)</label>
          <div className="imagenes-container">
            {imagenes.map((url, idx) => (
              <div key={idx} className="imagen-item">
                <div className="imagen-row">
                  <input
                    type="text"
                    placeholder={idx === 0 ? "URL imagen principal (requerida)" : `URL imagen adicional ${idx}`}
                    value={url}
                    onChange={(e) => handleImagenChange(idx, e.target.value)}
                    required={idx === 0}
                  />
                  <div className="imagen-actions">
                    {idx !== 0 && (
                      <button
                        type="button"
                        className="btn-icon action"
                        onClick={() => handleMakePrincipal(idx)}
                        title="Hacer principal"
                      >
                        ⭐
                      </button>
                    )}
                    {imagenes.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => handleRemoveImage(idx)}
                        title="Quitar imagen"
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-icon view"
                      onClick={() => setPreviewIndex(idx)}
                      title="Ver previsualización"
                    >
                      👁️
                    </button>
                  </div>
                </div>
                {previewIndex === idx && (
                  <div className="imagen-preview">
                    {url ? (
                      <img
                        src={url}
                        alt="Vista previa"
                        onError={() => setImgValid(false)}
                        onLoad={() => setImgValid(true)}
                        className={`preview-img ${imgValid ? '' : 'invalid'}`}
                      />
                    ) : (
                      <div className="preview-placeholder">
                        <span>Vista previa de imagen</span>
                      </div>
                    )}
                    {!imgValid && url && <div className="preview-error">No se pudo cargar la imagen</div>}
                  </div>
                )}
                {idx === 0 && (
                  <div className="principal-badge">
                    <span>Principal</span>
                  </div>
                )}
              </div>
            ))}

            <div className="imagen-actions-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddImage}
                disabled={imagenes.length >= 7}
              >
                + Agregar más imágenes
              </button>
              <small>{imagenes.length}/7 imágenes</small>
            </div>
          </div>
        </div>

        <div className="form-actions footer-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Producto'}
          </button>
          {onCancelar && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancelar}
              disabled={loading}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
