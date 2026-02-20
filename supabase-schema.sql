-- ============================================================
-- FEDERATION ONLINE — Schema Database Supabase
-- Esegui questo file nel SQL Editor di Supabase
-- (Dashboard → SQL Editor → New Query → incolla → Run)
-- ============================================================

-- Abilita UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (collegato ad auth.users di Supabase)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WRESTLERS
-- ============================================================
CREATE TABLE wrestlers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Anagrafica
  name TEXT NOT NULL,
  nickname TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  height_cm INT DEFAULT 180,
  weight_kg INT DEFAULT 90,
  bio TEXT DEFAULT '',
  gender TEXT DEFAULT 'M' CHECK (gender IN ('M', 'F')),
  attitude TEXT DEFAULT 'face' CHECK (attitude IN ('face', 'heel', 'neutral')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'injured', 'suspended')),

  -- Stats (cap: 85)
  strength INT DEFAULT 50 CHECK (strength BETWEEN 1 AND 85),
  agility INT DEFAULT 50 CHECK (agility BETWEEN 1 AND 85),
  endurance INT DEFAULT 50 CHECK (endurance BETWEEN 1 AND 85),
  technique INT DEFAULT 50 CHECK (technique BETWEEN 1 AND 85),
  charisma INT DEFAULT 50 CHECK (charisma BETWEEN 1 AND 85),

  -- Stats dinamiche
  momentum INT DEFAULT 50 CHECK (momentum BETWEEN 0 AND 100),
  over_fans INT DEFAULT 10 CHECK (over_fans BETWEEN 0 AND 100),

  -- Training
  training_points INT DEFAULT 5 CHECK (training_points BETWEEN 0 AND 5),
  training_points_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Aspetto (JSON)
  appearance JSONB DEFAULT '{
    "gender": "M",
    "build": "normal",
    "skin_color": "#f5c5a3",
    "hair_style": "short",
    "hair_color": "#2c1810",
    "costume_type": "trunks",
    "costume_color": "#ff2d55",
    "boots_type": "short",
    "accessory": "none"
  }'::jsonb,

  -- Record
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Un utente può avere un solo wrestler attivo
CREATE UNIQUE INDEX one_wrestler_per_user ON wrestlers(user_id) WHERE status != 'suspended';

-- ============================================================
-- RELATIONSHIPS (relazioni tra wrestler)
-- ============================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wrestler_a_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  wrestler_b_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  friendship_value INT DEFAULT 0 CHECK (friendship_value BETWEEN 0 AND 500),
  rivalry_value INT DEFAULT 0 CHECK (rivalry_value BETWEEN 0 AND 500),
  history TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Evita duplicati (A-B uguale a B-A)
  UNIQUE(wrestler_a_id, wrestler_b_id),
  CHECK (wrestler_a_id != wrestler_b_id)
);

-- ============================================================
-- TITLES (cinture)
-- ============================================================
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'mixed' CHECK (type IN ('male', 'female', 'mixed', 'tag_team')),
  current_champion_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  current_champion_id_2 UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE title_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_id UUID NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  champion_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  champion_id_2 UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  won_at TIMESTAMPTZ DEFAULT NOW(),
  lost_at TIMESTAMPTZ,
  match_id UUID
);

-- ============================================================
-- MATCH TYPES
-- ============================================================
CREATE TABLE match_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  min_participants INT DEFAULT 2,
  max_participants INT DEFAULT 2,
  special_rules TEXT DEFAULT '',
  is_title_eligible BOOLEAN DEFAULT TRUE
);

