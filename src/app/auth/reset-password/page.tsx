'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError('Errore nell\'invio. Controlla l\'email e riprova.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📧</div>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '12px' }}>Email inviata!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '32px', lineHeight: '1.6' }}>
          Controlla la posta a <strong style={{ color: 'var(--text)' }}>{email}</strong> e segui il link per reimpostare la password.
        </p>
        <Link href="/auth/login">
          <button className="btn btn-outline btn-full">Torna al login</button>
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--accent)', letterSpacing: '1px', lineHeight: '2' }}>⚡ FEDERATION ONLINE</div>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em' }}>Password dimenticata</h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px' }}>Ti invieremo un link per reimpostarla</p>
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">La tua email</label>
              <input type="email" className="form-input" placeholder="la-tua@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {error && (
              <div className="alert alert-error"><span>⚠</span><span>{error}</span></div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Invio in corso...' : 'Invia link di reset'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text3)' }}>
          <Link href="/auth/login" style={{ color: 'var(--text2)', fontWeight: 600, textDecoration: 'none' }}>
            ← Torna al login
          </Link>
        </p>
      </div>
    </main>
  )
}
