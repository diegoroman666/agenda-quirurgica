import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema.js";

// Netlify DB inyecta NETLIFY_DATABASE_URL automaticamente cuando la extension
// Neon esta instalada. Si no hay connection string, dbAvailable = false y las
// funciones deben devolver un 503 con mensaje claro en vez de crashear.
const connectionString =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NETLIFY_DB_URL ||
  process.env.DATABASE_URL;

export const dbAvailable = !!connectionString;

// Lazy: solo intenta inicializar drizzle si hay connection string. Asi el
// modulo no crashea al cargarse en una funcion sin DB configurada.
export const db: any = dbAvailable
  ? drizzle(connectionString!, { schema })
  : new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Cloud sync no esta configurado en este sitio. Conecta la extension Neon (Netlify DB) o define NETLIFY_DATABASE_URL."
          );
        },
      }
    );
