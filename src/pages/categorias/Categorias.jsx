import React, { useState, useEffect } from 'react'
import { API_BASE } from '../../utils/api'
import './categorias.css'
import '../productos/productos.css'

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
        <div className="prod-page">
            <header className="content-header" style={{ borderBottom: 'none', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--text-main)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </div>
                    <div>
                        <h2 className="page-title" style={{ fontSize: '1.4rem' }}>Categorías</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gestiona los grupos de productos de tu tienda</p>
                    </div>
                </div>
                <button className="prod-btn-new" onClick={() => handleOpenModal()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nueva Categoría
                </button>
            </header>

            {error && <div className="prod-error"><span>{error}</span><button onClick={() => setError(null)}>×</button></div>}

            <div className="prod-content">
                {loading ? (
                    <div className="prod-loading">
                        <div className="prod-spinner"></div>
                        <p>Cargando categorías...</p>
                    </div>
                ) : (
                    <div className="table-responsive" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
                        <table className="categories-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categorias.map(cat => (
                                    <tr key={cat.categoriaId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>#{cat.categoriaId}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 40, height: 40, background: '#f8f9fa', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {cat.imagenUrl ? (
                                                        <img src={cat.imagenUrl} alt={cat.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>{cat.nombre}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cat.descripcion || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin descripción</span>}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '4px 12px',
                                                    borderRadius: '99px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: cat.estado === 'activo' ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
                                                    color: cat.estado === 'activo' ? 'var(--success)' : 'var(--danger)',
                                                    border: `1px solid ${cat.estado === 'activo' ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`,
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => handleToggleEstado(cat)}
                                            >
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.estado === 'activo' ? 'var(--success)' : 'var(--danger)' }}></span>
                                                {cat.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button className="prod-card-menu-btn" onClick={() => handleOpenModal(cat)} style={{ position: 'relative', inset: 'auto' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button className="prod-card-menu-btn" onClick={() => handleDelete(cat.categoriaId)} style={{ position: 'relative', inset: 'auto', color: 'var(--danger)' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {categorias.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No hay categorías registradas</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Overlay Elegante */}
            {showModal && (
                <div className="prod-modal-overlay" onClick={handleCloseModal}>
                    <div className="prod-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="prod-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: 36, height: 36, background: 'var(--text-main)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                        {editingCat ? 'Modifica los detalles de la categoría seleccionada' : 'Completa los campos para crear una nueva categoría'}
                                    </p>
                                </div>
                            </div>
                            <button className="prod-modal-close" onClick={handleCloseModal}>✕</button>
                        </div>

                        <div className="prod-modal-body">
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Nombre de la categoría</label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            required
                                            maxLength={100}
                                            placeholder="Ej: Electrónica, Ropa, etc."
                                            style={{ width: '100%', padding: '12px 16px', background: '#fafafa', border: '1px solid #e8e8ed', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Descripción</label>
                                        <textarea
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleInputChange}
                                            rows="3"
                                            maxLength={500}
                                            placeholder="Describe brevemente de qué trata esta categoría..."
                                            style={{ width: '100%', padding: '12px 16px', background: '#fafafa', border: '1px solid #e8e8ed', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>URL de Imagen</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="url"
                                                    name="imagenUrl"
                                                    value={formData.imagenUrl}
                                                    onChange={handleInputChange}
                                                    placeholder="https://ejemplo.com/imagen.jpg"
                                                    style={{ width: '100%', padding: '12px 16px', background: '#fafafa', border: '1px solid #e8e8ed', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            {formData.imagenUrl && (
                                                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: '#fafafa', flexShrink: 0 }}>
                                                    <img src={formData.imagenUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Estado</label>
                                        <select
                                            name="estado"
                                            value={formData.estado}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '12px 16px', background: '#fafafa', border: '1px solid #e8e8ed', borderRadius: '10px', color: 'var(--text-main)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                        >
                                            <option value="activo">Activo (Visible)</option>
                                            <option value="inactivo">Inactivo (Oculto)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e8e8ed' }}>
                                    <button type="button" className="prod-btn-clear" onClick={handleCloseModal} style={{ margin: 0 }}>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 28px',
                                            background: 'var(--text-main)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingCat ? 'Actualizar' : 'Crear Categoría'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
