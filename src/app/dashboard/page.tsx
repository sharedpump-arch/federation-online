'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AppLayout from '@/components/AppLayout'
import type { Wrestler } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [wrestler, setWrestler] = useState<Wrestler | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('wrestlers').select('*').eq('user_id', user.id).single()
      if (!data) { router.push('/wrestler/create'); return }
      setWrestler(data)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text2)' }}>Caricamento...</p>
    </main>
  )

  if (!wrestler) return null

  const statKeys = [
    { key: 'strength',  label: 'Forza',      color: '#ff2d55' },
    { key: 'agility',   label: 'Agilità',     color: '#3b82f6' },
    { key: 'endurance', label: 'Resistenza',  color: '#1db954' },
    { key: 'technique', label: 'Tecnica',     color: '#a855f7' },
    { key: 'charisma',  label: 'Carisma',     color: '#ffd700' },
  ]

  const navCards = [
    { href: '/backstage',    icon: '🚪', label: 'Backstage',       sub: 'Chat, allenamento, fan zone', color: 'var(--blue)' },
    { href: '/show',         icon: '🏟️', label: 'Show Settimanale', sub: 'Thunder Night — LIVE',        color: 'var(--accent)' },
    { href: '/show/premium', icon: '🌟', label: 'Premium Event',   sub: 'Night of Glory',              color: 'var(--gold)' },
    { href: '/wrestler/create', icon: '✏️', label: 'Il mio Wrestler', sub: 'Modifica aspetto e bio',   color: 'var(--green)' },
  ]

  return (
    <AppLayout title="Dashboard">
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Ciao, {wrestler.name} 👋
        </h1>
        <p style={{ color: 'var(--text2)' }}>
          <span className="badge badge-red" style={{ marginRight: '8px' }}>{wrestler.attitude.toUpperCase()}</span>
          Record: <strong style={{ color: 'var(--green2)' }}>{wrestler.wins}V</strong> — <strong style={{ color: 'var(--accent2)' }}>{wrestler.losses}S</strong>
        </p>
      </div>

      {/* Stats card */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Statistiche</div>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>
              {wrestler.strength + wrestler.agility + wrestler.endurance + wrestler.technique + wrestler.charisma}
              <span style={{ fontSize: '15px', color: 'var(--text3)', fontWeight: 400 }}> / 425 punti totali</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{wrestler.over_fans}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>OVER</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--blue)' }}>{wrestler.momentum}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>MOMENTUM</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {statKeys.map(s => {
            const val = wrestler[s.key as keyof Wrestler] as number
            return (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{s.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{val} / 85</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-bar-fill" style={{ width: `${(val / 85) * 100}%`, background: s.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training points alert */}
      {wrestler.training_points > 0 && (
        <Link href="/backstage" style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }}>
            <span style={{ fontSize: '24px' }}>💪</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--green2)' }}>Training point disponibili!</div>
              <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '2px' }}>Hai {wrestler.training_points} punto/i da spendere — vai in palestra</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--green2)' }}>
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </Link>
      )}

      {/* Nav cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {navCards.map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '20px', borderLeft: `3px solid ${c.color}` }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{c.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{c.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  )
}
