import React, { useState, useEffect } from 'react'
import Productos from './pages/productos/Productos'
import Categorias from './pages/categorias/Categorias'
import Clientes from './pages/clientes/Clientes'
import Pedidos from './pages/pedidos/Pedidos'
// import MetodosPago from './pages/metodosPago/MetodosPago' // Oculto temporalmente
import Dashboard from './pages/Dashboard'
import Administradores from './pages/administradores/Administradores'
import Banners from './pages/banners/Banners'
import Ajustes from './pages/ajustes/Ajustes'
import Login from './pages/auth/Login'

import Layout from './components/layout/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import './layout-styles.css'

function MainApp() {
  const { user, isAuthenticated, logout, login } = useAuth()
  const { loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Definir la función de navegación global para que sea accesible desde otros componentes
  const handleNavigate = (page) => {
    if (page === 'logout') {
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        logout()
      }
      return
    }
    setCurrentPage(page)
  }

  // Registrar la función de navegación globalmente
  useEffect(() => {
    // Exponer la función de navegación globalmente
    window.onNavigate = handleNavigate

    // Escuchar eventos de navegación personalizados
    const handleNavigateEvent = (event) => {
      if (event.detail && event.detail.page) {
        handleNavigate(event.detail.page)
      }
    }

    window.addEventListener('navigate', handleNavigateEvent)

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('navigate', handleNavigateEvent)
      delete window.onNavigate
    }
  }, [logout])

  // Renderizado condicional basado en la ruta actual y nivel de acceso
  const renderCurrentPage = () => {
    const nivel = user?.nivelAcceso?.toLowerCase() || 'basico';

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'productos':
        return <Productos />
      case 'usuarios':
        if (nivel === 'basico') return <Dashboard />;
        return <Clientes />
      case 'categorias':
        if (nivel === 'basico') return <Dashboard />;
        return <Categorias />
      case 'pedidos':
        return <Pedidos />
      case 'administradores':
        if (nivel !== 'avanzado') return <Dashboard />;
        return <Administradores />
      case 'banners':
        if (nivel !== 'avanzado') return <Dashboard />;
        return <Banners />
      case 'ajustes':
        if (nivel !== 'avanzado') return <Dashboard />;
        return <Ajustes />
      default:
        return <Dashboard />
    }
  }

  // Si no está autenticado, mostrar la página de login
  console.log('[App] render - isAuthenticated=', isAuthenticated, 'user=', user, 'currentPage=', currentPage, 'authLoading=', authLoading)
  // Wait for auth initialization to complete before rendering Login or the app
  if (authLoading) {
    return <div />
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={login} />
  }

  // Si está autenticado, mostrar el layout con el menú lateral
  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderCurrentPage()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
