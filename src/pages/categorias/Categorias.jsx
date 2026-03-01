import React, { useState, useEffect } from 'react'
import { API_BASE } from '../../utils/api'
import './categorias.css'

export default function Categorias() {
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Estados para el modal/formulario
    const [showModal, setShowModal] = useState(false)
    const [editingCat, setEditingCat] = useState(null) // Si es null, es modo crear

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        imagenUrl: '',
        estado: 'activo'
    })

    useEffect(() => {
        fetchCategorias()
    }, [])

    const fetchCategorias = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/Categorias`)
            if (!res.ok) throw new Error('Error al cargar categorías')
            const data = await res.json()
            setCategorias(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (categoria = null) => {
        if (categoria) {
            setEditingCat(categoria)
            setFormData({
                nombre: categoria.nombre,
                descripcion: categoria.descripcion || '',
                imagenUrl: categoria.imagenUrl || '',
                estado: categoria.estado || 'activo'
            })
        } else {
            setEditingCat(null)
            setFormData({
                nombre: '',
                descripcion: '',
                imagenUrl: '',
                estado: 'activo'
            })
        }
        setShowModal(true)
        setError(null)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCat(null)
        setError(null)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        try {
            const url = editingCat
                ? `${API_BASE}/Categorias/${editingCat.categoriaId}`
                : `${API_BASE}/Categorias`

            const method = editingCat ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Error al guardar categoría')
            }

            fetchCategorias()
            handleCloseModal()
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return

        try {
            const res = await fetch(`${API_BASE}/Categorias/${id}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Error al eliminar categoría')
            }

            fetchCategorias()
        } catch (err) {
            alert(err.message)
        }
    }

    const handleToggleEstado = async (categoria) => {
        const nuevoEstado = categoria.estado === 'activo' ? 'inactivo' : 'activo'

        try {
            const res = await fetch(`${API_BASE}/Categorias/${categoria.categoriaId}/estado`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            })

            if (!res.ok) throw new Error('Error al actualizar estado')

            fetchCategorias()
        } catch (err) {
            console.error(err)
            alert('No se pudo cambiar el estado')
        }
    }

    return (
        <div className="categorias-page">
            <header className="page-header">
                <h2>Gestión de Categorías</h2>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    + Nueva Categoría
                </button>
            </header>

            {error && <div className="alert-error">{error}</div>}

            {loading ? (
                <div className="loading">Cargando...</div>
            ) : (
                <div className="table-responsive">
                    <table className="categories-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categorias.map(cat => (
                                <tr key={cat.categoriaId}>
                                    <td>{cat.categoriaId}</td>
                                    <td>
                                        <div className="cat-name">
                                            {cat.imagenUrl && (
                                                <img
                                                    src={cat.imagenUrl}
                                                    alt={cat.nombre}
                                                    className="cat-thumb"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            )}
                                            <span>{cat.nombre}</span>
                                        </div>
                                    </td>
                                    <td>{cat.descripcion}</td>
                                    <td>
                                        <span
                                            className={`status-badge ${cat.estado === 'activo' ? 'active' : 'inactive'}`}
                                            onClick={() => handleToggleEstado(cat)}
                                            title="Clic para cambiar estado"
                                        >
                                            {cat.estado}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-icon edit"
                                            onClick={() => handleOpenModal(cat)}
                                            title="Editar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDelete(cat.categoriaId)}
                                            title="Eliminar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categorias.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center">No hay categorías registradas</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <header className="modal-header">
                            <h3>{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                            <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </header>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        required
                                        maxLength={100}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descripción</label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleInputChange}
                                        maxLength={500}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>URL Imagen</label>
                                    <input
                                        type="url"
                                        name="imagenUrl"
                                        value={formData.imagenUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                    {formData.imagenUrl && (
                                        <div className="img-preview">
                                            <img src={formData.imagenUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Estado</label>
                                    <select name="estado" value={formData.estado} onChange={handleInputChange}>
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            <footer className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                                <button type="submit" className="btn-primary">
                                    {editingCat ? 'Actualizar' : 'Guardar'}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
