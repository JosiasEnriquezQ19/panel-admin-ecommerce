import React, { useState, useEffect } from 'react'

export default function FormBanner({ banner, onSubmit, onCancel, loading }) {
    const [formData, setFormData] = useState({
        nombre: '',
        imagenDesktopUrl: '',
        imagenMobileUrl: '',
        linkUrl: '',
        orden: 0,
        activo: true
    })

    useEffect(() => {
        if (banner) {
            setFormData({
                nombre: banner.nombre || '',
                imagenDesktopUrl: banner.imagenDesktopUrl || '',
                imagenMobileUrl: banner.imagenMobileUrl || '',
                linkUrl: banner.linkUrl || '',
                orden: banner.orden || 0,
                activo: banner.activo !== false
            })
        }
    }, [banner])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="banner-form-group">
                <label>Nombre del Banner</label>
                <input
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Ofertas de Verano"
                />
            </div>

            <div className="banner-form-group">
                <label>URL Imagen PC (Recomendado 1920x600)</label>
                <input
                    name="imagenDesktopUrl"
                    value={formData.imagenDesktopUrl}
                    onChange={handleChange}
                    required
                    placeholder="https://link-a-mi-foto-pc.jpg"
                />
            </div>

            <div className="banner-form-group">
                <label>URL Imagen Móvil (Recomendado 1080x1350)</label>
                <input
                    name="imagenMobileUrl"
                    value={formData.imagenMobileUrl}
                    onChange={handleChange}
                    required
                    placeholder="https://link-a-mi-foto-movil.jpg"
                />
            </div>

            <div className="banner-form-group">
                <label>Ruta de Publicidad (Donde llevará el click)</label>
                <input
                    name="linkUrl"
                    value={formData.linkUrl}
                    onChange={handleChange}
                    placeholder="/productos?categoria=ofertas"
                />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                <div className="banner-form-group" style={{ flex: 1 }}>
                    <label>Orden de aparición</label>
                    <input
                        type="number"
                        name="orden"
                        value={formData.orden}
                        onChange={handleChange}
                    />
                </div>

                <div className="banner-form-group" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <label className="banner-form-checkbox">
                        <input
                            type="checkbox"
                            name="activo"
                            checked={formData.activo}
                            onChange={handleChange}
                        />
                        Banner Activo
                    </label>
                </div>
            </div>

            <div className="banner-preview-container">
                <p className="banner-preview-title">Previsualización rápida:</p>
                <div className="banner-preview-box banner-pc-box">
                    {formData.imagenDesktopUrl ? <img src={formData.imagenDesktopUrl} alt="PC Preview" /> : <div style={{ height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>Vista PC</div>}
                </div>
                <div className="banner-preview-box banner-mobile-box">
                    {formData.imagenMobileUrl ? <img src={formData.imagenMobileUrl} alt="Mobile Preview" /> : <div style={{ height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>Vista Móvil</div>}
                </div>
            </div>

            <div className="footer-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Guardando...' : (banner ? 'Actualizar Banner' : 'Crear Banner')}
                </button>
            </div>
        </form>
    )
}
