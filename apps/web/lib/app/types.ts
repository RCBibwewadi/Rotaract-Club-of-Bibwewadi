export interface AppMemberRef {
  member_id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Idea {
  idea_id: string;
  title: string;
  description: string;
  image_url: string | null;
  tag: string;
  created_at: string;
  author: AppMemberRef | null;
  score: number;
  my_vote: -1 | 0 | 1;
  comment_count: number;
}

export interface IdeaFeed {
  ideas: Idea[];
  page: number;
  has_more: boolean;
}

export interface IdeaComment {
  comment_id: string;
  body: string;
  created_at: string;
  members: AppMemberRef | null;
}

export interface Announcement {
  announcement_id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  members: AppMemberRef | null;
}

export interface ReferralContact {
  method: string;
  /** A phone number, or an email address when that is the chosen method. */
  value: string | null;
  full_name: string;
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
  author: AppMemberRef | null;
  interest_count: number;
  my_interest: boolean;
  is_mine: boolean;
  /** Only present once this member has expressed interest. */
  contact?: ReferralContact | null;
}

export interface ReferralInterest {
  created_at: string;
  referral: { referral_id: string; title: string } | null;
  member: (AppMemberRef & { phone: string | null; email: string | null }) | null;
}
