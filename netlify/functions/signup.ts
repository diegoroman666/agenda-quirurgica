import type { Config, Context } from "@netlify/functions";
import { db, dbAvailable } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sessionCookie } from "./_auth.js";

// Registro publico: cualquiera puede crear una cuenta (rol "user", nunca
// "superadmin"). El campo "email" acepta tanto correos reales como nombres
// de usuario arbitrarios — el usuario decide cuanto compartir. Despues del
// signup exitoso emite cookie httpOnly de sesion (auto-login).

const MIN_EMAIL_LEN = 3;
const MIN_PASSWORD_LEN = 6;

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!dbAvailable) {
    return Response.json(
      { error: "Cloud sync no esta configurado en este sitio. Por ahora la app funciona solo con datos locales en este dispositivo." },
      { status: 503 }
    );
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return Response.json({ error: "JWT_SECRET not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const emailRaw = (body?.email ?? "").toString().trim();
    const password = (body?.password ?? "").toString();

    if (emailRaw.length < MIN_EMAIL_LEN) {
      return Response.json(
        { error: `El usuario debe tener al menos ${MIN_EMAIL_LEN} caracteres.` },
        { status: 400 }
      );
    }
    if (password.length < MIN_PASSWORD_LEN) {
      return Response.json(
        { error: `La contrasena debe tener al menos ${MIN_PASSWORD_LEN} caracteres.` },
        { status: 400 }
      );
    }

    // Normalizamos a lowercase si parece email; de lo contrario lo dejamos como
    // username literal. Esto evita duplicados por mayusculas en correos reales.
    const email = emailRaw.includes("@") ? emailRaw.toLowerCase() : emailRaw;

    const existing = await db.select().from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return Response.json(
        { error: "Ese usuario ya esta registrado." },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({ id, email, passwordHash, role: "user" })
      .returning({ id: users.id, email: users.email, role: users.role });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { algorithm: "HS256", expiresIn: "30d" }
    );

    return Response.json(user, {
      status: 201,
      headers: { "Set-Cookie": sessionCookie(token) },
    });
  } catch (err: any) {
    return Response.json({ error: err.message || "error en signup" }, { status: 500 });
  }
};

export const config: Config = { path: "/api/signup" };
