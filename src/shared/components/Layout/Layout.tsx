import { Link } from 'react-router-dom'
import { ReactNode } from 'react'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <nav className="layout-nav">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <main className="layout-content">
        {children}
      </main>
    </div>
  )
}