-- Inserisci i tipi base
INSERT INTO match_types (name, min_participants, max_participants, special_rules, is_title_eligible) VALUES
  ('1vs1', 2, 2, 'Match standard. Si vince per pin, submission o squalifica.', true),
  ('Tag Team', 4, 4, 'Due team da 2. Si vince per pin o submission sul lottatore legale.', true),
  ('Triple Threat', 3, 3, 'Tre wrestler, nessuna squalifica per interferenze. Primo pin vince.', true),
  ('Fatal 4-Way', 4, 4, 'Quattro wrestler, regole Triple Threat.', true),
  ('Battle Royal', 6, 20, 'Si eliminano i wrestler buttandoli fuori dal ring. Ultimo rimasto vince.', false),
  ('Ladder Match', 2, 4, 'Un oggetto è appeso sopra il ring. Si vince recuperandolo scalando una scala.', true),
  ('Steel Cage', 2, 2, 'Gabbia d acciaio. Si vince per pin, submission o uscendo dalla gabbia.', true),
  ('Last Man Standing', 2, 2, 'Si vince solo se l avversario non si rialza entro il conteggio di 10.', true),
  ('Submission Match', 2, 2, 'Si vince solo per sottomissione. Nessun pin valido.', true),
  ('Hardcore Match', 2, 2, 'Nessuna squalifica, nessun countout. Tutto è lecito.', false);

-- ============================================================
-- SHOWS
-- ============================================================
CREATE TABLE shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'weekly' CHECK (type IN ('weekly', 'premium')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'voting', 'live', 'completed')),
  date TIMESTAMPTZ NOT NULL,
  arena TEXT DEFAULT '',
  max_matches INT DEFAULT 5,
  max_promos INT DEFAULT 3,
  week_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SHOW SEGMENTS
-- ============================================================
CREATE TABLE show_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'promo', 'interview', 'segment')),
  order_index INT DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  title_id UUID REFERENCES titles(id) ON DELETE SET NULL,
  narration TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES show_segments(id) ON DELETE CASCADE,
  match_type_id UUID NOT NULL REFERENCES match_types(id),
  result_type TEXT CHECK (result_type IN ('pinfall', 'submission', 'countout', 'dq', 'no_contest')),
  winner_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  narration TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('challenger', 'champion', 'participant')),
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  position INT DEFAULT 1,
  UNIQUE(match_id, wrestler_id)
);

-- ============================================================
-- GM REQUESTS
-- ============================================================
CREATE TABLE gm_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match_1v1', 'match_tag', 'promo', 'interview', 'special_segment')),
  description TEXT NOT NULL,
  opponent_id UUID REFERENCES wrestlers(id) ON DELETE SET NULL,
  votes_up INT DEFAULT 0,
  votes_down INT DEFAULT 0,
  status TEXT DEFAULT 'voting' CHECK (status IN ('voting', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gm_request_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES gm_requests(id) ON DELETE CASCADE,
  voter_wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  vote INT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, voter_wrestler_id)
);

-- ============================================================
-- MOVES
-- ============================================================
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('finisher', 'signature', 'basic', 'aerial', 'submission')),
  difficulty INT DEFAULT 5 CHECK (difficulty BETWEEN 1 AND 10),
  description TEXT DEFAULT ''
);

CREATE TABLE wrestler_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  move_id UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  mastery INT DEFAULT 50 CHECK (mastery BETWEEN 1 AND 100),
  is_finisher BOOLEAN DEFAULT FALSE,
  is_signature BOOLEAN DEFAULT FALSE,
  UNIQUE(wrestler_id, move_id)
);

-- Mosse base
INSERT INTO moves (name, type, difficulty, description) VALUES
  ('DDT', 'basic', 4, 'Classica presa con caduta sulla testa'),
  ('Suplex', 'basic', 4, 'Sollevamento e lancio sull''altra parte'),
  ('Clothesline', 'basic', 2, 'Avambraccio al collo in corsa'),
  ('Dropkick', 'basic', 3, 'Calcio volante con entrambi i piedi'),
  ('Piledriver', 'signature', 6, 'Caduta sulla testa con wrestler capovolto'),
  ('Powerbomb', 'signature', 7, 'Sollevamento e schiacciamento a terra'),
  ('Moonsault', 'aerial', 7, 'Backflip dal cavo o dall''alto'),
  ('Shooting Star Press', 'aerial', 9, 'Salto frontale con rotazione dal secondo cavo'),
  ('Hurricanrana', 'aerial', 6, 'Presa con le gambe sulla testa, lancio in avanti'),
  ('Sharpshooter', 'submission', 6, 'Presa alle gambe con pressione sulla schiena'),
  ('Crossface', 'submission', 5, 'Braccio al collo con pressione sul viso'),
  ('Tombstone Piledriver', 'finisher', 9, 'Piledriver con wrestler verticale'),
  ('RKO', 'finisher', 8, 'Presa rapida con caduta sulla fronte'),
  ('450 Splash', 'finisher', 10, 'Salto con 450 gradi di rotazione'),
  ('Spear', 'finisher', 7, 'Corsa e impact con spalla al petto');

