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
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setError('Email o password non corretti.')
      setLoading(false)
      return
    }

    // Controlla se l'utente ha già un wrestler
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: wrestlers } = await supabase
        .from('wrestlers')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (wrestlers && wrestlers.length > 0) {
        router.push('/dashboard')
      } else {
        router.push('/wrestler/create')
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-pixel" style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '2px' }}>
            ⚡ FEDERATION ONLINE
          </Link>
          <h1 className="font-pixel mt-4" style={{ fontSize: '14px', color: 'var(--gold)' }}>
            INSERT COIN
          </h1>
          <p style={{ color: 'var(--dim)', marginTop: '6px' }}>Accedi al tuo account</p>
        </div>

        {/* Form */}
        <div className="game-panel p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            <div>
              <label className="font-pixel block mb-2" style={{ fontSize: '8px', color: 'var(--dim)' }}>EMAIL</label>
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
              <label className="font-pixel block mb-2" style={{ fontSize: '8px', color: 'var(--dim)' }}>PASSWORD</label>
              <input
                type="password"
                className="game-input"
                placeholder="La tua password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
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
              {loading ? '⏳ ACCESSO...' : '▶ ENTRA NEL RING'}
            </button>
          </form>

          <div className="mt-6 text-center" style={{ color: 'var(--dim)', fontSize: '16px' }}>
            Non hai un account?{' '}
            <Link href="/auth/register" style={{ color: 'var(--accent)' }}>
              Registrati gratis
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
