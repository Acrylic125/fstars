import { env } from "@/lib/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle(client);

// import { drizzle } from "drizzle-orm/neon-http";
// import { env } from "@/lib/env";

// export const db = drizzle(env.DATABASE_URL, {
//   logger: true,
// });
