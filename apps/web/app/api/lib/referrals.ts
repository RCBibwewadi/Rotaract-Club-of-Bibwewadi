import { z } from 'zod';
import { supabase } from './supabase';

export const CONTACT_METHODS = ['phone', 'whatsapp', 'email'] as const;

export const CreateReferralSchema = z.object({
  title: z.string().trim().min(3, 'Give your referral a title').max(200),
  description: z.string().trim().min(10, 'Describe what you need').max(5000),
  location: z.string().trim().min(1, 'Add a location').max(200),
  budget: z.string().trim().max(100).optional(),
  contact_method: z.enum(CONTACT_METHODS).default('phone'),
});

/**
 * The columns every referral response selects, including the poster and the
 * interest rows the shape function tallies.
 */
export const REFERRAL_SELECT = `
  referral_id,
  title,
  description,
  location,
  budget,
  contact_method,
  status,
  created_at,
  author:members!referrals_member_id_fkey (
    member_id,
    full_name,
    avatar_url
  ),
  referral_interests (
    member_id
  )
`;

interface RawReferral {
  referral_id: string;
  title: string;
  description: string;
  location: string;
  budget: string | null;
  contact_method: string;
  status: string;
  created_at: string;
  author: { member_id: string; full_name: string; avatar_url: string | null } | null;
  referral_interests: { member_id: string }[] | null;
}

export interface Referral {
  referral_id: string;
  title: string;
  description: string;
  location: string;
  budget: string | null;
  contact_method: string;
  status: string;
  created_at: string;
  author: { member_id: string; full_name: string; avatar_url: string | null } | null;
  interest_count: number;
  /** True once this member has expressed interest; the button then shows contacts. */
  my_interest: boolean;
  /** A member cannot express interest in their own referral. */
  is_mine: boolean;
}

/**
 * Collapses the raw interest rows into a count plus the caller's own state, so
 * the client never receives the list of who is interested — only the poster
 * sees that, through /api/referrals/interests.
 */
export function shapeReferral(row: RawReferral, viewerId: string): Referral {
  const interests = row.referral_interests ?? [];
  return {
    referral_id: row.referral_id,
    title: row.title,
    description: row.description,
    location: row.location,
    budget: row.budget,
    contact_method: row.contact_method,
    status: row.status,
    created_at: row.created_at,
    author: row.author,
    interest_count: interests.length,
    my_interest: interests.some((i) => i.member_id === viewerId),
    is_mine: row.author?.member_id === viewerId,
  };
}

export type { RawReferral };

export interface ReferralContact {
  method: string;
  /** A phone number, or an email address when that is the chosen method. */
  value: string | null;
  full_name: string;
}

/**
 * The poster's contact detail, read live from their profile.
 *
 * Posting a referral names the way the poster wants to be reached, which is
 * consent for that one channel — so this ignores the directory-wide
 * `show_contact` toggle, which governs browsing, not a referral they opened.
 */
export async function fetchContact(
  memberId: string,
  method: string,
): Promise<ReferralContact | null> {
  const { data } = await supabase
    .from('members')
    .select('full_name, phone, email')
    .eq('member_id', memberId)
    .single();

  if (!data) return null;

  return {
    method,
    value: method === 'email' ? data.email : data.phone,
    full_name: data.full_name,
  };
}
