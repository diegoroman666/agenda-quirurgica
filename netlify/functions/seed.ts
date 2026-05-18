import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSession } from "./_auth.js";

// Endpoint privilegiado para crear cuentas con rol arbitrario (ej. otro
// "superadmin", o usuarios bulk). Para los usuarios normales existe el
// endpoint publico /api/signup (que fuerza role='user').
//
// SEGURIDAD: requiere sesion activa con role='superadmin'. Cualquier otro
// caller recibe 403 Forbidden — incluyendo invocaciones desde la consola
// del browser por atacantes que no esten logueados como admin.

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Gate de seguridad: solo superadmin existente puede crear cuentas aqui.
  const session = getSession(req);
  if (!session || session.role !== "superadmin") {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const { email, password, role } = await req.json();
    if (!email || !password) {
      return Response.json({ error: "email and password required" }, { status: 400 });
    }

    const normalizedEmail = email.includes("@") ? String(email).toLowerCase() : String(email);
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (existing.length > 0) {
      return Response.json({ error: "user already exists" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ id, email: normalizedEmail, passwordHash, role: role || "user" })
      .returning({ id: users.id, email: users.email, role: users.role });

    return Response.json(user, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config: Config = { path: "/api/seed" };
