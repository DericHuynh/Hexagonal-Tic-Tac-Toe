import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schemas";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export * from "./schemas";
