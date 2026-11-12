import { z } from 'zod';

/** The columns every announcement response selects, including its author. */
export const ANNOUNCEMENT_SELECT = `
  announcement_id,
  title,
  body,
  image_url,
  created_at,
  members (
    member_id,
    full_name,
    avatar_url
  )
`;

export const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  body: z.string().trim().max(5000).default(''),
  image_url: z.string().url().max(1000).nullable().optional(),
});

/** An edit may send any subset of the fields; an empty body is a valid clear. */
export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial().refine(
  (patch) => Object.keys(patch).length > 0,
  'Nothing to update',
);
