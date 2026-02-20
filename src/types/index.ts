// ===== UTENTE =====
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

// ===== WRESTLER =====
export type Gender = 'M' | 'F'
export type Attitude = 'face' | 'heel' | 'neutral'
export type WrestlerStatus = 'active' | 'injured' | 'suspended'

export interface WrestlerStats {
  strength: number      // max 85
  agility: number       // max 85
  endurance: number     // max 85
  technique: number     // max 85
  charisma: number      // max 85
}

export interface WrestlerAppearance {
  gender: Gender
  build: 'slim' | 'normal' | 'heavy'
  skin_color: string
  hair_style: 'short' | 'long' | 'mohawk' | 'bald' | 'ponytail'
  hair_color: string
  costume_type: 'trunks' | 'tights' | 'singlet' | 'shorts'
  costume_color: string
  boots_type: 'short' | 'tall' | 'bare'
  accessory: 'none' | 'mask' | 'bandana' | 'glasses'
}

export interface Wrestler {
  id: string
  user_id: string
  name: string
  nickname: string
  nationality: string
  height_cm: number
  weight_kg: number
  bio: string
  attitude: Attitude
  gender: Gender
  status: WrestlerStatus

  // Stats (cap: 85)
  strength: number
  agility: number
  endurance: number
  technique: number
  charisma: number

  // Dynamic stats
  momentum: number      // 0-100, cambia durante gli show
  over_fans: number     // 0-100, popolarità col pubblico

  // Training
  training_points: number   // si ricaricano ogni settimana (max 5)
  training_points_reset_at: string

  // Appearance JSON
  appearance: WrestlerAppearance

  // Record
  wins: number
  losses: number

  created_at: string
}

// ===== RELAZIONI =====
export interface Relationship {
  id: string
  wrestler_a_id: string
  wrestler_b_id: string
  friendship_value: number   // 0-500
  rivalry_value: number      // 0-500
  history: string            // lore testuale
  updated_at: string
}

// ===== TITOLI =====
export type TitleType = 'male' | 'female' | 'mixed' | 'tag_team'

export interface Title {
  id: string
  name: string
  description: string
  type: TitleType
  current_champion_id: string | null
  current_champion_id_2: string | null  // per tag team
  created_at: string
}

export interface TitleHistory {
  id: string
  title_id: string
  champion_id: string
  champion_id_2: string | null
  won_at: string
  lost_at: string | null
  match_id: string | null
}

// ===== MATCH TYPES =====
export interface MatchType {
  id: string
  name: string              // '1vs1', 'Tag Team', 'Ladder', ecc.
  min_participants: number
  max_participants: number
  special_rules: string
  is_title_eligible: boolean
}

// ===== SHOW =====
export type ShowType = 'weekly' | 'premium'
export type ShowStatus = 'upcoming' | 'live' | 'completed'

export interface Show {
  id: string
  name: string
  type: ShowType
  status: ShowStatus
  date: string
  arena: string
  max_matches: number
  max_promos: number
  week_number: number
  created_at: string
}

// ===== SEGMENTI SHOW =====
export type SegmentType = 'match' | 'promo' | 'interview' | 'segment'
export type SegmentStatus = 'scheduled' | 'completed' | 'cancelled'

export interface ShowSegment {
  id: string
  show_id: string
  type: SegmentType
  order_index: number
  status: SegmentStatus
  title_id: string | null
  narration: string | null
  created_at: string
}

// ===== MATCH =====
export type MatchResult = 'pinfall' | 'submission' | 'countout' | 'dq' | 'no_contest'

export interface Match {
  id: string
  segment_id: string
  match_type_id: string
  result_type: MatchResult | null
  winner_id: string | null
  narration: string | null   // play-by-play generato dall'AI
  completed: boolean
  created_at: string
}

export interface MatchParticipant {
  id: string
  match_id: string
  wrestler_id: string
  role: 'challenger' | 'champion' | 'participant'
  result: 'win' | 'loss' | 'draw' | null
  position: number   // ordine ingresso
}

// ===== GM REQUESTS =====
export type RequestType = 'match_1v1' | 'match_tag' | 'promo' | 'interview' | 'special_segment'
export type RequestStatus = 'voting' | 'approved' | 'rejected' | 'completed'

export interface GMRequest {
  id: string
  show_id: string
  requester_id: string
  type: RequestType
  description: string
  opponent_id: string | null
  votes_up: number
  votes_down: number
  status: RequestStatus
  created_at: string
}

export interface GMRequestVote {
  id: string
  request_id: string
  voter_wrestler_id: string
  vote: 1 | -1
  created_at: string
}

// ===== MOSSE =====
export type MoveType = 'finisher' | 'signature' | 'basic' | 'aerial' | 'submission'

export interface Move {
  id: string
  name: string
  type: MoveType
  difficulty: number   // 1-10
  description: string
}

export interface WrestlerMove {
  id: string
  wrestler_id: string
  move_id: string
  mastery: number     // 1-100
  is_finisher: boolean
  is_signature: boolean
}

// ===== INTERFERENCE =====
export interface Interference {
  id: string
  segment_id: string
  wrestler_id: string
  target_wrestler_id: string
  type: 'favor' | 'against'
  approved: boolean
  created_at: string
}

// ===== BACKSTAGE MESSAGES =====
export interface BackstageMessage {
  id: string
  wrestler_id: string
  room: 'locker_room' | 'gym' | 'fan_zone' | 'gm_office'
  content: string
  created_at: string
}
