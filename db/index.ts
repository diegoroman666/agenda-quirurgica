import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema.js";

// Netlify DB inyecta NETLIFY_DATABASE_URL automaticamente. La beta nueva de
// drizzle-orm/netlify-db tambien acepta NETLIFY_DB_URL, asi que probamos ambos.
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DB_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set NETLIFY_DATABASE_URL (auto-inyectado por Netlify DB), NETLIFY_DB_URL o DATABASE_URL."
  );
}

export const db = drizzle(connectionString, { schema });
