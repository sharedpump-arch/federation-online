'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Wrestler } from '@/types'

type Tab = 'card' | 'lore' | 'results'

interface PLEMatch {
  id: string
  type: 'main-event' | 'title-match' | 'special' | 'normal'
  badge: string
  stipulation: string
  stipDesc: string
  w1: Wrestler
  w2: Wrestler
  rivalry: number
  lore: string
  completed: boolean
  result: number | null
}

function generatePLEPBP(w1: string, w2: string, stipulation: string): string[] {
  const winner = Math.random() > 0.5 ? w1 : w2
  const loser = winner === w1 ? w2 : w1
  const moves = ['Suplex', 'DDT', 'Powerbomb', 'Moonsault', 'Spear', 'Piledriver']
  const rm = () => moves[Math.floor(Math.random() * moves.length)]

  const baseLines = [
    `📖 Mesi di faida culminano in questo momento epico.`,
    `🔔 DING DING DING! Il match premium inizia!`,
    `${w1} e ${w2} si fissano — l'odio è palpabile.`,
    `${w1} apre con un ${rm()} brutale!`,
    `${w2} risponde con un ${rm()} devastante!`,
    `👥 "THIS IS AWESOME!" — la folla esplode!`,
  ]

  const stipLines: Record<string, string[]> = {
    'LAST MAN STANDING': [
      `⚡ ${winner} scaraventa ${loser} fuori dal ring! Conteggio: 1...2...3... Si rialza!`,
      `⚡ SEDIA DI FERRO! ${winner} colpisce ${loser}!`,
      `⚡ ${loser} è a terra! 1...2...3...4...5...6...7...8... SI RIALZA! INCREDIBILE!`,
      `⚡ ${winner} esegue il finisher — ${rm()} definitivo!`,
      `🏆 ${winner.toUpperCase()} VINCE! ${loser} non riesce ad alzarsi dopo il conteggio di 10!`,
    ],
    'STEEL CAGE': [
      `⚡ ${w1} sbatte ${w2} contro le sbarre della gabbia!`,
      `⚡ ${w2} tenta di scalare la gabbia! Viene recuperato!`,
      `⚡ PIN! 1...2... KICKOUT! La gabbia non ha fatto differenza!`,
      `⚡ ${winner} raggiunge la porta — ${loser} lo blocca per un soffio!`,
      `🏆 ${winner.toUpperCase()} ESCE DALLA GABBIA E VINCE!`,
    ],
    'LADDER MATCH': [
      `⚡ ${w1} usa la scala come ariete contro ${w2}!`,
      `⚡ ${w2} vola dall'alto della scala con uno SPLASH!`,
      `⚡ Entrambi sulla cima — scambio di pugni a 3 metri!`,
      `⚡ ${winner} spinge ${loser} giù dalla scala!`,
      `🏆 ${winner.toUpperCase()} STACCA LA VALIGETTA! HA VINTO!`,
    ],
  }

  const key = Object.keys(stipLines).find(k => stipulation.toUpperCase().includes(k)) || 'LAST MAN STANDING'
  return [...baseLines, ...stipLines[key]]
}

