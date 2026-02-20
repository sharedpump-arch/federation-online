'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Wrestler } from '@/types'

type Room = 'map' | 'locker' | 'gym' | 'fans' | 'gm'

interface Message {
  id: string
  wrestler_id: string
  wrestler_name: string
  content: string
  created_at: string
}

interface GMRequest {
  id: string
  requester_id: string
  requester_name: string
  type: string
  description: string
  votes_up: number
  votes_down: number
  status: string
}

const STAT_LABELS: Record<string, string> = {
  strength: 'FORZA',
  agility: 'AGILITÀ',
  endurance: 'RESISTENZA',
  technique: 'TECNICA',
  charisma: 'CARISMA',
}

const STAT_KEYS = ['strength', 'agility', 'endurance', 'technique', 'charisma']

export default function BackstagePage() {
  const router = useRouter()
  const [room, setRoom] = useState<Room>('map')
  const [wrestler, setWrestler] = useState<Wrestler | null>(null)
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [gmRequests, setGMRequests] = useState<GMRequest[]>([])
  const [chatInput, setChatInput] = useState('')
  const [gmType, setGMType] = useState('match_1v1')
  const [gmDesc, setGMDesc] = useState('')
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [fanActionsUsed, setFanActionsUsed] = useState<string[]>([])
  const [myVotes, setMyVotes] = useState<Record<string, number>>({})
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Load my wrestler
    const { data: w } = await supabase
      .from('wrestlers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!w) { router.push('/wrestler/create'); return }
    setWrestler(w)

    // Load all wrestlers
    const { data: all } = await supabase
      .from('wrestlers')
      .select('*')
      .neq('user_id', user.id)
    setWrestlers(all || [])

    // Load locker room messages
    await loadMessages()

    // Load GM requests
    await loadGMRequests()

    setLoading(false)
  }

  async function loadMessages() {
    const supabase = createClient()
    const { data } = await supabase
      .from('backstage_messages')
      .select('id, wrestler_id, content, created_at, wrestlers(name)')
      .eq('room', 'locker_room')
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        wrestler_id: m.wrestler_id,
        wrestler_name: m.wrestlers?.name || 'Unknown',
        content: m.content,
        created_at: m.created_at,
      })))
    }
  }

  async function loadGMRequests() {
    const supabase = createClient()
    const { data } = await supabase
      .from('gm_requests')
      .select('id, requester_id, type, description, votes_up, votes_down, status, wrestlers(name)')
      .eq('status', 'voting')
      .order('votes_up', { ascending: false })

    if (data) {
      setGMRequests(data.map((r: any) => ({
        id: r.id,
        requester_id: r.requester_id,
        requester_name: r.wrestlers?.name || 'Unknown',
        type: r.type,
        description: r.description,
        votes_up: r.votes_up,
        votes_down: r.votes_down,
        status: r.status,
      })))
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function sendMessage() {
    if (!chatInput.trim() || !wrestler) return
    const supabase = createClient()
    const { error } = await supabase.from('backstage_messages').insert({
      wrestler_id: wrestler.id,
      room: 'locker_room',
      content: chatInput.trim(),
    })
    if (!error) {
      setChatInput('')
      await loadMessages()
    }
  }

  async function trainStat(key: string) {
    if (!wrestler) return
    const current = wrestler![key as keyof Wrestler] as number
    if (current >= 85 || wrestler!.training_points <= 0) return

    const cost = current >= 75 ? 2 : 1
    if (wrestler!.training_points < cost) {
      showToast('⚠ Training points insufficienti!')
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('wrestlers')
      .update({
        [key]: current + 1,
        training_points: wrestler!.training_points - cost,
      })
      .eq('id', wrestler!.id)

    if (!error) {
      setWrestler(w => w ? { ...w, [key]: current + 1, training_points: w.training_points - cost } : w)
      showToast(`💪 ${STAT_LABELS[key]} aumentata a ${current + 1}!`)
    }
  }

  async function doFanAction(actionId: string, gain: number) {
    if (!wrestler || fanActionsUsed.includes(actionId)) return
    const supabase = createClient()
    const newOver = Math.min(100, wrestler!.over_fans + gain)
    const { error } = await supabase
      .from('wrestlers')
      .update({ over_fans: newOver })
      .eq('id', wrestler!.id)

    if (!error) {
      setWrestler(w => w ? { ...w, over_fans: newOver } : w)
      setFanActionsUsed(f => [...f, actionId])
      showToast(`📣 OVER +${gain}! Ora sei a ${newOver}/100`)
    }
  }

  async function submitGMRequest() {
    if (!wrestler || !gmDesc.trim()) { showToast('⚠ Inserisci i dettagli!'); return }

    // Find current show
    const supabase = createClient()
    const { data: shows } = await supabase
      .from('shows')
      .select('id')
      .in('status', ['upcoming', 'voting'])
      .order('date', { ascending: true })
      .limit(1)

    if (!shows || shows.length === 0) { showToast('⚠ Nessuno show attivo!'); return }

    const { error } = await supabase.from('gm_requests').insert({
      show_id: shows[0].id,
      requester_id: wrestler.id,
      type: gmType,
      description: gmDesc.trim(),
      votes_up: 0,
      votes_down: 0,
      status: 'voting',
    })

    if (!error) {
      setGMDesc('')
      await loadGMRequests()
      showToast('✅ Richiesta inviata al GM!')
    } else {
      showToast('⚠ Errore: ' + error.message)
    }
  }

  async function vote(requestId: string, dir: 1 | -1) {
    if (!wrestler || myVotes[requestId]) { showToast('⚠ Hai già votato!'); return }
    const supabase = createClient()

    // Insert vote
    const { error } = await supabase.from('gm_request_votes').insert({
      request_id: requestId,
      voter_wrestler_id: wrestler.id,
      vote: dir,
    })

    if (error) { showToast('⚠ ' + error.message); return }

    // Update count
    const req = gmRequests.find(r => r.id === requestId)
    if (req) {
      await supabase.from('gm_requests').update({
        votes_up: dir === 1 ? req.votes_up + 1 : req.votes_up,
        votes_down: dir === -1 ? req.votes_down + 1 : req.votes_down,
      }).eq('id', requestId)
    }

    setMyVotes(v => ({ ...v, [requestId]: dir }))
    await loadGMRequests()
    showToast(dir === 1 ? '👍 Voto positivo!' : '👎 Voto negativo!')
  }

  async function addRelation(otherWrestler: Wrestler, type: 'friendship' | 'rivalry') {
    if (!wrestler) return
    const supabase = createClient()
    const a = wrestler.id < otherWrestler.id ? wrestler.id : otherWrestler.id
    const b = wrestler.id < otherWrestler.id ? otherWrestler.id : wrestler.id

    // Upsert relationship
    const { data: existing } = await supabase
      .from('relationships')
      .select('*')
      .eq('wrestler_a_id', a)
      .eq('wrestler_b_id', b)
      .single()

    if (existing) {
      const update = type === 'friendship'
        ? { friendship_value: Math.min(500, existing.friendship_value + 15) }
        : { rivalry_value: Math.min(500, existing.rivalry_value + 20) }
      await supabase.from('relationships').update(update).eq('id', existing.id)
    } else {
      await supabase.from('relationships').insert({
        wrestler_a_id: a,
        wrestler_b_id: b,
        friendship_value: type === 'friendship' ? 15 : 0,
        rivalry_value: type === 'rivalry' ? 20 : 0,
      })
    }

    showToast(type === 'friendship' ? `👊 Alleanza +15 con ${otherWrestler.name}!` : `⚔️ Faida +20 con ${otherWrestler.name}!`)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="font-pixel text-xs" style={{ color: 'var(--gold)', letterSpacing: '2px' }}>⏳ CARICAMENTO...</div>
    </main>
  )

  if (!wrestler) return null
  const w = wrestler as NonNullable<typeof wrestler>

  // ===== RENDER ROOMS =====
  function renderMap() {
    const rooms = [
      { id: 'locker', icon: '🚪', label: 'LOCKER ROOM', sub: 'Chat & interazioni', color: 'var(--blue)', pos: { left: '8%', top: '20%' } },
      { id: 'gym', icon: '🏋️', label: 'PALESTRA', sub: 'Allena le stat', color: 'var(--green)', pos: { left: '38%', top: '15%' } },
      { id: 'fans', icon: '📣', label: 'ZONA FAN', sub: 'Aumenta il tuo Over', color: 'var(--gold)', pos: { left: '68%', top: '20%' } },
      { id: 'gm', icon: '📋', label: 'UFFICIO GM', sub: 'Richieste show', color: 'var(--accent)', pos: { left: '38%', top: '57%' } },
    ]

    return (
      <div style={{ position: 'relative', flex: 1, background: '#16162a', backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
        <div className="font-pixel" style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', fontSize: '8px', color: 'var(--dim)', letterSpacing: '2px' }}>
          [ BACKSTAGE MAP — CLICCA UNA STANZA ]
        </div>
        {rooms.map(r => (
          <div key={r.id} onClick={() => setRoom(r.id as Room)}
            style={{ position: 'absolute', ...r.pos, width: '190px', height: '160px', cursor: 'pointer' }}>
            <div style={{ width: '100%', height: '100%', border: `3px solid ${r.color}`, background: '#1e1e2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'filter 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.4)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}>
              <div style={{ fontSize: '32px' }}>{r.icon}</div>
              <div className="font-pixel" style={{ fontSize: '7px', color: r.color, letterSpacing: '1px' }}>{r.label}</div>
              <div style={{ fontSize: '14px', color: 'var(--dim)' }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderLocker() {
    return (
      <div className="flex flex-col h-full">
        <div style={{ padding: '10px', background: '#1a1a2a', borderBottom: '1px solid var(--border)', fontSize: '15px', color: 'var(--dim)' }}>
          👥 {wrestlers.length > 0 ? wrestlers.map(w => w.name).join(', ') : 'Nessun altro wrestler online'}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--dim)', textAlign: 'center', padding: '20px' }}>Nessun messaggio ancora. Rompi il ghiaccio!</div>
          )}
          {messages.map(m => (
            <div key={m.id} style={{ background: '#1a1a2a', borderLeft: `3px solid ${m.wrestler_id === wrestler?.id ? 'var(--gold)' : 'var(--blue)'}`, padding: '8px 10px' }}>
              <div className="font-pixel" style={{ fontSize: '7px', color: m.wrestler_id === wrestler?.id ? 'var(--gold)' : 'var(--blue)', marginBottom: '3px' }}>{m.wrestler_name}</div>
              <div style={{ fontSize: '17px' }}>{m.content}</div>
              <div style={{ fontSize: '12px', color: 'var(--dim)', marginTop: '2px' }}>{new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Relation buttons */}
        {wrestlers.length > 0 && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '13px', color: 'var(--dim)', marginBottom: '6px' }}>INTERAGISCI CON {wrestlers[0].name.toUpperCase()}:</div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => addRelation(wrestlers[0], 'friendship')}
                style={{ flex: 1, background: 'transparent', border: '2px solid var(--green)', color: 'var(--green)', fontFamily: 'VT323, monospace', fontSize: '15px', padding: '5px', cursor: 'pointer' }}>
                👊 +ALLEANZA
              </button>
              <button onClick={() => addRelation(wrestlers[0], 'rivalry')}
                style={{ flex: 1, background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', fontFamily: 'VT323, monospace', fontSize: '15px', padding: '5px', cursor: 'pointer' }}>
                ⚔️ +FAIDA
              </button>
            </div>
          </div>
        )}

        {/* Chat input */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '6px' }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Scrivi qualcosa nel backstage..."
            style={{ flex: 1, background: '#0a0a15', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '8px 10px', outline: 'none' }} />
          <button onClick={sendMessage}
            style={{ background: 'var(--blue)', border: 'none', color: '#000', fontFamily: 'Press Start 2P, monospace', fontSize: '8px', padding: '8px 12px', cursor: 'pointer' }}>
            SEND
          </button>
        </div>
      </div>
    )
  }

  function renderGym() {
    return (
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {/* Points display */}
        <div style={{ background: '#0a0a15', border: '2px solid var(--gold)', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--dim)' }}>TRAINING POINTS</span>
          <span className="font-pixel" style={{ fontSize: '16px', color: w.training_points > 0 ? 'var(--gold)' : 'var(--accent)' }}>
            {w.training_points} / 5
          </span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--dim)', marginBottom: '16px', lineHeight: '1.6' }}>
          I training points si rigenerano ogni settimana. Avvicinarsi al cap (85) costa 2 punti per +1.
        </div>

        {STAT_KEYS.map(key => {
          const val = w[key as keyof Wrestler] as number
          const atCap = val >= 85
          const cost = val >= 75 ? 2 : 1
          const canTrain = !atCap && w.training_points >= cost

          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--border)', marginBottom: '14px' }}>
              <div style={{ width: '85px', color: 'var(--dim)', fontSize: '15px', flexShrink: 0 }}>{STAT_LABELS[key]}</div>
              <div style={{ flex: 1, height: '12px', background: '#0a0a15', border: '1px solid var(--border)' }}>
                <div style={{ height: '100%', width: `${(val / 85) * 100}%`, background: atCap ? 'var(--gold)' : 'var(--green)', transition: 'width 0.3s' }} />
              </div>
              <div className="font-pixel" style={{ width: '30px', textAlign: 'right', fontSize: '10px', color: 'var(--gold)' }}>{val}</div>
              <button onClick={() => trainStat(key)} disabled={!canTrain}
                style={{ background: 'transparent', border: `2px solid ${canTrain ? 'var(--green)' : 'var(--border)'}`, color: canTrain ? 'var(--green)' : 'var(--border)', fontFamily: 'VT323, monospace', fontSize: '15px', padding: '4px 8px', cursor: canTrain ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                {atCap ? '★ CAP' : `+1 (${cost}pt)`}
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  function renderFans() {
    const actions = [
      { id: 'autograph', label: '✍️ Firma autografi', gain: 8 },
      { id: 'promo', label: '🎤 Fai un mini-promo', gain: 15 },
      { id: 'meet', label: '📸 Meet & Greet', gain: 12 },
    ]

    return (
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {/* Over meter */}
        <div style={{ background: '#0a0a15', border: '2px solid var(--gold)', padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--dim)', marginBottom: '6px' }}>POPOLARITÀ (OVER)</div>
          <div style={{ height: '18px', background: '#1a1a2a', border: '1px solid var(--border)', marginBottom: '4px' }}>
            <div style={{ height: '100%', width: `${w.over_fans}%`, background: 'linear-gradient(90deg, var(--gold), var(--accent))', transition: 'width 0.5s' }} />
          </div>
          <div className="font-pixel" style={{ fontSize: '12px', color: 'var(--gold)' }}>{w.over_fans} / 100</div>
        </div>

        <div style={{ fontSize: '14px', color: 'var(--dim)', marginBottom: '10px' }}>AZIONI DISPONIBILI OGGI:</div>
        <div className="flex flex-col gap-3 mb-6">
          {actions.map(a => {
            const used = fanActionsUsed.includes(a.id)
            return (
              <button key={a.id} onClick={() => doFanAction(a.id, a.gain)} disabled={used}
                style={{ background: '#1a1a2a', border: `2px solid ${used ? 'var(--border)' : 'var(--gold)'}`, color: used ? 'var(--dim)' : 'var(--text)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '12px 14px', cursor: used ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>{a.label} {used ? '✅' : ''}</span>
                <span style={{ color: used ? 'var(--dim)' : 'var(--green)' }}>{used ? 'FATTO' : `+${a.gain} OVER`}</span>
              </button>
            )
          })}
        </div>

        <div style={{ padding: '12px', background: '#1a1a28', border: '1px solid var(--border)', fontSize: '15px', color: 'var(--dim)', lineHeight: '1.6' }}>
          💡 Le azioni si resettano ogni settimana. Più over hai, più voti riceverai sulle richieste GM.
        </div>
      </div>
    )
  }

  function renderGM() {
    return (
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {/* Request form */}
        <div style={{ background: '#1a1a2a', border: '2px solid var(--accent)', padding: '14px', marginBottom: '16px' }}>
          <div className="font-pixel mb-3" style={{ fontSize: '8px', color: 'var(--accent)' }}>▶ NUOVA RICHIESTA AL GM</div>
          <div className="flex flex-col gap-3">
            <select value={gmType} onChange={e => setGMType(e.target.value)}
              style={{ background: '#0a0a15', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '7px 10px', outline: 'none', width: '100%' }}>
              <option value="match_1v1">Match 1vs1</option>
              <option value="match_tag">Match Tag Team</option>
              <option value="promo">Promo</option>
              <option value="interview">Intervista</option>
              <option value="special_segment">Segmento speciale</option>
            </select>
            <input value={gmDesc} onChange={e => setGMDesc(e.target.value)}
              placeholder="es. Sfido DARK PHOENIX in un 1vs1..."
              style={{ background: '#0a0a15', border: '2px solid var(--border)', color: 'var(--text)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '7px 10px', outline: 'none', width: '100%' }} />
            <button onClick={submitGMRequest}
              style={{ background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', fontFamily: 'Press Start 2P, monospace', fontSize: '8px', padding: '10px', cursor: 'pointer', width: '100%' }}>
              ▶ INVIA RICHIESTA
            </button>
          </div>
        </div>

        {/* Voting board */}
        <div className="font-pixel mb-3" style={{ fontSize: '8px', color: 'var(--dim)', letterSpacing: '1px' }}>
          BACHECA VOTAZIONI ({gmRequests.length} richieste)
        </div>
        {gmRequests.length === 0 && (
          <div style={{ color: 'var(--dim)', textAlign: 'center', padding: '20px' }}>Nessuna richiesta attiva. Sii il primo!</div>
        )}
        {gmRequests.map(r => (
          <div key={r.id} style={{ background: '#1a1a2a', border: '1px solid var(--border)', padding: '10px', marginBottom: '8px' }}>
            <div style={{ fontSize: '17px', marginBottom: '3px' }}>{r.description}</div>
            <div style={{ fontSize: '13px', color: 'var(--dim)', marginBottom: '8px' }}>
              Tipo: {r.type.replace('_', ' ').toUpperCase()} • Da: {r.requester_name}
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => vote(r.id, 1)} disabled={!!myVotes[r.id] || r.requester_id === w.id}
                style={{ background: 'transparent', border: '2px solid var(--green)', color: 'var(--green)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '3px 10px', cursor: 'pointer' }}>
                👍 {r.votes_up}
              </button>
              <button onClick={() => vote(r.id, -1)} disabled={!!myVotes[r.id] || r.requester_id === w.id}
                style={{ background: 'transparent', border: '2px solid var(--accent)', color: 'var(--accent)', fontFamily: 'VT323, monospace', fontSize: '18px', padding: '3px 10px', cursor: 'pointer' }}>
                👎 {r.votes_down}
              </button>
              {myVotes[r.id] && <span style={{ color: 'var(--green)', fontSize: '14px' }}>✓ VOTATO</span>}
              {r.requester_id === w.id && <span style={{ color: 'var(--dim)', fontSize: '14px' }}>TUA RICHIESTA</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const roomConfig: Record<Room, { icon: string, title: string, sub: string, color: string }> = {
    map: { icon: '🏟️', title: 'BACKSTAGE', sub: 'Seleziona una stanza', color: 'var(--dim)' },
    locker: { icon: '🚪', title: 'LOCKER ROOM', sub: 'Chat & Interazioni', color: 'var(--blue)' },
    gym: { icon: '🏋️', title: 'PALESTRA', sub: 'Allenamento', color: 'var(--green)' },
    fans: { icon: '📣', title: 'ZONA FAN', sub: 'Interazione fan', color: 'var(--gold)' },
    gm: { icon: '📋', title: 'UFFICIO GM', sub: 'Richieste show', color: 'var(--accent)' },
  }

  const rc = roomConfig[room]

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--panel)', borderBottom: '2px solid var(--accent)', padding: '10px 20px', flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="font-pixel" style={{ fontSize: '10px', color: 'var(--accent)' }}>⚡ FEDERATION</Link>
          <div className="flex gap-4" style={{ fontSize: '17px' }}>
            <span style={{ color: 'var(--gold)' }}>{w.name}</span>
            <span style={{ color: 'var(--dim)' }}>OVER: <span style={{ color: 'var(--green)' }}>{w.over_fans}</span></span>
            <span style={{ color: 'var(--dim)' }}>TP: <span style={{ color: 'var(--gold)' }}>{w.training_points}/5</span></span>
          </div>
          <Link href="/dashboard" className="font-pixel" style={{ fontSize: '8px', color: 'var(--dim)' }}>◀ DASHBOARD</Link>
        </div>
      </header>

      {/* Layout */}
      <div className="flex" style={{ flex: 1, height: 'calc(100vh - 54px)', overflow: 'hidden' }}>

        {/* Map / Room content */}
        <div className="flex" style={{ flex: 1, overflow: 'hidden' }}>
          {room === 'map' ? renderMap() : (
            <div className="flex flex-col" style={{ flex: 1, overflow: 'hidden' }}>
              <button onClick={() => setRoom('map')}
                style={{ padding: '8px 14px', background: 'var(--border)', border: 'none', color: 'var(--dim)', fontFamily: 'VT323, monospace', fontSize: '16px', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}>
                ◀ TORNA ALLA MAPPA
              </button>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {room === 'locker' && renderLocker()}
                {room === 'gym' && renderGym()}
                {room === 'fans' && renderFans()}
                {room === 'gm' && renderGM()}
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: '260px', background: 'var(--panel)', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '2px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '24px' }}>{rc.icon}</span>
            <div>
              <div className="font-pixel" style={{ fontSize: '8px', color: rc.color }}>{rc.title}</div>
              <div style={{ fontSize: '14px', color: 'var(--dim)', marginTop: '2px' }}>{rc.sub}</div>
            </div>
          </div>

          {/* Quick nav */}
          <div style={{ padding: '10px' }}>
            <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)', letterSpacing: '1px' }}>STANZE</div>
            {(['locker', 'gym', 'fans', 'gm'] as Room[]).map(r => (
              <button key={r} onClick={() => setRoom(r)}
                style={{ width: '100%', background: room === r ? 'rgba(255,45,85,0.1)' : 'transparent', border: `1px solid ${room === r ? 'var(--accent)' : 'var(--border)'}`, color: room === r ? 'var(--accent)' : 'var(--dim)', fontFamily: 'VT323, monospace', fontSize: '17px', padding: '7px 10px', cursor: 'pointer', textAlign: 'left', marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {roomConfig[r].icon} {roomConfig[r].title}
              </button>
            ))}
          </div>

          {/* My wrestler stats */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>IL TUO WRESTLER</div>
            <div style={{ fontSize: '16px', color: 'var(--gold)', marginBottom: '6px' }}>{w.name}</div>
            {STAT_KEYS.slice(0, 3).map(k => (
              <div key={k} className="flex justify-between" style={{ fontSize: '14px', color: 'var(--dim)', marginBottom: '2px' }}>
                <span>{STAT_LABELS[k]}</span>
                <span style={{ color: 'var(--text)' }}>{w[k as keyof Wrestler] as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="font-pixel" style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--panel)', border: '2px solid var(--green)', color: 'var(--green)', fontSize: '9px', padding: '12px 20px', zIndex: 9998, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </main>
  )
}
