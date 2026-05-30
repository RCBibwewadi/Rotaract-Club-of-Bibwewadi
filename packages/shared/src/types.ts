// ============================================================
// RCB Database Types — generated from ERD
// Place in packages/shared/src/types.ts
// ============================================================

// ── Enums / Literals ─────────────────────────────────────────

export type MemberType = 'business_only' | 'profession_only' | 'both';

// ── MEMBERS ──────────────────────────────────────────────────

export interface Member {
  member_id: string;               // uuid PK
  auth_user_id: string;            // uuid FK → Supabase auth.users
  full_name: string;
  email: string;
  phone?: string;
  rid?: string;                    // Rotary ID
  username?: string;
  dob?: string;                    // date (ISO string)
  interests?: string;              // text
  avatar_url?: string;
  created_at: string;              // timestamptz
  updated_at: string;              // timestamptz
  years_in_rcb?: number;
  is_active: boolean;
  member_type: MemberType;
  previous_bod_posts?: Record<string, unknown>; // json
}

// ── BUSINESSES ───────────────────────────────────────────────

export interface Business {
  business_id: string;             // uuid PK
  member_id: string;               // uuid FK → MEMBERS
  business_name: string;
  industry?: string;
  designation?: string;
  description?: string;            // text
  website_url?: string;
  business_city?: string;
  is_visible: boolean;
}

// ── PROFESSIONS ──────────────────────────────────────────────

export interface Profession {
  profession_id: string;           // uuid PK
  member_id: string;               // uuid FK → MEMBERS
  profession_type: string;
  specialisation?: string;
  years_experience?: string;
  employer?: string;
  is_primary: boolean;
  is_visible: boolean;
}

// ── MEMBER_VISIBILITY ────────────────────────────────────────

export interface MemberVisibility {
  member_id: string;               // uuid PK+FK → MEMBERS (1-to-1)
  show_business_name: boolean;
  show_contact: boolean;
  show_profession: boolean;
  open_to_collab: boolean;
}

// ── BOD (Board of Directors) ─────────────────────────────────

export interface BodMember {
  bod_id: string;                  // uuid PK
  member_id: string;               // uuid FK → MEMBERS
  designation: string;
  linkedin_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  gmail?: string;
  dob?: string;                    // date (ISO string)
  avatar_url?: string;
  description?: string;            // text
  riy_year?: string;               // Rotary year e.g. "2024-25"
  is_current: boolean;
}

// ── EVENTS ───────────────────────────────────────────────────

export interface Event {
  event_id: string;                // uuid PK
  event_name: string;
  event_date?: string;             // date (ISO string)
  event_time?: string;             // time string e.g. "18:30:00"
  event_place?: string;
  event_strength?: number;
  open_to_all: boolean;
  event_lead_id?: string;          // uuid FK → MEMBERS
  event_avenue?: string;
  event_description?: string;      // text
  event_images?: string[];         // json — array of image URLs
  event_videos?: string[];         // json — array of video URLs
  event_best_member?: string;      // uuid FK → MEMBERS
  created_at: string;              // timestamptz
  updated_at: string;              // timestamptz
}

// ── LEGACY ───────────────────────────────────────────────────

export interface Legacy {
  legacy_id: string;               // uuid PK
  riy_year?: string;               // e.g. "2023-24"
  year_video_url?: string;
  bod_member_ids?: string[];       // json — array of member uuids
}

// ── FOMO ─────────────────────────────────────────────────────

export interface Fomo {
  fomo_id: string;                 // uuid PK
  category?: string;
  name?: string;
  description?: string;            // text
  videos?: string[];               // json — array of video URLs
  images?: string[];               // json — array of image URLs
  event_id?: string;               // uuid FK → EVENTS
}

// ============================================================
// Joined / View Types (for API responses)
// ============================================================

/** Member card shown on the network page */
export interface MemberNetworkCard
  extends Pick<Member, 'member_id' | 'full_name' | 'avatar_url' | 'member_type' | 'years_in_rcb'> {
  visibility: MemberVisibility;
  business?: Pick<Business, 'business_name' | 'industry' | 'designation' | 'business_city'>;
  professions: Pick<Profession, 'profession_type' | 'specialisation' | 'is_primary'>[];
}

/** Event card with lead member info */
export interface EventWithLead extends Event {
  lead?: Pick<Member, 'member_id' | 'full_name' | 'avatar_url'>;
  fomo?: Fomo[];
}

/** Full BOD profile for the BOD page */
export interface BodProfile extends BodMember {
  member: Pick<Member, 'full_name' | 'avatar_url' | 'interests'>;
}