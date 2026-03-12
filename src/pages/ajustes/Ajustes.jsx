import React, { useEffect, useState } from 'react'
import './ajustes.css'
import { API_BASE } from '../../utils/api'

export default function Ajustes() {
    const [configs, setConfigs] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState('')

    // Form inputs state
    const [seoTitle, setSeoTitle] = useState('')
    const [seoDescription, setSeoDescription] = useState('')
    const [seoKeywords, setSeoKeywords] = useState('')

    // Referencias a los IDs para actualizar/crear
    const [keysMap, setKeysMap] = useState({})

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/Configuraciones`)
            if (!res.ok) throw new Error('Error al cargar configuraciones')
            const data = await res.json()
            setConfigs(data)

            let map = {}
            data.forEach(item => {
                if (item.clave === 'SEO_TITLE') {
                    setSeoTitle(item.valor)
                    map['SEO_TITLE'] = item.configId
                }
                if (item.clave === 'SEO_DESCRIPTION') {
                    setSeoDescription(item.valor)
                    map['SEO_DESCRIPTION'] = item.configId
                }
                if (item.clave === 'SEO_KEYWORDS') {
                    setSeoKeywords(item.valor)
                    map['SEO_KEYWORDS'] = item.configId
                }
            })
            setKeysMap(map)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const saveOrUpdateConfig = async (clave, valor, descripcion) => {
        const url = keysMap[clave]
            ? `${API_BASE}/Configuraciones/${keysMap[clave]}`
            : `${API_BASE}/Configuraciones`
        
        const method = keysMap[clave] ? 'PUT' : 'POST'
        
        const body = { clave, valor, descripcion }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })

        if (!res.ok) throw new Error(`Error guardando ${clave}`)
    }

    const handleSaveSEOSettings = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccessMsg('')

        try {
            await saveOrUpdateConfig('SEO_TITLE', seoTitle, 'Título principal de la tienda para Google')
            await saveOrUpdateConfig('SEO_DESCRIPTION', seoDescription, 'Descripción principal para buscadores')
            await saveOrUpdateConfig('SEO_KEYWORDS', seoKeywords, 'Palabras clave separadas por comas')

            setSuccessMsg('¡Ajustes de SEO guardados correctamente!')
            // Volver a cargar para asegurar integridad de IDs si alguno fue nuevo
            await fetchConfig()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
            setTimeout(() => setSuccessMsg(''), 4000)
        }
    }

    return (
        <div className="ajustes-page">
            <div className="ajustes-toolbar">
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Ajustes de Tienda</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '5px 0 0' }}>SEO y Preferencias Globales</p>
                </div>
            </div>

            {error && (
                <div className="ajustes-error">
                    <span>{error}</span>
                </div>
            )}
            
            {successMsg && (
                <div className="ajustes-success">
                    <span>{successMsg}</span>
                </div>
            )}

            {loading ? (
                <div className="prod-loading">
                    <div className="prod-spinner"></div>
                    <p>Cargando configuraciones...</p>
                </div>
            ) : (
                <div className="ajustes-content">
                    {/* Tarjeta SEO */}
                    <div className="ajustes-card">
                        <div className="ajustes-card-header">
                            <div className="ajustes-card-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <div>
                                <h3>Posicionamiento en Google (SEO)</h3>
                                <p>Optimiza cómo se ve tu tienda en los motores de búsqueda.</p>
                            </div>
                        </div>

                        <form className="ajustes-form" onSubmit={handleSaveSEOSettings}>
                            <div className="form-group">
                                <label>Título de la Tienda</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Mi Tienda Plus | Ropa para Caballeros" 
                                    value={seoTitle}
                                    onChange={(e) => setSeoTitle(e.target.value)}
                                    maxLength={70}
                                    required
                                />
                                <span className="help-text">El nombre principal que aparecerá azul en los resultados (máx 70 caract).</span>
                            </div>

                            <div className="form-group">
                                <label>Descripción de la Búsqueda</label>
                                <textarea 
                                    rows="3" 
                                    placeholder="Ej: La mejor tienda de ropa urbana con envíos gratis..."
                                    value={seoDescription}
                                    onChange={(e) => setSeoDescription(e.target.value)}
                                    maxLength={160}
                                />
                                <span className="help-text">El breve resumen de qué trata tu negocio (ideal 150-160 caract).</span>
                            </div>

                            <div className="form-group">
                                <label>Palabras Clave (Keywords)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: ropa de hombre, zapatillas, moda lima, envío barato"
                                    value={seoKeywords}
                                    onChange={(e) => setSeoKeywords(e.target.value)}
                                />
                                <span className="help-text">Ayuda a los buscadores a indexar tus temáticas. (Separarlas con comas).</span>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-save" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Ajustes SEO'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Espacio para nuevas tarjetas a futuro (Pagos, Redes Sociales, etc) */}
                </div>
            )}
        </div>
    )
}
