import type { Config, Context } from "@netlify/functions";
import { getSession } from "./_auth.js";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "not authenticated" }, { status: 401 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, session.userId));

  if (!user) {
    return Response.json({ error: "user not found" }, { status: 404 });
  }

  return Response.json(user);
};

export const config: Config = { path: "/api/me" };
