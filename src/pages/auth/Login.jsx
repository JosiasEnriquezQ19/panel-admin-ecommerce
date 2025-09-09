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
    
    // Verificamos directamente las credenciales sin llamar al backend
    if (credentials.email === 'admin@example.com' && credentials.password === 'admin123') {
      // Simulamos un pequeño retraso para dar sensación de procesamiento
      setTimeout(() => {
        const mockUser = {
          id: 1,
          nombre: 'Administrador',
          email: credentials.email,
          role: 'admin'
        }
        localStorage.setItem('user', JSON.stringify(mockUser))
        localStorage.setItem('token', 'demo.token.forTestingOnly')
        
        if (onLoginSuccess) onLoginSuccess(mockUser)
        setLoading(false)
      }, 500)
    } else {
      // Si no son las credenciales correctas, mostramos error después de un breve retraso
      setTimeout(() => {
        setError('Credenciales incorrectas. Utiliza admin@example.com / admin123')
        setLoading(false)
      }, 500)
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
              placeholder="admin@example.com"
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
