'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  function getErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'invalid_credentials':        'Email o password non corretti.',
      'email_not_confirmed':        'Devi confermare la tua email prima di accedere. Controlla la posta.',
      'too_many_requests':          'Troppi tentativi. Riprova tra qualche minuto.',
      'user_not_found':             'Nessun account trovato con questa email.',
      'weak_password':              'La password è troppo debole.',
    }
    return messages[code] || 'Qualcosa è andato storto. Riprova.'
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError(getErrorMessage(loginError.code || loginError.message))
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: wrestlers } = await supabase
        .from('wrestlers').select('id').eq('user_id', user.id).limit(1)
      router.push(wrestlers && wrestlers.length > 0 ? '/dashboard' : '/wrestler/create')
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) {
      setError('Errore con Google. Riprova.')
      setGoogleLoading(false)
    }
  }

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
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: '16px', letterSpacing: '-0.02em' }}>Bentornato</h1>
          <p style={{ color: 'var(--text2)', marginTop: '6px' }}>Accedi al tuo account</p>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px' }}>

          {/* Google */}
          <button className="btn-social" onClick={handleGoogleLogin} disabled={googleLoading}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Connessione...' : 'Continua con Google'}
          </button>

          <div className="divider" style={{ margin: '20px 0' }}>oppure</div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="la-tua@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <Link href="/auth/reset-password" style={{ fontSize: '13px', color: 'var(--text3)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = 'var(--text2)'}
                  onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = 'var(--text3)'}>
                  Password dimenticata?
                </Link>
              </div>
              <input type="password" className="form-input" placeholder="La tua password"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && (
              <div className="alert alert-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '4px' }}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text3)' }}>
          Non hai un account?{' '}
          <Link href="/auth/register" style={{ color: 'var(--text2)', fontWeight: 600, textDecoration: 'none' }}>
            Registrati gratis
          </Link>
        </p>

      </div>
    </main>
  )
}
