import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { surgeryRecords } from "../../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "./_auth.js";

export default async (req: Request, context: Context) => {
  const session = getSession(req);
  if (!session) {
    return Response.json({ error: "not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const recordId = context.params?.id || null;

  try {
    if (req.method === "GET") {
      return await handleGet(url, session.userId);
    }
    if (req.method === "POST") {
      return await handlePost(req, session.userId);
    }
    if (req.method === "PATCH" && recordId) {
      return await handlePatch(req, recordId, session.userId);
    }
    if (req.method === "DELETE" && recordId) {
      return await handleDelete(url, recordId, session.userId);
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

async function handleGet(url: URL, userId: string) {
  const showDeleted = url.searchParams.get("deleted") === "true";

  const rows = await db
    .select()
    .from(surgeryRecords)
    .where(
      and(
        eq(surgeryRecords.userId, userId),
        eq(surgeryRecords.deleted, showDeleted)
      )
    );

  return Response.json(rows);
}

async function handlePost(req: Request, userId: string) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];

  const values = items.map((item: any) => ({
    id: item.id,
    userId,
    fecha: item.fecha || null,
    data: item.data,
    deleted: item.deleted ?? false,
  }));

  const result = await db
    .insert(surgeryRecords)
    .values(values)
    .onConflictDoUpdate({
      target: surgeryRecords.id,
      set: {
        fecha: sql`excluded.fecha`,
        data: sql`excluded.data`,
        deleted: sql`excluded.deleted`,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return Response.json(result, { status: 201 });
}

async function handlePatch(req: Request, recordId: string, userId: string) {
  const body = await req.json();
  const updates: Record<string, any> = { updatedAt: sql`now()` };

  if (body.data !== undefined) updates.data = body.data;
  if (body.fecha !== undefined) updates.fecha = body.fecha;
  if (body.deleted !== undefined) updates.deleted = body.deleted;

  const [updated] = await db
    .update(surgeryRecords)
    .set(updates)
    .where(and(eq(surgeryRecords.id, recordId), eq(surgeryRecords.userId, userId)))
    .returning();

  if (!updated) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(updated);
}

async function handleDelete(url: URL, recordId: string, userId: string) {
  const hard = url.searchParams.get("hard") === "true";

  if (hard) {
    const [deleted] = await db
      .delete(surgeryRecords)
      .where(and(eq(surgeryRecords.id, recordId), eq(surgeryRecords.userId, userId)))
      .returning();

    if (!deleted) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return Response.json({ ok: true, deleted });
  }

  const [softDeleted] = await db
    .update(surgeryRecords)
    .set({ deleted: true, updatedAt: sql`now()` })
    .where(and(eq(surgeryRecords.id, recordId), eq(surgeryRecords.userId, userId)))
    .returning();

  if (!softDeleted) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(softDeleted);
}

export const config: Config = { path: ["/api/records", "/api/records/:id"] };
