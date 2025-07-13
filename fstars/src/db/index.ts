import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";

export const db = drizzle(env.DATABASE_URL);
