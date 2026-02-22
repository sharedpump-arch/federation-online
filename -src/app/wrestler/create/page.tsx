'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ===== TYPES =====
type Build = 'slim' | 'normal' | 'heavy'
type HairStyle = 'short' | 'long' | 'mohawk' | 'bald' | 'ponytail'
type CostumeType = 'trunks' | 'tights' | 'singlet' | 'shorts'
type BootsType = 'short' | 'tall' | 'bare'
type Accessory = 'none' | 'mask' | 'bandana' | 'glasses'
type Attitude = 'face' | 'heel' | 'neutral'

interface AppearanceState {
  gender: 'M' | 'F'
  build: Build
  skin_color: string
  skin_dark: string
  hair_style: HairStyle
  hair_color: string
  costume_type: CostumeType
  costume_color: string
  boots_type: BootsType
  accessory: Accessory
}

interface Stats {
  strength: number
  agility: number
  endurance: number
  technique: number
  charisma: number
}

const STAT_MAX = 85
const STAT_TOTAL_MAX = 350
const STAT_DEFAULT = 60

// ===== AVATAR DRAW =====
function drawWrestler(canvas: HTMLCanvasElement, appearance: AppearanceState) {
  const ctxOrNull = canvas.getContext('2d')
  if (!ctxOrNull) return
  const ctx = ctxOrNull
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, 64, 64)

  const { skin_color: s, skin_dark: sd, costume_color: cc, build, hair_style, hair_color, boots_type, accessory, costume_type } = appearance
  const bw = build === 'heavy' ? 2 : build === 'slim' ? -2 : 0

  function px(x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)
  }

  function dk(hex: string, amt = 40): string {
    const r = parseInt(hex.slice(1, 3), 16) || 0
    const g = parseInt(hex.slice(3, 5), 16) || 0
    const b = parseInt(hex.slice(5, 7), 16) || 0
    return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`
  }

  function lt(hex: string, amt = 30): string {
    const r = parseInt(hex.slice(1, 3), 16) || 0
    const g = parseInt(hex.slice(3, 5), 16) || 0
    const b = parseInt(hex.slice(5, 7), 16) || 0
    return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`
  }

  const bootColor = dk(cc, 60)

  // Feet
  const bootH = boots_type === 'tall' ? 10 : boots_type === 'bare' ? 0 : 5
  if (boots_type !== 'bare') {
    px(20 + bw, 52 - bootH + 1, 8, bootH, bootColor)
    px(34 - bw, 52 - bootH + 1, 8, bootH, bootColor)
  }
  px(19 + bw, 52, 10, 4, boots_type !== 'bare' ? bootColor : sd)
  px(33 - bw, 52, 10, 4, boots_type !== 'bare' ? bootColor : sd)

  // Legs
  if (costume_type === 'tights' || costume_type === 'singlet') {
    px(20 + bw, 38, 8, 14, cc)
    px(34 - bw, 38, 8, 14, cc)
  } else {
    px(20 + bw, 38, 8, 14, s)
    px(34 - bw, 38, 8, 14, s)
  }

  // Trunks / shorts
  if (costume_type === 'trunks' || costume_type === 'shorts') {
    const trunkH = costume_type === 'shorts' ? 12 : 8
    px(18 + bw, 34, 26 - bw * 2, trunkH, cc)
    px(18 + bw, 34, 26 - bw * 2, 2, lt(cc, 20))
  }

  // Torso
  const torsoColor = costume_type === 'singlet' ? cc : s
  px(18 + bw, 18, 26 - bw * 2, 16, torsoColor)
  if (appearance.gender === 'M') {
    px(20 + bw, 20, 10, 6, lt(s, 10))
    px(32 - bw, 20, 10, 6, lt(s, 10))
    px(20 + bw, 26, 22 - bw * 2, 2, sd)
  }

  // Arms
  px(10 + bw, 19, 8, 16, s)
  px(44 - bw, 19, 8, 16, s)
  px(11 + bw, 27, 6, 4, sd)
  px(45 - bw, 27, 6, 4, sd)
  px(10 + bw, 35, 8, 6, sd)
  px(44 - bw, 35, 8, 6, sd)

  // Head
  px(22, 4, 20, 22, s)
  px(20, 6, 3, 6, sd)
  px(41, 6, 3, 6, sd)
  px(25, 10, 4, 3, '#1a1a1a')
  px(35, 10, 4, 3, '#1a1a1a')
  px(26, 10, 2, 2, '#fff')
  px(36, 10, 2, 2, '#fff')
  px(31, 16, 2, 3, sd)

  // Mouth
  px(27, 21, 10, 2, sd)
  px(27, 20, 2, 2, sd)
  px(35, 20, 2, 2, sd)
  px(24, 23, 16, 2, sd)
  px(24, 5, 6, 3, lt(s, 25))

  // Hair
  if (hair_style !== 'bald') {
    const hc = hair_color
    if (hair_style === 'short') {
      px(22, 4, 20, 7, hc)
      px(20, 6, 3, 4, hc)
      px(41, 6, 3, 4, hc)
    } else if (hair_style === 'long') {
      px(22, 4, 20, 7, hc)
      px(19, 6, 3, 16, hc)
      px(42, 6, 3, 16, hc)
    } else if (hair_style === 'mohawk') {
      px(29, 0, 6, 8, hc)
      px(30, -2, 4, 4, hc)
    } else if (hair_style === 'ponytail') {
      px(22, 4, 20, 7, hc)
      px(42, 4, 4, 20, hc)
    }
  }

  // Accessory
  if (accessory === 'mask') {
    px(22, 4, 20, 22, cc)
    px(25, 10, 4, 3, '#000')
    px(35, 10, 4, 3, '#000')
    px(26, 9, 4, 5, lt(cc, 40))
    px(34, 9, 4, 5, lt(cc, 40))
    px(29, 18, 6, 4, lt(cc, 30))
    px(31, 4, 2, 22, dk(cc, 30))
  } else if (accessory === 'bandana') {
    px(22, 4, 20, 5, cc)
    px(42, 5, 4, 3, cc)
  } else if (accessory === 'glasses') {
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(25, 9, 6, 5)
    ctx.strokeRect(33, 9, 6, 5)
    px(31, 11, 2, 1, '#333')
  }
}

