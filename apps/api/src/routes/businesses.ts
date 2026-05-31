import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticate, requireApproved } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
  CreateBusinessSchema,
  UpdateBusinessSchema,
  successResponse,
  errorResponse,
  type CreateBusinessInput,
  type UpdateBusinessInput,
} from "@rcb-2.0/shared";

export const businessRoutes: Router = Router();

businessRoutes.use(authenticate, requireApproved);

// ── GET /api/businesses ───────────────────────────────────────
// all visible businesses across all members — for network/directory page
businessRoutes.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      business_id,
      business_name,
      industry,
      designation,
      description,
      website_url,
      business_city,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("is_visible", true)
    .order("business_name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/businesses/my ────────────────────────────────────
// logged-in member's own businesses (all, including hidden)
businessRoutes.get("/my", async (_req, res) => {
  const { member_id } = res.locals.user;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("member_id", member_id)
    .order("business_name");

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /api/businesses/:id ───────────────────────────────────
businessRoutes.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      business_id,
      business_name,
      industry,
      designation,
      description,
      website_url,
      business_city,
      is_visible,
      members (
        member_id,
        full_name,
        avatar_url
      )
    `
    )
    .eq("business_id", req.params.id)
    .eq("is_visible", true)
    .single();

  if (error) {
    return res
      .status(404)
      .json(errorResponse("NOT_FOUND", "Business not found"));
  }

  res.json(successResponse(data));
});

// ── POST /api/businesses ──────────────────────────────────────
businessRoutes.post("/", validate(CreateBusinessSchema), async (req, res) => {
  const { member_id } = res.locals.user;
  const body = req.body as CreateBusinessInput;

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      ...body,
      member_id,
    })
    .select("*")
    .single();

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.status(201).json(successResponse(data, "Business created successfully"));
});

// ── PATCH /api/businesses/:id ─────────────────────────────────
businessRoutes.patch(
  "/:id",
  validate(UpdateBusinessSchema),
  async (req, res) => {
    const { member_id } = res.locals.user;
    const body = req.body as UpdateBusinessInput;

    // verify ownership first before updating
    const { data: existing } = await supabase
      .from("businesses")
      .select("business_id")
      .eq("business_id", req.params.id)
      .eq("member_id", member_id)
      .single();

    if (!existing) {
      return res
        .status(403)
        .json(errorResponse("FORBIDDEN", "You do not own this business"));
    }

    const { data, error } = await supabase
      .from("businesses")
      .update(body)
      .eq("business_id", req.params.id)
      .select("*")
      .single();

    if (error) {
      return res.status(500).json(errorResponse("DB_ERROR", error.message));
    }

    res.json(successResponse(data, "Business updated successfully"));
  }
);

// ── DELETE /api/businesses/:id ────────────────────────────────
businessRoutes.delete("/:id", async (req, res) => {
  const { member_id } = res.locals.user;

  // verify ownership before deleting
  const { data: existing } = await supabase
    .from("businesses")
    .select("business_id")
    .eq("business_id", req.params.id)
    .eq("member_id", member_id)
    .single();

  if (!existing) {
    return res
      .status(403)
      .json(errorResponse("FORBIDDEN", "You do not own this business"));
  }

  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("business_id", req.params.id);

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(null, "Business deleted successfully"));
});
