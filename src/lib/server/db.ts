import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import { env } from "./env";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    const sql = neon(env.databaseUrl);
    instance = drizzle(sql, { schema: fullSchema });
  }
  return instance;
}
