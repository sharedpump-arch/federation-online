'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/auth/login'); return }

      // Ensure profile exists
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('id', user.id).single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: user.id,
          username: user.user_metadata?.full_name?.replace(/\s+/g, '_').toLowerCase() || user.email?.split('@')[0] || 'user',
          email: user.email || '',
        })
      }

      // Check if wrestler exists
      const { data: wrestlers } = await supabase
        .from('wrestlers').select('id').eq('user_id', user.id).limit(1)

      router.push(wrestlers && wrestlers.length > 0 ? '/dashboard' : '/wrestler/create')
    }
    handle()
  }, [router])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <p style={{ color: 'var(--text2)' }}>Accesso in corso...</p>
      </div>
    </main>
  )
}
