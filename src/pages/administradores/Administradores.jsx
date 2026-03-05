import React, { useEffect, useState } from 'react'
import { API_BASE } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import './Administradores.css'

export default function Administradores() {
    const { user } = useAuth()
    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [editingAdmin, setEditingAdmin] = useState(null)
    const [form, setForm] = useState({ email: '', password: '', nombre: '', apellido: '', nivelAcceso: 'basico' })
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState(null)

    const nivelBadges = {
        basico: { bg: '#dbeafe', color: '#1e40af', label: '🔵 Básico' },
        medio: { bg: '#fef3c7', color: '#92400e', label: '🟡 Medio' },
        avanzado: { bg: '#dcfce7', color: '#166534', label: '🟢 Avanzado' }
    }

    const fetchAdmins = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/Administradores`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            const data = await res.json()
            setAdmins(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAdmins() }, [])

    const openCreate = () => {
        setEditingAdmin(null)
        setForm({ email: '', password: '', nombre: '', apellido: '', nivelAcceso: 'basico' })
        setShowModal(true)
        setError(null)
    }

    const openEdit = (admin) => {
        setEditingAdmin(admin)
        setForm({
            email: admin.email,
            password: '',
            nombre: admin.nombre,
            apellido: admin.apellido,
            nivelAcceso: admin.nivelAcceso
        })
        setShowModal(true)
        setError(null)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const headers = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const url = editingAdmin
                ? `${API_BASE}/Administradores/${editingAdmin.adminId}`
                : `${API_BASE}/Administradores`
            const method = editingAdmin ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(form)
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => null)
                throw new Error(errData?.message || `Error ${res.status}`)
            }

            setShowModal(false)
            setSuccessMsg(editingAdmin ? 'Administrador actualizado correctamente' : 'Administrador creado correctamente')
            setTimeout(() => setSuccessMsg(null), 3000)
            await fetchAdmins()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (adminId) => {
        if (!confirm('¿Estás seguro de eliminar este administrador?')) return
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/Administradores/${adminId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) throw new Error(`Error ${res.status}`)
            setSuccessMsg('Administrador eliminado correctamente')
            setTimeout(() => setSuccessMsg(null), 3000)
            await fetchAdmins()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="admin-mgmt">
            {/* Header */}
            <div className="admin-mgmt-header">
                <div>
                    <h2 className="admin-mgmt-title">Gestión de Administradores</h2>
                    <p className="admin-mgmt-subtitle">
                        Administra los usuarios con acceso al panel. Total: <strong>{admins.length}</strong>
                    </p>
                </div>
                <button className="admin-btn-create" onClick={openCreate}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nuevo Admin
                </button>
            </div>

            {/* Success message */}
            {successMsg && (
                <div className="admin-success-toast">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    {successMsg}
                </div>
            )}

            {/* Error */}
            {error && !showModal && (
                <div className="admin-error-bar">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="admin-loading">
                    <div className="admin-spinner-ring"></div>
                    <p>Cargando administradores...</p>
                </div>
            ) : (
                /* Admin Cards Grid */
                <div className="admin-cards-grid">
                    {admins.map(admin => (
                        <div key={admin.adminId} className="admin-card">
                            <div className="admin-card-top">
                                <div className="admin-card-avatar">
                                    {admin.nombre?.charAt(0)}{admin.apellido?.charAt(0)}
                                </div>
                                <div className="admin-card-info">
                                    <h3>{admin.nombre} {admin.apellido}</h3>
                                    <p>{admin.email}</p>
                                </div>
                                {admin.adminId === user?.id && (
                                    <span className="admin-you-badge">Tú</span>
                                )}
                            </div>

                            <div className="admin-card-details">
                                <div className="admin-card-detail-row">
                                    <span className="admin-detail-label">Nivel de acceso</span>
                                    <span className="admin-nivel-badge" style={{
                                        background: nivelBadges[admin.nivelAcceso]?.bg || '#f1f5f9',
                                        color: nivelBadges[admin.nivelAcceso]?.color || '#475569'
                                    }}>
                                        {nivelBadges[admin.nivelAcceso]?.label || admin.nivelAcceso}
                                    </span>
                                </div>
                                <div className="admin-card-detail-row">
                                    <span className="admin-detail-label">Estado</span>
                                    <span className={`admin-estado-badge ${admin.estado}`}>
                                        {admin.estado === 'activo' ? '● Activo' : '○ Inactivo'}
                                    </span>
                                </div>
                                <div className="admin-card-detail-row">
                                    <span className="admin-detail-label">Creado</span>
                                    <span className="admin-detail-value">
                                        {admin.fechaCreacion ? new Date(admin.fechaCreacion).toLocaleDateString('es-PE') : '—'}
                                    </span>
                                </div>
                                <div className="admin-card-detail-row">
                                    <span className="admin-detail-label">Último acceso</span>
                                    <span className="admin-detail-value">
                                        {admin.fechaUltimoAcceso ? new Date(admin.fechaUltimoAcceso).toLocaleString('es-PE') : 'Nunca'}
                                    </span>
                                </div>
                            </div>

                            <div className="admin-card-actions">
                                <button className="admin-btn-edit" onClick={() => openEdit(admin)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Editar
                                </button>
                                {admin.adminId !== user?.id && (
                                    <button className="admin-btn-delete" onClick={() => handleDelete(admin.adminId)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Nivel de acceso info */}
            <div className="admin-access-info">
                <h3>Niveles de Acceso</h3>
                <div className="admin-access-grid">
                    <div className="admin-access-card">
                        <div className="admin-access-icon basico">
                            <span className="admin-access-dot"></span>
                        </div>
                        <div>
                            <h4>Básico</h4>
                            <p>Puede ver el dashboard, pedidos y productos. No puede modificar configuraciones ni administradores.</p>
                        </div>
                    </div>
                    <div className="admin-access-card">
                        <div className="admin-access-icon medio">
                            <span className="admin-access-dot"></span>
                        </div>
                        <div>
                            <h4>Medio</h4>
                            <p>Puede gestionar productos, categorías, pedidos y clientes. No puede crear ni eliminar administradores.</p>
                        </div>
                    </div>
                    <div className="admin-access-card">
                        <div className="admin-access-icon avanzado">
                            <span className="admin-access-dot"></span>
                        </div>
                        <div>
                            <h4>Avanzado</h4>
                            <p>Acceso total al sistema. Puede crear, editar y eliminar administradores y acceder a todas las funciones.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
                            <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        {error && (
                            <div className="admin-modal-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="admin-modal-form">
                            <div className="admin-modal-row">
                                <div className="admin-modal-field">
                                    <label>Nombre</label>
                                    <input
                                        type="text" required
                                        value={form.nombre}
                                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                                        placeholder="Nombre"
                                    />
                                </div>
                                <div className="admin-modal-field">
                                    <label>Apellido</label>
                                    <input
                                        type="text" required
                                        value={form.apellido}
                                        onChange={e => setForm({ ...form, apellido: e.target.value })}
                                        placeholder="Apellido"
                                    />
                                </div>
                            </div>

                            <div className="admin-modal-field">
                                <label>Email</label>
                                <input
                                    type="email" required
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    placeholder="admin@empresa.com"
                                />
                            </div>

                            <div className="admin-modal-field">
                                <label>Contraseña {editingAdmin && <span className="admin-optional">(dejar vacío para no cambiar)</span>}</label>
                                <input
                                    type="password"
                                    required={!editingAdmin}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    placeholder={editingAdmin ? '••••••••' : 'Contraseña segura'}
                                    minLength={editingAdmin ? 0 : 6}
                                />
                            </div>

                            <div className="admin-modal-field">
                                <label>Nivel de Acceso</label>
                                <div className="admin-nivel-selector">
                                    {['basico', 'medio', 'avanzado'].map(nivel => (
                                        <button
                                            key={nivel}
                                            type="button"
                                            className={`admin-nivel-option ${form.nivelAcceso === nivel ? 'selected' : ''}`}
                                            onClick={() => setForm({ ...form, nivelAcceso: nivel })}
                                            style={{
                                                borderColor: form.nivelAcceso === nivel ? (nivelBadges[nivel]?.color || '#6366f1') : 'transparent',
                                                background: form.nivelAcceso === nivel ? (nivelBadges[nivel]?.bg || '#eef2ff') : '#f8fafc'
                                            }}
                                        >
                                            <span className="admin-nivel-emoji">
                                                {nivel === 'basico' ? '🔵' : nivel === 'medio' ? '🟡' : '🟢'}
                                            </span>
                                            <span className="admin-nivel-name">{nivel.charAt(0).toUpperCase() + nivel.slice(1)}</span>
                                            <span className="admin-nivel-desc">
                                                {nivel === 'basico' ? 'Solo lectura' : nivel === 'medio' ? 'Gestión' : 'Total'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-modal-actions">
                                <button type="button" className="admin-btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="admin-btn-save" disabled={saving}>
                                    {saving ? 'Guardando...' : (editingAdmin ? 'Guardar cambios' : 'Crear administrador')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