-- ============================================================
-- BACKSTAGE MESSAGES
-- ============================================================
CREATE TABLE backstage_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  room TEXT NOT NULL CHECK (room IN ('locker_room', 'gym', 'fan_zone', 'gm_office')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERFERENCES
-- ============================================================
CREATE TABLE interferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_id UUID NOT NULL REFERENCES show_segments(id) ON DELETE CASCADE,
  wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  target_wrestler_id UUID NOT NULL REFERENCES wrestlers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('favor', 'against')),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Permette agli utenti di leggere tutto ma modificare solo i propri dati
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrestlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE backstage_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrestler_moves ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profili visibili a tutti" ON profiles FOR SELECT USING (true);
CREATE POLICY "Modifica solo il tuo profilo" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Wrestlers
CREATE POLICY "Wrestler visibili a tutti" ON wrestlers FOR SELECT USING (true);
CREATE POLICY "Inserisci il tuo wrestler" ON wrestlers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifica solo il tuo wrestler" ON wrestlers FOR UPDATE USING (auth.uid() = user_id);

-- Relationships
CREATE POLICY "Relazioni visibili a tutti" ON relationships FOR SELECT USING (true);
CREATE POLICY "Crea relazioni" ON relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "Modifica relazioni" ON relationships FOR UPDATE USING (true);

-- Backstage messages
CREATE POLICY "Messaggi visibili a tutti" ON backstage_messages FOR SELECT USING (true);
CREATE POLICY "Invia messaggi col tuo wrestler" ON backstage_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wrestlers WHERE id = wrestler_id AND user_id = auth.uid()
  ));

-- GM Requests
CREATE POLICY "Richieste visibili a tutti" ON gm_requests FOR SELECT USING (true);
CREATE POLICY "Crea richiesta col tuo wrestler" ON gm_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wrestlers WHERE id = requester_id AND user_id = auth.uid()
  ));

-- GM Votes
CREATE POLICY "Voti visibili a tutti" ON gm_request_votes FOR SELECT USING (true);
CREATE POLICY "Vota col tuo wrestler" ON gm_request_votes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wrestlers WHERE id = voter_wrestler_id AND user_id = auth.uid()
  ));

-- Wrestler moves
CREATE POLICY "Mosse visibili a tutti" ON wrestler_moves FOR SELECT USING (true);
CREATE POLICY "Modifica le tue mosse" ON wrestler_moves FOR ALL
  USING (EXISTS (
    SELECT 1 FROM wrestlers WHERE id = wrestler_id AND user_id = auth.uid()
  ));

-- ============================================================
-- SHOW DI ESEMPIO
-- ============================================================
INSERT INTO shows (name, type, status, date, arena, max_matches, max_promos, week_number)
VALUES
  ('THUNDER NIGHT', 'weekly', 'voting', NOW() + INTERVAL '3 days', 'Palazzo dello Sport, Milano', 5, 3, 1),
  ('NIGHT OF GLORY', 'premium', 'upcoming', NOW() + INTERVAL '30 days', 'Mediolanum Forum, Assago', 7, 4, 1);

-- TITOLO DI ESEMPIO
INSERT INTO titles (name, description, type)
VALUES ('WORLD HEAVYWEIGHT CHAMPIONSHIP', 'Il titolo più prestigioso della federazione.', 'male');
