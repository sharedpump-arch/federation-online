'use client'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a20 0%, #0a0a0f 70%)' }}>

      {/* Stars */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          radial-gradient(1px 1px at 10% 20%, rgba(255,215,0,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 60% 15%, rgba(255,215,0,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.2) 0%, transparent 100%),
          radial-gradient(1px 1px at 50% 75%, rgba(255,215,0,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 100%),
          radial-gradient(1px 1px at 90% 70%, rgba(255,215,0,0.3) 0%, transparent 100%)
        `
      }} />

      {/* Logo */}
      <div className="text-center mb-12 relative z-10">
        <div className="font-pixel text-xs mb-4" style={{ color: 'var(--dim)', letterSpacing: '4px' }}>
          ★ BENVENUTO IN ★
        </div>
        <h1 className="font-pixel mb-4" style={{
          fontSize: 'clamp(20px, 5vw, 42px)',
          color: 'var(--gold)',
          textShadow: '0 0 40px rgba(255,215,0,0.5), 4px 4px 0 #7a5000',
          letterSpacing: '4px',
          lineHeight: '1.4'
        }}>
          ⚡ FEDERATION<br/>ONLINE ⚡
        </h1>
        <p style={{ color: 'var(--accent)', fontSize: '22px', letterSpacing: '6px' }}>
          WRESTLING RPG
        </p>
        <p className="mt-4" style={{ color: 'var(--dim)', fontSize: '18px', maxWidth: '500px' }}>
          Crea il tuo wrestler. Costruisci la tua lore. Conquista il titolo mondiale.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
        <Link href="/auth/register">
          <button className="btn-gold w-full text-center" style={{ fontSize: '11px', padding: '16px' }}>
            ▶ CREA IL TUO WRESTLER
          </button>
        </Link>
        <Link href="/auth/login">
          <button className="btn-primary w-full text-center" style={{ fontSize: '11px', padding: '16px' }}>
            INSERT COIN — LOGIN
          </button>
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 gap-4 mt-16 max-w-lg w-full relative z-10 md:grid-cols-4">
        {[
          { icon: '🎭', label: 'CREA IL PERSONAGGIO' },
          { icon: '🤝', label: 'BACKSTAGE & FAIDE' },
          { icon: '🏟️', label: 'SHOW SETTIMANALI' },
          { icon: '🏆', label: 'PREMIUM EVENTS' },
        ].map(f => (
          <div key={f.label} className="game-panel text-center p-4">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{f.icon}</div>
            <div className="font-pixel" style={{ fontSize: '7px', color: 'var(--dim)', lineHeight: '1.6' }}>{f.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-12 font-pixel text-xs relative z-10" style={{ color: 'var(--dim)', letterSpacing: '2px' }}>
        SEASON 01 — WEEK 07
      </div>
    </main>
  )
}
