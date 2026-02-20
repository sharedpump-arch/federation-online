'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Crea l'utente Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Salva username nella tabella profiles
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username, email })

      if (profileError) {
        setError('Errore nel salvataggio del profilo: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="game-panel p-8 max-w-md w-full text-center">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 className="font-pixel mb-4" style={{ fontSize: '10px', color: 'var(--green)' }}>
            REGISTRAZIONE COMPLETATA!
          </h2>
          <p style={{ color: 'var(--dim)', marginBottom: '20px' }}>
            Controlla la tua email per confermare l'account, poi accedi.
          </p>
          <Link href="/auth/login">
            <button className="btn-gold w-full">▶ VAI AL LOGIN</button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-pixel" style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px' }}>
            ⚡ FEDERATION ONLINE
          </Link>
          <h1 className="font-pixel mt-4" style={{ fontSize: '12px', color: 'var(--gold)', lineHeight: '1.6' }}>
            CREA IL TUO<br/>ACCOUNT
          </h1>
        </div>

        {/* Form */}
        <div className="game-panel p-6">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">

            <div>
              <label className="font-pixel block mb-2" style={{ fontSize: '8px', color: 'var(--dim)' }}>
                USERNAME
              </label>
              <input
                type="text"
                className="game-input"
                placeholder="Il tuo nome utente..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="font-pixel block mb-2" style={{ fontSize: '8px', color: 'var(--dim)' }}>
                EMAIL
              </label>
              <input
                type="email"
                className="game-input"
                placeholder="La tua email..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-pixel block mb-2" style={{ fontSize: '8px', color: 'var(--dim)' }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="game-input"
                placeholder="Minimo 8 caratteri..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,45,85,0.1)', border: '1px solid var(--accent)', padding: '10px', color: 'var(--accent)', fontSize: '15px' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-gold w-full"
              disabled={loading}
              style={{ fontSize: '10px', padding: '14px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '⏳ CREAZIONE...' : '▶ CREA ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center" style={{ color: 'var(--dim)', fontSize: '16px' }}>
            Hai già un account?{' '}
            <Link href="/auth/login" style={{ color: 'var(--accent)' }}>
              Accedi
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
