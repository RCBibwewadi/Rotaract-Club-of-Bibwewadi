import { z } from 'zod';

/** Topics a post can be filed under. Kept here so the app and the API agree. */
export const IDEA_TAGS = [
  'General',
  'Project',
  'Fundraiser',
  'Event',
  'Partnership',
  'Feedback',
] as const;

export const CreateIdeaSchema = z.object({
  title: z.string().trim().min(3, 'Give your idea a title').max(200),
  description: z.string().trim().max(5000).default(''),
  image_url: z.string().url().max(1000).nullable().optional(),
  tag: z.enum(IDEA_TAGS).default('General'),
});

export const VoteSchema = z.object({
  // 0 clears the member's vote; the app sends it when a vote is tapped twice.
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const CreateCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});

/**
 * The columns every idea response selects, including author and tallies.
 * The author FK is named explicitly because idea_votes is a junction table
 * between ideas and members, which makes a bare members(...) embed ambiguous.
 */
export const IDEA_SELECT = `
  idea_id,
  title,
  description,
  image_url,
  tag,
  created_at,
  author:members!ideas_member_id_fkey (
    member_id,
    full_name,
    avatar_url
  ),
  idea_votes (
    member_id,
    value
  ),
  idea_comments (count)
`;

interface RawIdea {
  idea_id: string;
  title: string;
  description: string;
  image_url: string | null;
  tag: string;
  created_at: string;
  author: { member_id: string; full_name: string; avatar_url: string | null } | null;
  idea_votes: { member_id: string; value: number }[] | null;
  idea_comments: { count: number }[] | null;
}

export interface Idea {
  idea_id: string;
  title: string;
  description: string;
  image_url: string | null;
  tag: string;
  created_at: string;
  author: { member_id: string; full_name: string; avatar_url: string | null } | null;
  score: number;
  /** This member's own vote: 1, -1 or 0 when they have not voted. */
  my_vote: -1 | 0 | 1;
  comment_count: number;
}

/**
 * Collapses the raw vote rows into a score plus the caller's own vote, so the
 * client never sees who voted which way — votes are anonymous to members.
 */
export function shapeIdea(row: RawIdea, viewerId: string): Idea {
  const votes = row.idea_votes ?? [];
  return {
    idea_id: row.idea_id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    tag: row.tag,
    created_at: row.created_at,
    author: row.author,
    score: votes.reduce((sum, v) => sum + v.value, 0),
    my_vote: (votes.find((v) => v.member_id === viewerId)?.value ?? 0) as -1 | 0 | 1,
    comment_count: row.idea_comments?.[0]?.count ?? 0,
  };
}

export type { RawIdea };
