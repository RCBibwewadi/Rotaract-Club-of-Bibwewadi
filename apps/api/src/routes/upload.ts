import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../lib/supabase';
import { requireAdminPassword, authenticate, requireApproved } from '../middleware/authenticate';
import { successResponse, errorResponse } from '@rcb-2.0/shared';
import crypto from 'crypto';
import path from 'path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowedImages = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const allowedVideos = ['.mp4', '.webm', '.mov'];
    const ext = path.extname(file.originalname).toLowerCase();
    if ([...allowedImages, ...allowedVideos].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});

const handleMulterError = (req: any, res: any, next: any) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json(errorResponse('UPLOAD_ERROR', `${err.message} (max 50MB)`));
      }
      return res.status(400).json(errorResponse('UPLOAD_ERROR', err.message));
    }
    next();
  });
};

async function uploadFile(req: any, res: any, folder: string) {
  const file = req.file;
  if (!file) {
    return res.status(400).json(errorResponse('NO_FILE', 'No file provided'));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${folder}/${crypto.randomUUID()}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from('media')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    return res.status(500).json(errorResponse('UPLOAD_ERROR', error.message));
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('media')
    .getPublicUrl(filename);

  res.status(201).json(
    successResponse({ url: urlData.publicUrl }, 'File uploaded successfully')
  );
}

export const uploadRoutes: Router = Router();

// ── POST /api/upload ── admin only (any folder) ──────────────
uploadRoutes.post('/', requireAdminPassword, handleMulterError, async (req, res) => {
  const folder = (req.query.folder as string) || 'avatars';
  await uploadFile(req, res, folder);
});

// ── POST /api/upload/avatar ── authenticated member (avatar only) ──
uploadRoutes.post('/avatar', authenticate, requireApproved, handleMulterError, async (req, res) => {
  await uploadFile(req, res, 'avatars');
});
