import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(client: any) {
  return drizzle(client, { schema });
}
