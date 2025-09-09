import React from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, currentPage, onNavigate }) {
  return (
    <div className="layout">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="main-content">
        <header className="content-header">
          <h1 className="page-title">
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
          </h1>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  )
}
