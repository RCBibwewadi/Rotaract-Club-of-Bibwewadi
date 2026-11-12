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
