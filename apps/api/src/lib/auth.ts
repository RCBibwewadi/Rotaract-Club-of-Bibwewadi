import jwt ,{ SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface JWTPayload {
    member_id: string;
    username: string;
    role: "member" | "admin";
    is_approved: boolean;
}

const SECRET     = process.env.JWT_SECRET!;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export const hashPassword = async (plain: string) => await bcrypt.hash(plain, 12);

export const verifyPassword = async (plain: string, hash: string) => await bcrypt.compare(plain,hash);

export const signToken =  (payload: JWTPayload): string => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });

export const verifyToken=(token: string): JWTPayload => jwt.verify(token, SECRET) as JWTPayload;
