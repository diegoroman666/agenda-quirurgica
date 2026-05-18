import type { Config, Context } from "@netlify/functions";
import { clearSessionCookie } from "./_auth.js";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookie() } }
  );
};

export const config: Config = { path: "/api/logout" };
