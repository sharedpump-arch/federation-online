'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
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

      const { data } = await supabase
        .from('wrestlers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!data) { router.push('/wrestler/create'); return }

      setWrestler(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="font-pixel text-xs" style={{ color: 'var(--gold)', letterSpacing: '2px' }}>
          ⏳ CARICAMENTO...
        </div>
      </main>
    )
  }

  if (!wrestler) return null

  const totalStats = wrestler.strength + wrestler.agility + wrestler.endurance + wrestler.technique + wrestler.charisma

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--panel)', borderBottom: '2px solid var(--accent)', padding: '12px 20px' }}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <span className="font-pixel" style={{ fontSize: '12px', color: 'var(--accent)', textShadow: '0 0 15px rgba(255,45,85,0.4)' }}>
            ⚡ FEDERATION ONLINE
          </span>
          <div className="flex items-center gap-6" style={{ fontSize: '18px' }}>
            <span style={{ color: 'var(--gold)' }}>{wrestler.name}</span>
            <span style={{ color: 'var(--dim)' }}>OVER: <span style={{ color: 'var(--green)' }}>{wrestler.over_fans}</span></span>
            <span style={{ color: 'var(--dim)' }}>TP: <span style={{ color: 'var(--gold)' }}>{wrestler.training_points}/5</span></span>
            <button onClick={handleLogout} style={{ color: 'var(--dim)', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-pixel mb-2" style={{ fontSize: '14px', color: 'var(--gold)' }}>
            WELCOME BACK, {wrestler.name.toUpperCase()}
          </h1>
          <p style={{ color: 'var(--dim)' }}>
            Record: <span style={{ color: 'var(--green)' }}>{wrestler.wins}W</span> —{' '}
            <span style={{ color: 'var(--accent)' }}>{wrestler.losses}L</span>
            &nbsp;|&nbsp; Attitudine: <span style={{ color: 'var(--text)' }}>{wrestler.attitude.toUpperCase()}</span>
          </p>
        </div>

        {/* Stats bar */}
        <div className="game-panel p-5 mb-6">
          <div className="font-pixel mb-4" style={{ fontSize: '8px', color: 'var(--dim)', letterSpacing: '2px' }}>STATISTICHE</div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'FORZA', val: wrestler.strength },
              { label: 'AGILITÀ', val: wrestler.agility },
              { label: 'RESIST.', val: wrestler.endurance },
              { label: 'TECNICA', val: wrestler.technique },
              { label: 'CARISMA', val: wrestler.charisma },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div style={{ fontSize: '13px', color: 'var(--dim)', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ height: '60px', background: '#0a0a15', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(s.val / 85) * 100}%`, background: 'var(--accent)', transition: 'height 0.5s' }} />
                </div>
                <div className="font-pixel mt-1" style={{ fontSize: '10px', color: 'var(--gold)' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3" style={{ fontSize: '14px', color: 'var(--dim)' }}>
            TOTALE: <span style={{ color: 'var(--text)' }}>{totalStats}</span>/425 &nbsp;|&nbsp;
            OVER: <span style={{ color: 'var(--gold)' }}>{wrestler.over_fans}/100</span> &nbsp;|&nbsp;
            MOMENTUM: <span style={{ color: 'var(--blue)' }}>{wrestler.momentum}/100</span>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { href: '/backstage', icon: '🚪', label: 'BACKSTAGE', sub: 'Interagisci con gli altri', color: 'var(--blue)' },
            { href: '/show', icon: '🏟️', label: 'SHOW', sub: 'Show settimanale in corso', color: 'var(--accent)' },
            { href: '/show/premium', icon: '⚡', label: 'PREMIUM EVENT', sub: 'Night of Glory', color: 'var(--gold)' },
            { href: '/wrestler/create', icon: '✏️', label: 'MODIFICA', sub: 'Modifica il wrestler', color: 'var(--green)' },
          ].map(nav => (
            <Link key={nav.href} href={nav.href}>
              <div className="game-panel p-5 cursor-pointer transition-all hover:brightness-125"
                style={{ borderColor: nav.color, height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px' }}>{nav.icon}</div>
                <div className="font-pixel" style={{ fontSize: '7px', color: nav.color, letterSpacing: '1px' }}>{nav.label}</div>
                <div style={{ fontSize: '14px', color: 'var(--dim)' }}>{nav.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Training points reminder */}
        {wrestler.training_points > 0 && (
          <div className="mt-6 p-4 flex items-center gap-4"
            style={{ background: 'rgba(0,255,136,0.05)', border: '2px solid var(--green)' }}>
            <span style={{ fontSize: '24px' }}>💪</span>
            <span style={{ color: 'var(--green)' }}>
              Hai <strong>{wrestler.training_points} training point</strong> disponibili! Vai in palestra ad allenarti.
            </span>
            <Link href="/backstage" className="ml-auto">
              <button className="font-pixel" style={{ fontSize: '8px', background: 'var(--green)', color: '#000', border: 'none', padding: '8px 14px', cursor: 'pointer' }}>
                VAI ▶
              </button>
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}
