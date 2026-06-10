import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────

export const SignupSchema = z.object({
  full_name:   z.string().min(2, 'Name must be at least 2 characters'),
  email:       z.string().email('Invalid email'),
  username:    z.string()
                 .min(3, 'Username must be at least 3 characters')
                 .max(30)
                 .regex(/^[a-z0-9_]+$/, 'Only lowercase, numbers and underscores'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  member_type: z.enum(['business_only', 'profession_only', 'both']),
});

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ── Registration (signup + business + profession in one step) ─
export const RegisterSchema = z.object({
  // Account
  full_name:   z.string().min(2, 'Name must be at least 2 characters'),
  email:       z.string().email('Invalid email'),
  username:    z.string()
                 .min(3, 'Username must be at least 3 characters')
                 .max(30)
                 .regex(/^[a-z0-9_]+$/, 'Only lowercase, numbers and underscores'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  member_type: z.enum(['business_only', 'profession_only', 'both']),
  phone:       z.string().optional(),
  dob:         z.string().optional(),
  interests:   z.string().optional(),

  // Business (optional, required if member_type is business_only or both)
  business: z.object({
    business_name: z.string().min(1, 'Business name is required'),
    industry:      z.string().optional(),
    designation:   z.string().optional(),
    description:   z.string().optional(),
    website_url:   z.string().url('Invalid URL').optional().or(z.literal('')),
    business_city: z.string().optional(),
  }).optional(),

  // Profession (optional, required if member_type is profession_only or both)
  profession: z.object({
    profession_type:  z.string().min(1, 'Profession type is required'),
    specialisation:   z.string().optional(),
    years_experience: z.string().optional(),
    employer:         z.string().optional(),
  }).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ── Members ───────────────────────────────────────────────────

export const UpdateMemberSchema = z.object({
  full_name:    z.string().min(2).optional(),
  phone:        z.string().optional(),
  dob:          z.string().optional(),
  interests:    z.string().optional(),
  avatar_url:   z.string().url().optional(),
  years_in_rcb: z.number().min(0).optional(),
});

// ── Businesses ────────────────────────────────────────────────

export const CreateBusinessSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  industry:      z.string().optional(),
  designation:   z.string().optional(),
  description:   z.string().optional(),
  website_url:   z.string().url().optional(),
  business_city: z.string().optional(),
  is_visible:    z.boolean().default(true),
});

export const UpdateBusinessSchema = CreateBusinessSchema.partial();

// ── Professions ───────────────────────────────────────────────

export const CreateProfessionSchema = z.object({
  profession_type:  z.string().min(1, 'Profession type is required'),
  specialisation:   z.string().optional(),
  years_experience: z.string().optional(),
  employer:         z.string().optional(),
  is_primary:       z.boolean().default(false),
  is_visible:       z.boolean().default(true),
});

export const UpdateProfessionSchema = CreateProfessionSchema.partial();

// ── BOD ───────────────────────────────────────────────────────

export const CreateBodSchema = z.object({
  member_id:     z.string().uuid('Invalid member ID').optional(),
  full_name:     z.string().min(2, 'Name must be at least 2 characters'),
  designation:   z.string().min(1, 'Designation is required'),
  linkedin_url:  z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  instagram_url: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
  gmail:         z.string().email('Invalid email').optional().or(z.literal('')),
  avatar_url:    z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  description:   z.string().optional(),
  riy_year:      z.string()
                   .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-YY e.g. 2024-25'),
  is_current:    z.boolean().default(false),
});

export const UpdateBodSchema = CreateBodSchema.partial();

export type CreateBodInput = z.infer<typeof CreateBodSchema>;
export type UpdateBodInput = z.infer<typeof UpdateBodSchema>;

// ── Events ────────────────────────────────────────────────────

export const CreateEventSchema = z.object({
  event_name:        z.string().min(1, 'Event name is required'),
  event_date:        z.string().optional(),
  event_time:        z.string().optional(),
  event_place:       z.string().optional(),
  event_strength:    z.number().positive('Strength must be positive').optional(),
  open_to_all:       z.boolean().default(false),
  event_lead_id:     z.string().uuid('Invalid member ID').optional().or(z.literal('')),
  event_avenue:      z.string().optional(),
  event_description: z.string().optional(),
  event_images:      z.array(z.string()).optional(),
  event_videos:      z.array(z.string()).optional(),
  event_best_member: z.string().uuid('Invalid member ID').optional().or(z.literal('')),
});

export const UpdateEventSchema = CreateEventSchema.partial();

// ── FOMO ─────────────────────────────────────────────────────

export const CreateFomoSchema = z.object({
  category:    z.string().min(1, 'Category is required'),
  name:        z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  thumbnail:   z.string().optional(),
  videos:      z.array(z.string()).optional(),
  images:      z.array(z.string()).optional(),
  event_id:    z.string().uuid('Invalid event ID').optional().or(z.literal('')),
});

export const UpdateFomoSchema = CreateFomoSchema.partial();

export type CreateFomoInput = z.infer<typeof CreateFomoSchema>;
export type UpdateFomoInput = z.infer<typeof UpdateFomoSchema>;

// ── Legacy ────────────────────────────────────────────────────

export const CreateLegacySchema = z.object({
  riy_year:       z.string()
                    .regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-YY e.g. 2024-25'),
  year_video_url: z.string().url('Invalid video URL').optional().or(z.literal('')),
  bod_member_ids: z.array(z.string().uuid('Invalid member ID')).optional(),
});

export const UpdateLegacySchema = CreateLegacySchema.partial();

// ── Inferred types from schemas ───────────────────────────────
// Use these instead of writing duplicate interfaces

export type SignupInput          = z.infer<typeof SignupSchema>;
export type LoginInput           = z.infer<typeof LoginSchema>;
export type UpdateMemberInput    = z.infer<typeof UpdateMemberSchema>;
export type CreateBusinessInput  = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessInput  = z.infer<typeof UpdateBusinessSchema>;
export type CreateProfessionInput = z.infer<typeof CreateProfessionSchema>;
export type UpdateProfessionInput = z.infer<typeof UpdateProfessionSchema>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type CreateLegacyInput = z.infer<typeof CreateLegacySchema>;
export type UpdateLegacyInput = z.infer<typeof UpdateLegacySchema>;
