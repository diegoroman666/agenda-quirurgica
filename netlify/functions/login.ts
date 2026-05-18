import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sessionCookie } from "./_auth.js";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return Response.json({ error: "JWT_SECRET not configured" }, { status: 500 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "email and password required" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return Response.json({ error: "invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { algorithm: "HS256", expiresIn: "30d" }
    );

    return Response.json(
      { id: user.id, email: user.email, role: user.role },
      {
        status: 200,
        headers: { "Set-Cookie": sessionCookie(token) },
      }
    );
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config: Config = { path: "/api/login" };
