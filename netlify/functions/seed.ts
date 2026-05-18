import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, password, role } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "email and password required" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return Response.json({ error: "user already exists" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ id, email, passwordHash, role: role || "user" })
      .returning({ id: users.id, email: users.email, role: users.role });

    return Response.json(user, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config: Config = { path: "/api/seed" };
