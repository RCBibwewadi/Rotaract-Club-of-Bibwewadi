import {Request,Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

export const authenticate = (req: Request, res: Response, next: NextFunction)   => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid authorization header" });
    }

    try {
        const token = verifyToken(authHeader.slice(7));
        res.locals.user = token;
        next(); 
    } catch (err){
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

export function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.locals.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
}

export function requireApproved(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (!res.locals.user?.is_approved) {
    return res.status(403).json({ error: 'Account pending admin approval' });
  }
  next();
}