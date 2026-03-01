import React, { useState } from 'react'
import { API_BASE } from '../../utils/api'

export default function Login({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

      // Save token and user data
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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Panel Administrativo</h2>
          <p>Inicia sesión para gestionar tu e-commerce</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              placeholder="admin@tuempresa.com"
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="login-actions">
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </div>

          <div className="login-help">

          </div>
        </form>
      </div>
    </div>
  )
}
