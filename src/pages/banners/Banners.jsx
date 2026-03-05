import React, { useEffect, useState } from 'react'
import FormBanner from '../../components/banners/FormBanner'
import './banners.css'
import { API_BASE } from '../../utils/api'

export default function Banners() {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [showModal, setShowModal] = useState(false)
    const [bannerSeleccionado, setBannerSeleccionado] = useState(null)
    const [fetchingAction, setFetchingAction] = useState(false)

    useEffect(() => {
        fetchBanners()
    }, [])

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/Banners`)
            if (!res.ok) throw new Error('Error al cargar banners')
            const data = await res.json()
            setBanners(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenAdd = () => {
        setBannerSeleccionado(null)
        setShowModal(true)
    }

    const handleOpenEdit = (banner) => {
        setBannerSeleccionado(banner)
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setBannerSeleccionado(null)
    }

    const handleSubmit = async (formData) => {
        setFetchingAction(true)
        try {
            const url = bannerSeleccionado
                ? `${API_BASE}/Banners/${bannerSeleccionado.bannerId}`
                : `${API_BASE}/Banners`

            const method = bannerSeleccionado ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Error al guardar el banner')

            fetchBanners()
            handleCloseModal()
        } catch (err) {
            alert(err.message)
        } finally {
            setFetchingAction(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este banner?')) return

        try {
            const res = await fetch(`${API_BASE}/Banners/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Error al eliminar')
            fetchBanners()
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <div className="banners-page">
            <div className="banners-toolbar">
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Gestión de Banners</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '5px 0 0' }}>Publicidad para PC y Móvil</p>
                </div>

                <button className="banners-btn-new" onClick={handleOpenAdd}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nuevo Banner
                </button>
            </div>

            {loading ? (
                <div className="prod-loading">
                    <div className="prod-spinner"></div>
                    <p>Cargando banners...</p>
                </div>
            ) : banners.length === 0 ? (
                <div className="prod-empty">
                    <p>No hay banners configurados. Empieza creando uno nuevo.</p>
                </div>
            ) : (
                <div className="banners-grid">
                    {banners.map(banner => (
                        <div key={banner.bannerId} className="banner-card">
                            <div className="banner-images-preview">
                                <div className="banner-pc-preview">
                                    <span className="banner-badge">PC</span>
                                    <img src={banner.imagenDesktopUrl} alt={banner.nombre} />
                                </div>
                                <div className="banner-mobile-preview">
                                    <span className="banner-badge">Móvil</span>
                                    <img src={banner.imagenMobileUrl} alt={banner.nombre} />
                                </div>
                            </div>

                            <div className="banner-card-body">
                                <h4 className="banner-card-title">{banner.nombre}</h4>
                                <a href={banner.linkUrl} className="banner-card-link" target="_blank" rel="noreferrer">
                                    {banner.linkUrl || 'Sin link de enlace'}
                                </a>

                                <div className="banner-card-meta">
                                    <span>Orden: {banner.orden}</span>
                                    <span className={`banner-status ${banner.activo ? 'active' : 'inactive'}`}>
                                        {banner.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="banner-actions">
                                <button className="banner-btn-action" onClick={() => handleOpenEdit(banner)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className="banner-btn-action delete" onClick={() => handleDelete(banner.bannerId)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para Crear/Editar */}
            {showModal && (
                <div className="prod-modal-overlay" onClick={handleCloseModal}>
                    <div className="prod-modal" onClick={e => e.stopPropagation()}>
                        <div className="prod-modal-header">
                            <h3>{bannerSeleccionado ? 'Editar Banner' : 'Nuevo Banner'}</h3>
                            <button className="prod-modal-close" onClick={handleCloseModal}>✕</button>
                        </div>
                        <div className="prod-modal-body">
                            <FormBanner
                                banner={bannerSeleccionado}
                                onSubmit={handleSubmit}
                                onCancel={handleCloseModal}
                                loading={fetchingAction}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
