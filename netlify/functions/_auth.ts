import jwt from "jsonwebtoken";
import type { Context } from "@netlify/functions";

interface Session {
  userId: string;
  email: string;
  role: string;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=");
  }
  return cookies;
}

export function getSession(req: Request): Session | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies["session"];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, secret) as Session;
    return { userId: payload.userId, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAge = 2592000): string {
  return `session=${token}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `session=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0`;
}
