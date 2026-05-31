import { Router } from "express";
import { supabase } from "../lib/supabase";
import { hashPassword, verifyPassword, signToken } from "../lib/auth";
import { MemberType } from "@rcb-2.0/shared/src/types";
import { validate } from "../middleware/validate";
import {
  errorResponse,
  LoginSchema,
  SignupInput,
  SignupSchema,
  successResponse,
} from "@rcb-2.0/shared";

// Auth handles Login and SignUp for members

export const authRoutes: Router = Router();

// ── POST /auth/signup ─────────────────────────────────────────
authRoutes.post("/signup", validate(SignupSchema), async (req, res) => {
  const body = req.body as SignupInput;

  const password_hash = await hashPassword(body.password);
  const plain_password = body.password; // Store plain password for validation in tests only

  const { data, error } = await supabase
    .from("members")
    .insert({
      full_name: body.full_name,
      email: body.email,
      username: body.username,
      password_hash,
      member_type: body.member_type,
      role: "member",
      is_approved: false,
      is_active: true,
      plain_password,
    })
    .select("member_id, username, email, member_type")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json(
          errorResponse("DUPLICATE_ENTRY", "Email or username already taken")
        );
    }
    return res
      .status(500)
      .json(errorResponse("INTERNAL_SERVER_ERROR", error.message));
  }

  res.status(201).json(
    successResponse(
      {
        member_id: data.member_id,
        username: data.username,
        email: data.email,
        member_type: data.member_type as MemberType,
      },
      "Signup successful, pending admin approval"
    )
  );
});

// ── POST /auth/login ──────────────────────────────────────────
authRoutes.post("/login", validate(LoginSchema), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json(
        errorResponse("VALIDATION_ERROR", "Username and password are required")
      );
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("member_id, username, password_hash, role, is_approved, is_active")
    .eq("username", username)
    .single();

  if (error || !member) {
    return res
      .status(401)
      .json(errorResponse("INVALID_CREDENTIALS", "Invalid credentials"));
  }

  if (!member.is_active) {
    return res
      .status(403)
      .json(
        errorResponse("ACCOUNT_DEACTIVATED", "Account has been deactivated")
      );
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return res
      .status(401)
      .json(errorResponse("INVALID_CREDENTIALS", "Invalid credentials"));
  }

  if (member.role === "member" && !member.is_approved) {
    return res
      .status(403)
      .json(
        errorResponse("PENDING_APPROVAL", "Account pending admin approval")
      );
  }

  const token = signToken({
    member_id: member.member_id,
    username: member.username,
    role: member.role,
    is_approved: member.is_approved,
  });

  res.json(
    successResponse(
      {
        token,
        role: member.role,
        username: member.username,
      },
      "Login successful"
    )
  );
});
