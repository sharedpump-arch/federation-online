'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Wrestler } from '@/types'

type Tab = 'card' | 'results' | 'standings'

interface ShowData {
  id: string
  name: string
  date: string
  arena: string
  status: string
  week_number: number
}

interface MatchData {
  id: string
  segment_id: string
  match_type: string
  completed: boolean
  result: number | null // 1 or 2
  w1: Wrestler
  w2: Wrestler
  rivalry: number
  votes: number
  narration: string | null
}

interface PromoData {
  id: string
  wrestler_name: string
  votes: number
  completed: boolean
}

// ===== PBP GENERATOR =====
function generatePBP(w1name: string, w2name: string, winner: 1 | 2, matchType: string): string[] {
  const wName = winner === 1 ? w1name : w2name
  const lName = winner === 1 ? w2name : w1name
  const moves = ['Suplex', 'DDT', 'Clothesline', 'Powerbomb', 'Dropkick', 'Piledriver', 'Moonsault', 'Spear']
  const rm = () => moves[Math.floor(Math.random() * moves.length)]

  return [
    `🔔 DING DING DING! Il match inizia!`,
    `${w1name} apre con un ${rm()} rapido.`,
    `${w2name} risponde con un ${rm()} devastante!`,
    `👥 Il pubblico è in piedi!`,
    `${wName} prende il controllo con un ${rm()}.`,
    `⚡ PIN! 1... 2... SPALLATA!`,
    `${lName} tenta la rimonta con un ${rm()}!`,
    `⚡ PIN! 1... 2... KICKOUT all'ultimo secondo!`,
    `👥 "THIS IS AWESOME!" scandisce la folla.`,
    `${wName} esegue il suo finisher — ${rm()} devastante!`,
    `⚡ PIN! 1... 2... 3!!!`,
    `🏆 IL VINCITORE È: ${wName.toUpperCase()}!`,
  ]
}

