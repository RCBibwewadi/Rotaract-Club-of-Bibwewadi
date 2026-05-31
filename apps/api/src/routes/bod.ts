import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticate, requireAdmin } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  CreateBodSchema,
  UpdateBodSchema,
  successResponse,
  errorResponse,
  type CreateBodInput,
  type UpdateBodInput,
} from "@rcb-2.0/shared";

// BOD handles adding , editing , deleting an BOD member.

export const bodRoutes: Router = Router();

// ── GET /api/bod ──────────────────────────────────────────────
// public — no auth needed, shown on public website
bodRoutes.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(
      `
      bod_id,
      designation,
      linkedin_url,
      instagram_url,
      twitter_url,
      gmail,
      avatar_url,
      description,
      riy_year,
      is_current,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `
    )
    .order("riy_year", { ascending: false })
    .order("designation");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/bod/current ──────────────────────────────────────
// returns only the active BOD — for homepage / about page
bodRoutes.get("/current", async (_req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(
      `
      bod_id,
      designation,
      linkedin_url,
      instagram_url,
      twitter_url,
      gmail,
      avatar_url,
      description,
      riy_year,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("is_current", true)
    .order("designation");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/bod/year/:riy_year ───────────────────────────────
// returns BOD for a specific Rotary year e.g. /year/2024-25
bodRoutes.get("/year/:riy_year", async (req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(
      `
      bod_id,
      designation,
      linkedin_url,
      instagram_url,
      twitter_url,
      gmail,
      avatar_url,
      description,
      riy_year,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("riy_year", req.params.riy_year)
    .order("designation");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/bod/:id ──────────────────────────────────────────
bodRoutes.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(
      `
      *,
      members (
        member_id,
        full_name,
        avatar_url,
        interests
      )
    `
    )
    .eq("bod_id", req.params.id)
    .single();

  if (error) {
    return res
      .status(404)
      .json(errorResponse("NOT_FOUND", "BOD member not found"));
  }

  res.json(successResponse(data));
});

// ── POST /api/bod ─────────────────────────────────────────────
// admin only — only admin can add BOD members
bodRoutes.post(
  "/",
  authenticate,
  requireAdmin,
  validate(CreateBodSchema),
  async (req, res) => {
    const body = req.body as CreateBodInput;

    // if this entry is marked current, unset all others for same riy_year
    if (body.is_current) {
      await supabase
        .from("bod")
        .update({ is_current: false })
        .eq("riy_year", body.riy_year);
    }

    const { data, error } = await supabase
      .from("bod")
      .insert(body)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json(
            errorResponse(
              "DUPLICATE_ENTRY",
              "This member already has a BOD post for this Rotary year"
            )
          );
      }
      return res.status(500).json(errorResponse("DB_ERROR", error.message));
    }

    res
      .status(201)
      .json(successResponse(data, "BOD member added successfully"));
  }
);

// ── PATCH /api/bod/:id ────────────────────────────────────────
bodRoutes.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validate(UpdateBodSchema),
  async (req, res) => {
    const body = req.body as UpdateBodInput;

    // if marking as current, fetch the riy_year first to unset others
    if (body.is_current) {
      const { data: existing } = await supabase
        .from("bod")
        .select("riy_year")
        .eq("bod_id", req.params.id)
        .single();

      if (existing) {
        await supabase
          .from("bod")
          .update({ is_current: false })
          .eq("riy_year", existing.riy_year);
      }
    }

    const { data, error } = await supabase
      .from("bod")
      .update(body)
      .eq("bod_id", req.params.id)
      .select("*")
      .single();

    if (error) {
      return res.status(500).json(errorResponse("DB_ERROR", error.message));
    }

    res.json(successResponse(data, "BOD member updated successfully"));
  }
);

// ── DELETE /api/bod/:id ───────────────────────────────────────
bodRoutes.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const { error } = await supabase
    .from("bod")
    .delete()
    .eq("bod_id", req.params.id);

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(null, "BOD member removed successfully"));
});