export default function PremiumEventPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('card')
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [matches, setMatches] = useState<PLEMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<PLEMatch | null>(null)
  const [pbpLines, setPbpLines] = useState<string[]>([])
  const [simulating, setSimulating] = useState(false)
  const [toast, setToast] = useState('')
  const [countdown, setCountdown] = useState({ d: '08', h: '14', m: '32', s: '00' })

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    const target = new Date('2026-03-28T20:00:00')
    const timer = setInterval(() => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { clearInterval(timer); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown({ d: String(d).padStart(2, '0'), h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!simulating || !activeMatch) return
    const lines = generatePLEPBP(activeMatch.w1.name, activeMatch.w2.name, activeMatch.stipulation)
    let idx = 0
    const interval = setInterval(() => {
      if (idx >= lines.length) {
        clearInterval(interval)
        setSimulating(false)
        const lastLine = lines[lines.length - 1]
        const winner = lastLine.includes(activeMatch.w1.name.toUpperCase()) ? 1 : 2
        setMatches(prev => prev.map(m => m.id === activeMatch.id ? { ...m, completed: true, result: winner } : m))
        setActiveMatch(prev => prev ? { ...prev, completed: true, result: winner } : null)
        showToast(`🏆 ${winner === 1 ? activeMatch.w1.name : activeMatch.w2.name} VINCE A NIGHT OF GLORY!`)
        return
      }
      setPbpLines(prev => [...prev, lines[idx]])
      idx++
    }, 750)
    return () => clearInterval(interval)
  }, [simulating])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: ws } = await supabase.from('wrestlers').select('*').order('wins', { ascending: false })
    setWrestlers(ws || [])

    // Build demo PLE matches from top wrestlers
    if (ws && ws.length >= 4) {
      const stipulations = [
        { type: 'main-event' as const, badge: '★ MAIN EVENT', stip: 'LAST MAN STANDING', desc: 'Si vince solo se l\'avversario non si rialza entro il conteggio di 10. Nessuna squalifica.' },
        { type: 'title-match' as const, badge: '🏆 TITLE MATCH', stip: 'STEEL CAGE', desc: 'La gabbia d\'acciaio circonda il ring. Si vince per pin, submission o uscendo dalla gabbia.' },
        { type: 'special' as const, badge: '🪜 LADDER MATCH', stip: 'LADDER MATCH', desc: 'Un oggetto è appeso sopra il ring. Si vince scalando la scala e staccandolo. Tutto è lecito.' },
      ]

      const pleMatches: PLEMatch[] = stipulations.map((s, i) => ({
        id: `ple-${i}`,
        type: s.type,
        badge: s.badge,
        stipulation: s.stip,
        stipDesc: s.desc,
        w1: ws[i * 2] || ws[0],
        w2: ws[i * 2 + 1] || ws[1],
        rivalry: Math.floor(Math.random() * 150) + 100,
        lore: `Una faida epica tra ${ws[i * 2]?.name || '???'} e ${ws[i * 2 + 1]?.name || '???'} che dura da settimane. Stasera si decide tutto.`,
        completed: false,
        result: null,
      }))
      setMatches(pleMatches)
    }

    setLoading(false)
  }

  function startSim(match: PLEMatch) {
    if (match.completed) return
    setActiveMatch(match)
    setPbpLines([`🔔 ${match.w1.name} vs ${match.w2.name} — ${match.stipulation}`])
    setSimulating(true)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="font-pixel" style={{ fontSize: '10px', color: 'var(--gold)' }}>⏳ CARICAMENTO...</div>
    </main>
  )

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Hero */}
      <div style={{ background: 'radial-gradient(ellipse at center top, rgba(255,215,0,0.12) 0%, transparent 70%)', borderBottom: '3px solid var(--gold)', padding: '30px 20px', textAlign: 'center', position: 'relative' }}>
        <Link href="/dashboard" className="font-pixel" style={{ position: 'absolute', left: '20px', top: '20px', fontSize: '8px', color: 'var(--dim)' }}>◀ DASHBOARD</Link>
        <div className="font-pixel" style={{ fontSize: '8px', background: 'var(--gold)', color: '#000', padding: '5px 14px', display: 'inline-block', marginBottom: '14px', letterSpacing: '2px' }}>★ PREMIUM LIVE EVENT ★</div>
        <div className="font-pixel" style={{ fontSize: 'clamp(18px, 4vw, 32px)', color: 'var(--gold)', textShadow: '0 0 40px rgba(255,215,0,0.5), 4px 4px 0 #7a5000', letterSpacing: '4px', marginBottom: '8px' }}>
          ⚡ NIGHT OF GLORY ⚡
        </div>
        <div style={{ fontSize: '20px', color: 'var(--accent)', letterSpacing: '6px', marginBottom: '14px' }}>WHERE LEGENDS ARE BORN</div>
        <div style={{ fontSize: '16px', color: 'var(--dim)' }}>28 MAR 2026 — Mediolanum Forum, Assago</div>

        {/* Countdown */}
        <div style={{ display: 'inline-flex', gap: '20px', marginTop: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--gold)', padding: '10px 24px' }}>
          {[['d', 'GIORNI'], ['h', 'ORE'], ['m', 'MIN'], ['s', 'SEC']].map(([k, l]) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div className="font-pixel" style={{ fontSize: '22px', color: 'var(--gold)' }}>{countdown[k as keyof typeof countdown]}</div>
              <div style={{ fontSize: '12px', color: 'var(--dim)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '2px solid var(--border)', background: 'var(--panel)' }}>
        {(['card', 'lore', 'results'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className="font-pixel flex-1"
            style={{ fontSize: '8px', padding: '12px', border: 'none', background: 'transparent', color: tab === t ? 'var(--gold)' : 'var(--dim)', borderBottom: `3px solid ${tab === t ? 'var(--gold)' : 'transparent'}`, cursor: 'pointer' }}>
            {t === 'card' ? '📋 CARD' : t === 'lore' ? '📖 LORE' : '🏆 RISULTATI'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>

        {/* CARD */}
        {tab === 'card' && matches.map((m, i) => (
          <div key={m.id} onClick={() => !m.completed && startSim(m)}
            style={{ marginBottom: '16px', cursor: m.completed ? 'default' : 'pointer', transition: 'transform 0.1s' }}
            onMouseEnter={e => { if (!m.completed) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
            <div style={{ border: `2px solid ${m.type === 'main-event' ? 'var(--gold)' : m.type === 'title-match' ? 'var(--purple)' : 'var(--accent)'}`, background: 'var(--panel)', overflow: 'hidden', boxShadow: `0 0 20px ${m.type === 'main-event' ? 'rgba(255,215,0,0.1)' : 'rgba(255,45,85,0.08)'}` }}>
              {/* Top bar */}
              <div style={{ height: '4px', background: `linear-gradient(90deg, var(--accent), var(--gold))` }} />
              <div className="flex justify-between items-center" style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel" style={{ fontSize: '7px', background: m.type === 'main-event' ? 'var(--gold)' : m.type === 'title-match' ? 'var(--purple)' : 'var(--accent)', color: m.type === 'title-match' ? '#fff' : '#000', padding: '4px 10px' }}>{m.badge}</div>
                <div style={{ fontSize: '15px', color: 'var(--dim)' }}>📜 {m.stipulation}</div>
                <div style={{ fontSize: '14px', color: 'var(--accent)' }}>⚔️ FAIDA: <span style={{ color: 'var(--accent)' }}>{m.rivalry}</span></div>
              </div>

              {/* Wrestlers */}
              <div className="flex">
                <div style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid var(--border)', opacity: m.completed && m.result === 2 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px', color: m.completed && m.result === 1 ? 'var(--green)' : 'var(--text)', letterSpacing: '1px', lineHeight: '1.6' }}>{m.w1.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--dim)', marginTop: '4px' }}>{m.w1.wins}W-{m.w1.losses}L</div>
                  <div style={{ fontSize: '14px', color: 'var(--gold)' }}>OVER: {m.w1.over_fans}</div>
                  {m.completed && m.result === 1 && <div style={{ fontSize: '24px', marginTop: '6px' }}>👑</div>}
                </div>
                <div style={{ width: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', flexShrink: 0 }}>
                  <div className="font-pixel" style={{ fontSize: '16px', color: 'var(--accent)', textShadow: '0 0 10px rgba(255,45,85,0.5)' }}>VS</div>
                  <div style={{ fontSize: '12px', color: 'var(--dim)', textAlign: 'center' }}>{m.rivalry}pt faida</div>
                </div>
                <div style={{ flex: 1, padding: '16px', textAlign: 'center', opacity: m.completed && m.result === 1 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px', color: m.completed && m.result === 2 ? 'var(--green)' : 'var(--text)', letterSpacing: '1px', lineHeight: '1.6' }}>{m.w2.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--dim)', marginTop: '4px' }}>{m.w2.wins}W-{m.w2.losses}L</div>
                  <div style={{ fontSize: '14px', color: 'var(--gold)' }}>OVER: {m.w2.over_fans}</div>
                  {m.completed && m.result === 2 && <div style={{ fontSize: '24px', marginTop: '6px' }}>👑</div>}
                </div>
              </div>

              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--dim)' }}>
                <span>{m.completed ? '✓ COMPLETATO' : '🖱️ Clicca per simulare'}</span>
                <span style={{ color: 'var(--gold)' }}>★ PREMIUM EVENT</span>
              </div>
            </div>
          </div>
        ))}

        {/* LORE */}
        {tab === 'lore' && <>
          <div className="font-pixel mb-4" style={{ fontSize: '9px', color: 'var(--purple)', letterSpacing: '2px' }}>📖 STORIA DELLE FAIDE</div>
          {matches.map(m => (
            <div key={m.id} style={{ background: 'var(--panel)', border: '2px solid var(--border)', borderLeft: '4px solid var(--purple)', padding: '16px', marginBottom: '12px' }}>
              <div className="font-pixel mb-3" style={{ fontSize: '8px', color: 'var(--gold)' }}>{m.w1.name} vs {m.w2.name}</div>
              <div style={{ fontSize: '17px', lineHeight: '1.7', color: 'var(--text)', marginBottom: '10px' }}>{m.lore}</div>
              <div className="font-pixel" style={{ fontSize: '7px', color: 'var(--dim)' }}>📜 {m.stipulation}</div>
            </div>
          ))}
        </>}

        {/* RESULTS */}
        {tab === 'results' && <>
          {matches.filter(m => m.completed).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏆</div>
              <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--gold)' }}>L'EVENTO NON È ANCORA INIZIATO</div>
              <div style={{ marginTop: '10px' }}>Simula i match dalla CARD!</div>
            </div>
          ) : matches.filter(m => m.completed).map(m => (
            <div key={m.id} style={{ background: 'var(--panel)', border: `2px solid ${m.result === 1 ? 'var(--gold)' : 'var(--blue)'}`, padding: '20px', marginBottom: '12px' }}>
              <div className="font-pixel mb-3" style={{ fontSize: '8px', color: 'var(--gold)' }}>{m.badge} — {m.stipulation}</div>
              <div className="flex justify-around items-center">
                <div style={{ textAlign: 'center', opacity: m.result === 2 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px' }}>{m.w1.name}</div>
                  {m.result === 1 && <div style={{ color: 'var(--gold)', fontSize: '24px', marginTop: '6px' }}>👑 VINCITORE</div>}
                </div>
                <div className="font-pixel" style={{ fontSize: '12px', color: 'var(--accent)' }}>VS</div>
                <div style={{ textAlign: 'center', opacity: m.result === 1 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px' }}>{m.w2.name}</div>
                  {m.result === 2 && <div style={{ color: 'var(--gold)', fontSize: '24px', marginTop: '6px' }}>👑 VINCITORE</div>}
                </div>
              </div>
            </div>
          ))}
        </>}
      </div>

      {/* PBP Modal */}
      {activeMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--panel)', border: '3px solid var(--gold)', boxShadow: '0 0 60px rgba(255,215,0,0.2)', width: '100%', maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(90deg, #1a1200, var(--panel))', borderBottom: '2px solid var(--gold)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--gold)' }}>{activeMatch.w1.name} VS {activeMatch.w2.name}</div>
                <div style={{ fontSize: '16px', color: 'var(--accent)', marginTop: '3px' }}>📜 {activeMatch.stipulation}</div>
              </div>
              <button onClick={() => { setActiveMatch(null); setPbpLines([]) }}
                style={{ background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'Press Start 2P, monospace', fontSize: '8px', padding: '8px 12px', cursor: 'pointer' }}>
                ✕ CHIUDI
              </button>
            </div>

            {/* Stip info */}
            <div style={{ padding: '10px 16px', background: 'rgba(255,45,85,0.06)', borderBottom: '1px solid var(--border)', fontSize: '15px', color: 'var(--dim)' }}>
              <strong style={{ color: 'var(--accent)' }}>REGOLE: </strong>{activeMatch.stipDesc}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {pbpLines.map((line, i) => (
                <div key={i} style={{
                  padding: '6px 0', borderBottom: '1px solid rgba(34,34,58,0.5)', lineHeight: '1.5',
                  color: line.startsWith('🏆') ? 'var(--gold)' : line.startsWith('⚡') ? 'var(--accent)' : line.startsWith('📖') ? 'var(--purple)' : line.startsWith('👥') ? 'var(--dim)' : 'var(--text)',
                  fontFamily: line.startsWith('🏆') ? 'Press Start 2P, monospace' : 'VT323, monospace',
                  fontSize: line.startsWith('🏆') ? '10px' : '17px',
                  fontStyle: line.startsWith('📖') ? 'italic' : 'normal',
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="font-pixel" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel)', border: '2px solid var(--gold)', color: 'var(--gold)', fontSize: '9px', padding: '12px 20px', zIndex: 9998, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </main>
  )
}