export default function ShowPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('card')
  const [show, setShow] = useState<ShowData | null>(null)
  const [matches, setMatches] = useState<MatchData[]>([])
  const [promos, setPromos] = useState<PromoData[]>([])
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [myWrestler, setMyWrestler] = useState<Wrestler | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<MatchData | null>(null)
  const [pbpLines, setPbpLines] = useState<string[]>([])
  const [pbpIndex, setPbpIndex] = useState(0)
  const [simulating, setSimulating] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!simulating || !activeMatch) return
    const lines = generatePBP(
      activeMatch.w1.name, activeMatch.w2.name,
      (Math.random() > 0.5 ? 1 : 2) as 1 | 2,
      activeMatch.match_type
    )
    let idx = 0
    const interval = setInterval(() => {
      if (idx >= lines.length) {
        clearInterval(interval)
        setSimulating(false)
        const winner = lines[lines.length - 1].includes(activeMatch.w1.name) ? 1 : 2
        completeMatch(activeMatch.id, winner)
        return
      }
      setPbpLines(prev => [...prev, lines[idx]])
      idx++
    }, 700)
    return () => clearInterval(interval)
  }, [simulating])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: w } = await supabase.from('wrestlers').select('*').eq('user_id', user.id).single()
    setMyWrestler(w)

    // Load weekly show
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .eq('type', 'weekly')
      .order('date', { ascending: true })
      .limit(1)

    if (shows && shows.length > 0) {
      setShow(shows[0])
      await loadSegments(shows[0].id)
    }

    // Load all wrestlers for standings
    const { data: allW } = await supabase.from('wrestlers').select('*').order('wins', { ascending: false })
    setWrestlers(allW || [])

    setLoading(false)
  }

  async function loadSegments(showId: string) {
    const supabase = createClient()
    const { data: segments } = await supabase
      .from('show_segments')
      .select('*')
      .eq('show_id', showId)
      .order('order_index')

    if (!segments || segments.length === 0) {
      // Generate demo matches from wrestlers
      const { data: ws } = await supabase.from('wrestlers').select('*').limit(6)
      if (ws && ws.length >= 2) {
        const demoMatches: MatchData[] = []
        for (let i = 0; i < Math.min(3, Math.floor(ws.length / 2)); i++) {
          demoMatches.push({
            id: `demo-${i}`,
            segment_id: `seg-${i}`,
            match_type: '1vs1',
            completed: false,
            result: null,
            w1: ws[i * 2],
            w2: ws[i * 2 + 1],
            rivalry: Math.floor(Math.random() * 150) + 50,
            votes: Math.floor(Math.random() * 200) + 50,
            narration: null,
          })
        }
        setMatches(demoMatches)
        setPromos([
          { id: 'p1', wrestler_name: ws[0]?.name || 'Wrestler', votes: 134, completed: false },
          { id: 'p2', wrestler_name: ws[1]?.name || 'Wrestler', votes: 89, completed: false },
        ])
      }
    }
  }

  async function completeMatch(matchId: string, winner: number) {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, completed: true, result: winner } : m
    ))
    if (activeMatch) {
      showToast(`🏆 ${winner === 1 ? activeMatch.w1.name : activeMatch.w2.name} VINCE!`)
    }
  }

  function startSim(match: MatchData) {
    if (match.completed) return
    setActiveMatch(match)
    setPbpLines([`🔔 ${match.w1.name} vs ${match.w2.name} — Il match sta per iniziare!`])
    setPbpIndex(0)
    setSimulating(true)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="font-pixel" style={{ fontSize: '10px', color: 'var(--gold)' }}>⏳ CARICAMENTO SHOW...</div>
    </main>
  )

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(180deg, #1a0010 0%, var(--panel) 100%)', borderBottom: '3px solid var(--accent)', padding: '20px', textAlign: 'center', position: 'relative' }}>
        <Link href="/dashboard" className="font-pixel" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '8px', color: 'var(--dim)' }}>◀ DASHBOARD</Link>
        <div className="font-pixel" style={{ fontSize: '8px', color: 'var(--dim)', letterSpacing: '4px', marginBottom: '8px' }}>WEEKLY SHOW</div>
        <div className="font-pixel" style={{ fontSize: 'clamp(16px, 3vw, 28px)', color: 'var(--accent)', textShadow: '0 0 20px rgba(255,45,85,0.5), 3px 3px 0 #7a0020', letterSpacing: '3px' }}>
          ⚡ {show?.name || 'THUNDER NIGHT'} ⚡
        </div>
        <div style={{ fontSize: '17px', color: 'var(--dim)', marginTop: '6px' }}>
          {show ? `${new Date(show.date).toLocaleDateString('it-IT')} — ${show.arena || 'Arena'}` : 'EPISODE 31'}
          <span style={{ marginLeft: '16px', color: 'var(--accent)' }}>🔴 LIVE</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '2px solid var(--border)', background: 'var(--panel)' }}>
        {(['card', 'results', 'standings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="font-pixel flex-1"
            style={{ fontSize: '8px', padding: '12px', border: 'none', background: 'transparent', color: tab === t ? 'var(--gold)' : 'var(--dim)', borderBottom: `3px solid ${tab === t ? 'var(--gold)' : 'transparent'}`, cursor: 'pointer', letterSpacing: '1px' }}>
            {t === 'card' ? '📋 CARD' : t === 'results' ? '🏆 RISULTATI' : '📊 CLASSIFICHE'}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>

        {/* CARD TAB */}
        {tab === 'card' && <>
          <div className="flex justify-between items-center mb-4">
            <div className="font-pixel" style={{ fontSize: '10px', color: 'var(--accent)' }}>MATCH CARD</div>
            <div className="font-pixel" style={{ fontSize: '8px', background: 'var(--accent)', color: '#fff', padding: '5px 10px', animation: 'pulse 1.5s infinite' }}>🔴 LIVE</div>
          </div>

          {matches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</div>
              <div className="font-pixel" style={{ fontSize: '9px' }}>NESSUN MATCH PROGRAMMATO</div>
              <div style={{ marginTop: '10px' }}>Vai nel Backstage → Ufficio GM per fare richieste!</div>
            </div>
          ) : matches.map((m, i) => (
            <div key={m.id} style={{ background: 'var(--panel)', border: `2px solid ${i === 0 ? 'var(--gold)' : 'var(--border)'}`, marginBottom: '12px', cursor: m.completed ? 'default' : 'pointer', position: 'relative' }}
              onClick={() => !m.completed && startSim(m)}>
              {i === 0 && <div className="font-pixel" style={{ background: 'var(--gold)', color: '#000', fontSize: '7px', padding: '4px 10px' }}>★ MAIN EVENT</div>}
              {m.completed && <div className="font-pixel" style={{ position: 'absolute', top: i === 0 ? '26px' : '6px', right: '8px', background: 'var(--green)', color: '#000', fontSize: '7px', padding: '4px 8px' }}>✓ COMPLETATO</div>}

              <div className="flex items-center" style={{ padding: '14px', gap: '0' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div className="font-pixel" style={{ fontSize: '8px', color: m.completed && m.result === 1 ? 'var(--green)' : 'var(--text)', opacity: m.completed && m.result === 2 ? 0.4 : 1, letterSpacing: '1px', lineHeight: '1.5' }}>{m.w1.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--dim)', marginTop: '3px' }}>{m.w1.wins}W-{m.w1.losses}L</div>
                  <div style={{ fontSize: '14px', color: 'var(--gold)' }}>OVER: {m.w1.over_fans}</div>
                  {m.completed && m.result === 1 && <div style={{ color: 'var(--green)', fontSize: '20px', marginTop: '4px' }}>👑</div>}
                </div>
                <div style={{ width: '70px', textAlign: 'center', flexShrink: 0 }}>
                  <div className="font-pixel" style={{ fontSize: '14px', color: 'var(--accent)', textShadow: '0 0 8px rgba(255,45,85,0.5)' }}>VS</div>
                  <div style={{ fontSize: '13px', color: 'var(--dim)', marginTop: '4px' }}>{m.match_type}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div className="font-pixel" style={{ fontSize: '8px', color: m.completed && m.result === 2 ? 'var(--green)' : 'var(--text)', opacity: m.completed && m.result === 1 ? 0.4 : 1, letterSpacing: '1px', lineHeight: '1.5' }}>{m.w2.name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--dim)', marginTop: '3px' }}>{m.w2.wins}W-{m.w2.losses}L</div>
                  <div style={{ fontSize: '14px', color: 'var(--gold)' }}>OVER: {m.w2.over_fans}</div>
                  {m.completed && m.result === 2 && <div style={{ color: 'var(--green)', fontSize: '20px', marginTop: '4px' }}>👑</div>}
                </div>
              </div>
              <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--accent)' }}>⚔️ FAIDA: {m.rivalry}</span>
                <span style={{ color: 'var(--dim)' }}>👍 {m.votes} voti {!m.completed && '— Clicca per simulare'}</span>
              </div>
            </div>
          ))}

          {/* Promos */}
          {promos.length > 0 && <>
            <div className="font-pixel mt-6 mb-3" style={{ fontSize: '9px', color: 'var(--dim)' }}>SEGMENTI PROMO</div>
            {promos.map(p => (
              <div key={p.id} style={{ background: 'var(--panel)', border: '2px solid var(--border)', borderLeft: '4px solid var(--blue)', padding: '12px 14px', marginBottom: '8px', cursor: 'pointer' }}
                onClick={() => { setPromos(prev => prev.map(x => x.id === p.id ? { ...x, completed: true } : x)); showToast('🎤 CROWD POP!') }}>
                <div className="flex justify-between">
                  <div className="font-pixel" style={{ fontSize: '8px', color: 'var(--blue)' }}>🎤 PROMO — {p.wrestler_name.toUpperCase()}</div>
                  <div style={{ fontSize: '14px', color: 'var(--dim)' }}>👍 {p.votes} {p.completed ? '✅' : ''}</div>
                </div>
              </div>
            ))}
          </>}
        </>}

        {/* RESULTS TAB */}
        {tab === 'results' && <>
          {matches.filter(m => m.completed).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--dim)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <div className="font-pixel" style={{ fontSize: '9px' }}>NESSUN RISULTATO ANCORA</div>
              <div style={{ marginTop: '10px' }}>Vai nella CARD e simula i match!</div>
            </div>
          ) : matches.filter(m => m.completed).map(m => (
            <div key={m.id} style={{ background: 'var(--panel)', border: `2px solid ${m.result === 1 ? m.w1.attitude === 'face' ? 'var(--green)' : 'var(--accent)' : 'var(--blue)'}`, padding: '16px', marginBottom: '12px' }}>
              <div className="flex justify-around items-center">
                <div style={{ textAlign: 'center', opacity: m.result === 2 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--text)' }}>{m.w1.name}</div>
                  {m.result === 1 && <div style={{ color: 'var(--gold)', fontSize: '22px', marginTop: '4px' }}>👑 VINCITORE</div>}
                </div>
                <div className="font-pixel" style={{ fontSize: '12px', color: 'var(--accent)' }}>VS</div>
                <div style={{ textAlign: 'center', opacity: m.result === 1 ? 0.4 : 1 }}>
                  <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--text)' }}>{m.w2.name}</div>
                  {m.result === 2 && <div style={{ color: 'var(--gold)', fontSize: '22px', marginTop: '4px' }}>👑 VINCITORE</div>}
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* STANDINGS TAB */}
        {tab === 'standings' && <>
          <div className="font-pixel mb-4" style={{ fontSize: '10px', color: 'var(--accent)' }}>CLASSIFICA GENERALE</div>
          {wrestlers.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: 'var(--panel)', border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border)'}`, marginBottom: '6px' }}>
              <div className="font-pixel" style={{ fontSize: '14px', color: i === 0 ? 'var(--gold)' : 'var(--dim)', width: '24px' }}>#{i + 1}</div>
              <div className="font-pixel flex-1" style={{ fontSize: '8px', lineHeight: '1.5' }}>{w.name}</div>
              <div style={{ color: 'var(--green)', fontSize: '16px' }}>{w.wins}W</div>
              <div style={{ color: 'var(--accent)', fontSize: '16px' }}>{w.losses}L</div>
              <div style={{ color: 'var(--gold)', fontSize: '16px' }}>OVER: {w.over_fans}</div>
            </div>
          ))}
        </>}
      </div>

      {/* PBP Modal */}
      {activeMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--panel)', border: '3px solid var(--gold)', width: '100%', maxWidth: '640px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(90deg, #1a1000, var(--panel))', borderBottom: '2px solid var(--gold)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--gold)' }}>{activeMatch.w1.name} VS {activeMatch.w2.name}</div>
              <button onClick={() => { setActiveMatch(null); setPbpLines([]) }}
                style={{ background: 'var(--accent)', border: 'none', color: '#fff', fontFamily: 'Press Start 2P, monospace', fontSize: '8px', padding: '7px 12px', cursor: 'pointer' }}>
                ✕ CHIUDI
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {pbpLines.map((line, i) => (
                <div key={i} style={{
                  padding: '6px 0', borderBottom: '1px solid rgba(34,34,58,0.5)', lineHeight: '1.5',
                  color: line.startsWith('🏆') ? 'var(--gold)' : line.startsWith('⚡') ? 'var(--accent)' : line.startsWith('👥') ? 'var(--dim)' : 'var(--text)',
                  fontFamily: line.startsWith('🏆') ? 'Press Start 2P, monospace' : 'VT323, monospace',
                  fontSize: line.startsWith('🏆') ? '11px' : '17px',
                }}>
                  {line}
                </div>
              ))}
            </div>
            {!simulating && activeMatch.completed && (
              <div style={{ padding: '12px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button onClick={() => { setActiveMatch(null); setPbpLines([]) }}
                  className="btn-gold font-pixel" style={{ fontSize: '9px', padding: '10px 20px' }}>
                  ✓ CHIUDI
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="font-pixel" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel)', border: '2px solid var(--green)', color: 'var(--green)', fontSize: '9px', padding: '12px 20px', zIndex: 9998, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </main>
  )
}
