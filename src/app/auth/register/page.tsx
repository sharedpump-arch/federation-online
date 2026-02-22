'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function getErrorMessage(msg: string): string {
    if (msg.includes('already registered') || msg.includes('already been registered'))
      return 'Questa email è già registrata. Prova ad accedere.'
    if (msg.includes('weak_password') || msg.includes('Password should be'))
      return 'La password deve essere di almeno 8 caratteri.'
    if (msg.includes('invalid') && msg.includes('email'))
      return 'Inserisci un indirizzo email valido.'
    if (msg.includes('Username') || msg.includes('username'))
      return 'Questo username è già in uso. Scegline un altro.'
    return 'Qualcosa è andato storto. Riprova.'
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })

    if (authError) {
      setError(getErrorMessage(authError.message))
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username, email })

      if (profileError) {
        if (profileError.message.includes('duplicate') || profileError.message.includes('unique')) {
          setError('Questo username è già in uso. Scegline un altro.')
        } else if (!profileError.message.includes('security policy')) {
          setError('Errore nel profilo: ' + profileError.message)
        }
        // Se è un errore RLS, il trigger ha già creato il profilo — va bene
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      setError('Errore con Google. Riprova.')
      setGoogleLoading(false)
    }
  }

  if (success) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
        <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '12px' }}>Account creato!</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '32px', lineHeight: '1.6' }}>
          Controlla la tua email <strong style={{ color: 'var(--text)' }}>{email}</strong> e clicca il link di conferma per attivare l'account.
        </p>
        <Link href="/auth/login">
          <button className="btn btn-primary btn-full">Vai al login</button>
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="font-pixel" style={{ fontSize: '9px', color: 'var(--accent)', letterSpacing: '1px', lineHeight: '2' }}>
              ⚡ FEDERATION ONLINE
            </div>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em' }}>Crea un account</h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px' }}>Inizia il tuo percorso nel wrestling</p>
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>

          {/* Google */}
          <button className="btn-social" onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Connessione...' : 'Registrati con Google'}
          </button>

          <div className="divider" style={{ margin: '20px 0' }}>oppure</div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" placeholder="il-tuo-nome"
                value={username} onChange={e => setUsername(e.target.value)}
                required minLength={3} maxLength={20} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="la-tua@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Minimo 8 caratteri"
                value={password} onChange={e => setPassword(e.target.value)}
                required minLength={8} />
              {password.length > 0 && password.length < 8 && (
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  Ancora {8 - password.length} caratteri
                </span>
              )}
            </div>

            {error && (
              <div className="alert alert-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? 'Creazione account...' : 'Crea account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text3)' }}>
          Hai già un account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--text2)', fontWeight: 600, textDecoration: 'none' }}>
            Accedi
          </Link>
        </p>

      </div>
    </main>
  )
}
