import { Router } from "express";
import { supabase } from "../lib/supabase";
import { requireAdminPassword } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  CreateBodSchema,
  UpdateBodSchema,
  successResponse,
  errorResponse,
  type CreateBodInput,
  type UpdateBodInput,
} from "@rcb-2.0/shared";

const BOD_SELECT = `
  bod_id,
  full_name,
  designation,
  linkedin_url,
  instagram_url,
  gmail,
  avatar_url,
  description,
  riy_year,
  is_current
`;

export const bodRoutes: Router = Router();

// ── GET /api/bod ──────────────────────────────────────────────
// public — all BOD entries grouped by year
bodRoutes.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(BOD_SELECT)
    .order("riy_year", { ascending: false })
    .order("designation");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/bod/current ──────────────────────────────────────
bodRoutes.get("/current", async (_req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(BOD_SELECT)
    .eq("is_current", true)
    .order("designation");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/bod/year/:riy_year ───────────────────────────────
bodRoutes.get("/year/:riy_year", async (req, res) => {
  const { data, error } = await supabase
    .from("bod")
    .select(BOD_SELECT)
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
    .select("*")
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
bodRoutes.post(
  "/",
  requireAdminPassword,
  validate(CreateBodSchema),
  async (req, res) => {
    const body = req.body as CreateBodInput;

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
  requireAdminPassword,
  validate(UpdateBodSchema),
  async (req, res) => {
    const body = req.body as UpdateBodInput;

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
bodRoutes.delete("/:id", requireAdminPassword, async (req, res) => {
  const { error } = await supabase
    .from("bod")
    .delete()
    .eq("bod_id", req.params.id);

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(null, "BOD member removed successfully"));
});
