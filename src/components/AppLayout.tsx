'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  backHref?: string
  backLabel?: string
}

export default function AppLayout({ children, title, backHref, backLabel }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [wrestlerName, setWrestlerName] = useState('')
  const [over, setOver] = useState(0)
  const [tp, setTp] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('wrestlers')
        .select('name, over_fans, training_points')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setWrestlerName(data.name)
        setOver(data.over_fans)
        setTp(data.training_points)
      }
    }
    load()
  }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { href: '/dashboard',   icon: '⚡', label: 'Home' },
    { href: '/backstage',   icon: '🚪', label: 'Backstage' },
    { href: '/show',        icon: '🏟️', label: 'Show Settimanale' },
    { href: '/show/premium',icon: '🌟', label: 'Premium Event' },
    { href: '/wrestler/create', icon: '✏️', label: 'Il mio Wrestler' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* SIDEBAR */}
      <aside className="app-sidebar">
        {/* Logo */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="font-pixel" style={{ fontSize: '8px', color: 'var(--accent)', lineHeight: '2', letterSpacing: '1px' }}>
              ⚡ FEDERATION<br/>ONLINE
            </div>
          </Link>
        </div>

        {/* Wrestler info */}
        {wrestlerName && (
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
                {wrestlerName}
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text3)' }}>
                <span>OVER <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{over}</span></span>
                <span>TP <span style={{ color: tp > 0 ? 'var(--green)' : 'var(--text3)', fontWeight: 600 }}>{tp}/5</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', padding: '0 8px', marginBottom: '8px' }}>
            Navigazione
          </div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--text3)' }}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="app-main">

        {/* TOPBAR */}
        <div className="app-topbar">
          {/* Back button */}
          {backHref && (
            <Link href={backHref} style={{ textDecoration: 'none', marginRight: '4px' }}>
              <button className="btn btn-ghost btn-sm" style={{ borderRadius: '500px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {backLabel || 'Indietro'}
              </button>
            </Link>
          )}

          {/* Title */}
          {title && (
            <h1 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Training points indicator */}
          {tp > 0 && (
            <Link href="/backstage" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(29,185,84,0.1)', border: '1px solid rgba(29,185,84,0.2)', borderRadius: '500px', padding: '6px 12px', cursor: 'pointer' }}>
                <span style={{ fontSize: '13px' }}>💪</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green2)' }}>{tp} training point</span>
              </div>
            </Link>
          )}
        </div>

        {/* PAGE CONTENT */}
        <div className="app-content">
          {children}
        </div>
      </div>
    </div>
  )
}
