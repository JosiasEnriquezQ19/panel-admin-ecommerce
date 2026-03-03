import React, { useState } from 'react'
import { API_BASE } from '../../utils/api'
import dashboardImg from '../../assets/dashboard-preview.png'
import logoImg from '../../assets/logo-ecommerce.png'
import './Login.css'

export default function Login({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/Auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        if (response.status === 401) {
          setError('Credenciales incorrectas. Verifica tu email y contraseña.')
        } else {
          setError(errorData?.message || `Error del servidor (${response.status})`)
        }
        setLoading(false)
        return
      }

      const data = await response.json()

      const adminUser = {
        id: data.admin.adminId,
        nombre: `${data.admin.nombre} ${data.admin.apellido}`,
        email: data.admin.email,
        role: 'admin',
        nivelAcceso: data.admin.nivelAcceso,
        token: data.token
      }

      localStorage.setItem('user', JSON.stringify(adminUser))
      localStorage.setItem('token', data.token)

      if (onLoginSuccess) onLoginSuccess(adminUser)
    } catch (err) {
      console.error('[AdminLogin] Error:', err)
      setError('Error de conexión con el servidor. Verifica que la API esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-wrapper">
      {/* Left side - Form */}
      <div className="admin-login-left">
        <div className="admin-login-form-container">
          {/* Logo */}
          <div className="admin-login-logo">
            <img src={logoImg} alt="MiTienda+" className="admin-login-logo-image" style={{ height: '40px', width: 'auto' }} />
          </div>

          {/* Title */}
          <h1 className="admin-login-title">Inicia sesión en tu cuenta.</h1>
          <p className="admin-login-subtitle">Ingresa tu correo y contraseña para acceder al panel</p>

          {/* Error */}
          {error && (
            <div className="admin-login-alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-input-group">
              <div className="admin-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="22,7 12,13 2,7" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                placeholder="Correo electrónico"
              />
            </div>

            <div className="admin-input-group">
              <div className="admin-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                placeholder="Contraseña"
              />
              <button
                type="button"
                className="admin-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="admin-spinner" width="20" height="20" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Iniciando sesión...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* Right side - Promo Panel */}
      <div className="admin-login-right">
        <div className="admin-login-promo">
          {/* Floating logo */}
          <div className="admin-promo-logo-float">
            <img src={logoImg} alt="Logo" style={{ width: '100%', height: 'auto' }} />
          </div>

          {/* Dashboard screenshots */}
          <div className="admin-promo-screenshots">
            <img
              src={dashboardImg}
              alt="Dashboard Preview"
              className="admin-promo-img admin-promo-img-main"
            />
            <img
              src={dashboardImg}
              alt="Dashboard Preview Secondary"
              className="admin-promo-img admin-promo-img-secondary"
            />
          </div>

          {/* Text content */}
          <div className="admin-promo-text">
            <h2>La forma más fácil de gestionar tu tienda.</h2>
            <p>Accede al panel administrativo de MiTienda+ y controla productos, pedidos, clientes y más.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
