import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authenticate, requireAdmin } from "../middleware/authenticate";
import { successResponse, errorResponse } from "@rcb-2.0/shared";

// Admin Control to approve , reject , deactivate and reactive an member

export const adminRoutes: Router = Router();

adminRoutes.use(authenticate, requireAdmin);

// ── GET /admin/members/pending ────────────────────────────────
adminRoutes.get("/members/pending", async (_req, res) => {
  const { data, error } = await supabase
    .from("members")
    .select("member_id, full_name, email, username, member_type, created_at")
    .eq("is_approved", false)
    .eq("is_active", true)
    .eq("role", "member")
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── GET /admin/members/all ────────────────────────────────────
adminRoutes.get("/members/all", async (_req, res) => {
  const { data, error } = await supabase
    .from("members")
    .select(
      "member_id, full_name, email, username, role, is_approved, is_active, member_type, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data));
});

// ── PATCH /admin/members/:id/approve ─────────────────────────
adminRoutes.patch("/members/:id/approve", async (req, res) => {
  const { data, error } = await supabase
    .from("members")
    .update({ is_approved: true })
    .eq("member_id", req.params.id)
    .select("member_id, full_name, email")
    .single();

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data, "Member approved successfully"));
});

// ── PATCH /admin/members/:id/reject ──────────────────────────
adminRoutes.patch("/members/:id/reject", async (req, res) => {
  const { data, error } = await supabase
    .from("members")
    .update({ is_active: false })
    .eq("member_id", req.params.id)
    .select("member_id, full_name, email")
    .single();

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data, "Member rejected"));
});

// ── PATCH /admin/members/:id/deactivate ──────────────────────
adminRoutes.patch("/members/:id/deactivate", async (req, res) => {
  const { data, error } = await supabase
    .from("members")
    .update({ is_active: false })
    .eq("member_id", req.params.id)
    .select("member_id, full_name, email")
    .single();

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data, "Member deactivated"));
});

// ── PATCH /admin/members/:id/reactivate ──────────────────────
adminRoutes.patch("/members/:id/reactivate", async (req, res) => {
  const { data, error } = await supabase
    .from("members")
    .update({ is_active: true })
    .eq("member_id", req.params.id)
    .select("member_id, full_name, email")
    .single();

  if (error) {
    return res.status(500).json(errorResponse("DB_ERROR", error.message));
  }

  res.json(successResponse(data, "Member reactivated"));
});
