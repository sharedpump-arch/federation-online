import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Federation Online',
  description: 'Wrestling RPG online — crea il tuo wrestler, costruisci la tua lore, conquista il titolo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
// force redeploy Sun Feb 22 09:59:12 CET 2026
