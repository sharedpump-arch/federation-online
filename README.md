# ⚡ FEDERATION ONLINE — Setup Guide

## PREREQUISITI
- Node.js (LTS) installato
- Account Supabase (gratuito su supabase.com)
- Visual Studio Code (consigliato)

---

## PASSO 1 — Configura Supabase

1. Vai su **supabase.com** e accedi al tuo progetto `federation-online`
2. Apri **SQL Editor** → **New Query**
3. Copia e incolla tutto il contenuto di `supabase-schema.sql`
4. Clicca **Run** — questo crea tutte le tabelle, le policy di sicurezza e i dati iniziali
5. Vai in **Settings → API** e copia:
   - **Project URL** (es. `https://abcdef.supabase.co`)
   - **anon public key** (la chiave lunga che inizia con `eyJ...`)

---

## PASSO 2 — Configura le variabili d'ambiente

1. Nella cartella del progetto, crea un file chiamato `.env.local`
2. Incolla questo contenuto sostituendo con i tuoi valori:

```
NEXT_PUBLIC_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TUA-ANON-KEY
```

---

## PASSO 3 — Installa le dipendenze e avvia

Apri il terminale nella cartella del progetto ed esegui:

```bash
npm install
npm run dev
```

Poi apri il browser su: **http://localhost:3000**

---

## STRUTTURA DEL PROGETTO

```
federation-online/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── auth/
│   │   │   ├── login/            # Pagina login
│   │   │   └── register/         # Pagina registrazione
│   │   ├── dashboard/            # Dashboard principale
│   │   ├── wrestler/
│   │   │   └── create/           # Creazione wrestler
│   │   ├── backstage/            # Backstage
│   │   └── show/                 # Show settimanale e premium
│   ├── components/               # Componenti riutilizzabili
│   ├── lib/
│   │   └── supabase.ts           # Client Supabase
│   └── types/
│       └── index.ts              # TypeScript types
├── supabase-schema.sql           # Schema database (esegui su Supabase)
├── .env.example                  # Template variabili d'ambiente
└── .env.local                    # Le tue credenziali (non committare!)
```

---

## PAGINE DISPONIBILI

| URL | Descrizione |
|-----|-------------|
| `/` | Homepage / landing |
| `/auth/register` | Registrazione |
| `/auth/login` | Login |
| `/dashboard` | Dashboard personale |
| `/wrestler/create` | Crea il tuo wrestler |
| `/backstage` | Backstage (locker room, palestra, fan zone, GM) |
| `/show` | Show settimanale |
| `/show/premium` | Premium Live Event |

---

## DEPLOY SU VERCEL (opzionale)

1. Crea un account su **vercel.com**
2. Importa il progetto da GitHub
3. Aggiungi le stesse variabili d'ambiente in Vercel → Settings → Environment Variables
4. Deploy automatico ad ogni push!