// ===== MAIN COMPONENT =====
export default function CreateWrestlerPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(1) // 1=appearance, 2=identity, 3=stats
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [appearance, setAppearance] = useState<AppearanceState>({
    gender: 'M',
    build: 'normal',
    skin_color: '#f5c5a3',
    skin_dark: '#e8a882',
    hair_style: 'short',
    hair_color: '#2c1810',
    costume_type: 'trunks',
    costume_color: '#ff2d55',
    boots_type: 'short',
    accessory: 'none',
  })

  const [identity, setIdentity] = useState({
    name: '',
    nickname: '',
    nationality: '',
    bio: '',
    attitude: 'face' as Attitude,
  })

  const [stats, setStats] = useState<Stats>({
    strength: STAT_DEFAULT,
    agility: STAT_DEFAULT,
    endurance: STAT_DEFAULT,
    technique: STAT_DEFAULT,
    charisma: STAT_DEFAULT,
  })

  useEffect(() => {
    if (canvasRef.current) drawWrestler(canvasRef.current, appearance)
  }, [appearance])

  const totalStats = Object.values(stats).reduce((a, b) => a + b, 0)

  function updateStat(key: keyof Stats, val: number) {
    const newStats = { ...stats, [key]: val }
    const newTotal = Object.values(newStats).reduce((a, b) => a + b, 0)
    if (newTotal <= STAT_TOTAL_MAX) setStats(newStats)
  }

  async function handleSave() {
    if (!identity.name.trim()) { setError('Inserisci il nome del wrestler!'); return }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error: err } = await supabase.from('wrestlers').insert({
      user_id: user.id,
      name: identity.name.trim(),
      nickname: identity.nickname.trim(),
      nationality: identity.nationality.trim(),
      bio: identity.bio.trim(),
      attitude: identity.attitude,
      gender: appearance.gender,
      strength: stats.strength,
      agility: stats.agility,
      endurance: stats.endurance,
      technique: stats.technique,
      charisma: stats.charisma,
      appearance: {
        gender: appearance.gender,
        build: appearance.build,
        skin_color: appearance.skin_color,
        hair_style: appearance.hair_style,
        hair_color: appearance.hair_color,
        costume_type: appearance.costume_type,
        costume_color: appearance.costume_color,
        boots_type: appearance.boots_type,
        accessory: appearance.accessory,
      },
      momentum: 50,
      over_fans: 10,
      training_points: 5,
    })

    if (err) {
      setError('Errore: ' + err.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  // ===== RENDER =====
  const skinTones = [
    { light: '#f5c5a3', dark: '#e8a882' },
    { light: '#e8a882', dark: '#c8845a' },
    { light: '#c68642', dark: '#a06030' },
    { light: '#8d5524', dark: '#6b3a18' },
    { light: '#4a2c12', dark: '#2e1a08' },
  ]

  const hairColors = ['#2c1810', '#c8a060', '#e0e0e0', '#ff2d55', '#ffd700', '#4444ff']
  const costumeColors = ['#ff2d55', '#ffd700', '#0055ff', '#00cc44', '#aa00ff', '#111111', '#ffffff', '#ff6600']

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--panel)', borderBottom: '2px solid var(--accent)', padding: '12px 20px' }}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <span className="font-pixel" style={{ fontSize: '10px', color: 'var(--accent)' }}>⚡ FEDERATION ONLINE</span>
          <span className="font-pixel" style={{ fontSize: '8px', color: 'var(--gold)' }}>CREA IL TUO WRESTLER</span>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="font-pixel" style={{
                fontSize: '8px', padding: '4px 8px',
                background: step === s ? 'var(--accent)' : 'var(--border)',
                color: step === s ? '#fff' : 'var(--dim)'
              }}>{s}</div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">

        {/* STEP LABELS */}
        <div className="flex gap-4 mb-6 text-center">
          {[
            { n: 1, label: 'ASPETTO' },
            { n: 2, label: 'IDENTITÀ' },
            { n: 3, label: 'STATISTICHE' },
          ].map(s => (
            <div key={s.n} className="flex-1 font-pixel" style={{ fontSize: '8px', color: step === s.n ? 'var(--gold)' : 'var(--dim)', letterSpacing: '1px' }}>
              {step === s.n ? '▶ ' : ''}{s.label}
            </div>
          ))}
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: step === 1 ? '1fr 280px 1fr' : '1fr' }}>

          {/* STEP 1 — APPEARANCE */}
          {step === 1 && <>

            {/* LEFT OPTIONS */}
            <div className="game-panel overflow-hidden">
              <div className="font-pixel text-xs p-3" style={{ background: 'var(--accent)', color: '#000' }}>▶ ASPETTO</div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>GENERE</div>
                <div className="flex">
                  {(['M', 'F'] as const).map(g => (
                    <button key={g} onClick={() => setAppearance(a => ({ ...a, gender: g }))}
                      className="flex-1 font-pixel" style={{ fontSize: '10px', padding: '8px', border: 'none', cursor: 'pointer', background: appearance.gender === g ? 'var(--accent)' : 'var(--border)', color: appearance.gender === g ? '#000' : 'var(--dim)' }}>
                      {g === 'M' ? '♂ MASCHILE' : '♀ FEMMINILE'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>CORPORATURA</div>
                <div className="flex gap-2">
                  {(['slim', 'normal', 'heavy'] as Build[]).map(b => (
                    <button key={b} onClick={() => setAppearance(a => ({ ...a, build: b }))}
                      style={{ flex: 1, padding: '6px', border: `2px solid ${appearance.build === b ? 'var(--accent)' : 'var(--border)'}`, background: appearance.build === b ? 'var(--accent)' : '#1a1a2a', color: appearance.build === b ? '#000' : 'var(--text)', cursor: 'pointer', fontFamily: 'VT323, monospace', fontSize: '16px' }}>
                      {b.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>CARNAGIONE</div>
                <div className="flex gap-2">
                  {skinTones.map(t => (
                    <div key={t.light} onClick={() => setAppearance(a => ({ ...a, skin_color: t.light, skin_dark: t.dark }))}
                      style={{ width: '32px', height: '32px', background: t.light, border: `3px solid ${appearance.skin_color === t.light ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>CAPELLI</div>
                <div className="flex flex-wrap gap-2">
                  {(['short', 'long', 'mohawk', 'bald', 'ponytail'] as HairStyle[]).map(h => (
                    <button key={h} onClick={() => setAppearance(a => ({ ...a, hair_style: h }))}
                      style={{ padding: '5px 8px', border: `2px solid ${appearance.hair_style === h ? 'var(--accent)' : 'var(--border)'}`, background: appearance.hair_style === h ? 'var(--accent)' : '#1a1a2a', color: appearance.hair_style === h ? '#000' : 'var(--text)', cursor: 'pointer', fontFamily: 'VT323, monospace', fontSize: '15px' }}>
                      {h.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>COLORE CAPELLI</div>
                <div className="flex gap-2">
                  {hairColors.map(c => (
                    <div key={c} onClick={() => setAppearance(a => ({ ...a, hair_color: c }))}
                      style={{ width: '28px', height: '28px', background: c, border: `3px solid ${appearance.hair_color === c ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER PREVIEW */}
            <div className="flex flex-col items-center gap-4">
              <div style={{ background: '#1a1a2e', border: '3px solid var(--accent)', padding: '20px', boxShadow: '0 0 30px rgba(255,45,85,0.2)' }}>
                <canvas ref={canvasRef} width={64} height={64} style={{ display: 'block', imageRendering: 'pixelated', width: '192px', height: '192px' }} />
              </div>
              <div className="font-pixel text-center" style={{ fontSize: '9px', color: 'var(--gold)' }}>
                {identity.name.toUpperCase() || '???'}
              </div>
              <button onClick={() => setStep(2)} className="btn-gold w-full font-pixel" style={{ fontSize: '9px' }}>
                AVANTI ▶
              </button>
            </div>

            {/* RIGHT OPTIONS */}
            <div className="game-panel overflow-hidden">
              <div className="font-pixel text-xs p-3" style={{ background: 'var(--gold)', color: '#000' }}>▶ COSTUME</div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>TIPO COSTUME</div>
                <div className="flex flex-wrap gap-2">
                  {(['trunks', 'tights', 'singlet', 'shorts'] as CostumeType[]).map(c => (
                    <button key={c} onClick={() => setAppearance(a => ({ ...a, costume_type: c }))}
                      style={{ padding: '5px 8px', border: `2px solid ${appearance.costume_type === c ? 'var(--gold)' : 'var(--border)'}`, background: appearance.costume_type === c ? 'var(--gold)' : '#1a1a2a', color: appearance.costume_type === c ? '#000' : 'var(--text)', cursor: 'pointer', fontFamily: 'VT323, monospace', fontSize: '15px' }}>
                      {c.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>COLORE COSTUME</div>
                <div className="flex flex-wrap gap-2">
                  {costumeColors.map(c => (
                    <div key={c} onClick={() => setAppearance(a => ({ ...a, costume_color: c }))}
                      style={{ width: '28px', height: '28px', background: c, border: `3px solid ${appearance.costume_color === c ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>SCARPE</div>
                <div className="flex gap-2">
                  {(['short', 'tall', 'bare'] as BootsType[]).map(b => (
                    <button key={b} onClick={() => setAppearance(a => ({ ...a, boots_type: b }))}
                      style={{ flex: 1, padding: '6px', border: `2px solid ${appearance.boots_type === b ? 'var(--gold)' : 'var(--border)'}`, background: appearance.boots_type === b ? 'var(--gold)' : '#1a1a2a', color: appearance.boots_type === b ? '#000' : 'var(--text)', cursor: 'pointer', fontFamily: 'VT323, monospace', fontSize: '15px' }}>
                      {b.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px' }}>
                <div className="font-pixel mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>ACCESSORI</div>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'mask', 'bandana', 'glasses'] as Accessory[]).map(acc => (
                    <button key={acc} onClick={() => setAppearance(a => ({ ...a, accessory: acc }))}
                      style={{ padding: '5px 8px', border: `2px solid ${appearance.accessory === acc ? 'var(--gold)' : 'var(--border)'}`, background: appearance.accessory === acc ? 'var(--gold)' : '#1a1a2a', color: appearance.accessory === acc ? '#000' : 'var(--text)', cursor: 'pointer', fontFamily: 'VT323, monospace', fontSize: '15px' }}>
                      {acc.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>}

          {/* STEP 2 — IDENTITY */}
          {step === 2 && (
            <div className="max-w-xl mx-auto w-full">
              <div className="game-panel p-6 flex flex-col gap-5">
                <div className="font-pixel mb-2" style={{ fontSize: '10px', color: 'var(--gold)' }}>IDENTITÀ DEL WRESTLER</div>

                {[
                  { key: 'name', label: 'NOME RING *', placeholder: 'es. THE CRUSHER', required: true },
                  { key: 'nickname', label: 'SOPRANNOME', placeholder: 'es. The Unstoppable Force' },
                  { key: 'nationality', label: 'NAZIONALITÀ', placeholder: 'es. Italia' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="font-pixel block mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>{f.label}</label>
                    <input className="game-input" placeholder={f.placeholder}
                      value={identity[f.key as keyof typeof identity]}
                      onChange={e => setIdentity(i => ({ ...i, [f.key]: e.target.value }))} />
                  </div>
                ))}

                <div>
                  <label className="font-pixel block mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>BIO / STORIA</label>
                  <textarea className="game-input" placeholder="Racconta la storia del tuo wrestler..." rows={4}
                    value={identity.bio}
                    onChange={e => setIdentity(i => ({ ...i, bio: e.target.value }))}
                    style={{ resize: 'vertical' }} />
                </div>

                <div>
                  <label className="font-pixel block mb-2" style={{ fontSize: '7px', color: 'var(--dim)' }}>ATTITUDINE</label>
                  <div className="flex gap-3">
                    {([
                      { val: 'face', label: '😇 FACE', desc: 'Buono, amato dal pubblico' },
                      { val: 'heel', label: '😈 HEEL', desc: 'Cattivo, odiato dal pubblico' },
                      { val: 'neutral', label: '😐 NEUTRAL', desc: 'Ambiguo, imprevedibile' },
                    ] as { val: Attitude, label: string, desc: string }[]).map(a => (
                      <button key={a.val} onClick={() => setIdentity(i => ({ ...i, attitude: a.val }))}
                        style={{ flex: 1, padding: '10px 6px', border: `2px solid ${identity.attitude === a.val ? 'var(--accent)' : 'var(--border)'}`, background: identity.attitude === a.val ? 'rgba(255,45,85,0.15)' : '#1a1a2a', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{a.label.split(' ')[0]}</div>
                        <div className="font-pixel" style={{ fontSize: '7px', color: identity.attitude === a.val ? 'var(--accent)' : 'var(--dim)' }}>{a.val.toUpperCase()}</div>
                        <div style={{ fontSize: '13px', color: 'var(--dim)', marginTop: '3px' }}>{a.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-primary flex-1" style={{ fontSize: '9px' }}>◀ INDIETRO</button>
                  <button onClick={() => { if (!identity.name.trim()) { setError('Inserisci il nome!'); return } setError(''); setStep(3) }} className="btn-gold flex-1" style={{ fontSize: '9px' }}>AVANTI ▶</button>
                </div>
                {error && <div style={{ color: 'var(--accent)', fontSize: '15px' }}>⚠ {error}</div>}
              </div>
            </div>
          )}

          {/* STEP 3 — STATS */}
          {step === 3 && (
            <div className="max-w-xl mx-auto w-full">
              <div className="game-panel p-6">
                <div className="font-pixel mb-4" style={{ fontSize: '10px', color: 'var(--gold)' }}>DISTRIBUISCI LE STATISTICHE</div>

                {/* Total bar */}
                <div style={{ background: '#0a0a15', border: '2px solid var(--gold)', padding: '10px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--dim)' }}>PUNTI TOTALI</span>
                  <span className="font-pixel" style={{ fontSize: '14px', color: totalStats > STAT_TOTAL_MAX ? 'var(--accent)' : 'var(--gold)' }}>
                    {totalStats} / {STAT_TOTAL_MAX}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {(Object.entries(stats) as [keyof Stats, number][]).map(([key, val]) => {
                    const labels: Record<keyof Stats, string> = { strength: 'FORZA', agility: 'AGILITÀ', endurance: 'RESISTENZA', technique: 'TECNICA', charisma: 'CARISMA' }
                    const cost = val >= 75 ? 2 : 1
                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="font-pixel" style={{ fontSize: '8px', color: 'var(--dim)' }}>{labels[key]}</span>
                          <span className="font-pixel" style={{ fontSize: '10px', color: 'var(--gold)' }}>{val} / {STAT_MAX}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="range" min={30} max={STAT_MAX} value={val}
                            onChange={e => updateStat(key, parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--accent)' }} />
                        </div>
                        <div style={{ height: '8px', background: '#0a0a15', border: '1px solid var(--border)', marginTop: '4px' }}>
                          <div style={{ height: '100%', width: `${(val / STAT_MAX) * 100}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
                        </div>
                        {val >= 75 && <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '2px' }}>★ Alto livello — crescita più lenta</div>}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(0,255,136,0.05)', border: '1px solid var(--green)', fontSize: '14px', color: 'var(--dim)' }}>
                  💡 Max {STAT_MAX} per stat. Totale max {STAT_TOTAL_MAX}. Le stat cresceranno allenandoti nel backstage.
                </div>

                {error && <div style={{ color: 'var(--accent)', fontSize: '15px', marginTop: '10px' }}>⚠ {error}</div>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="btn-primary flex-1" style={{ fontSize: '9px' }}>◀ INDIETRO</button>
                  <button onClick={handleSave} disabled={saving} className="btn-gold flex-1" style={{ fontSize: '9px', opacity: saving ? 0.6 : 1 }}>
                    {saving ? '⏳ SALVATAGGIO...' : '▶ ENTRA NEL RING'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}