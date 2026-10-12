import "varlock/auto-load";

import { getTableName, isTable, type Table } from "drizzle-orm";
import { Pool } from "pg";

import { ENV } from "./env";
import * as schema from "./schema/index";

if (ENV.NODE_ENV === "production" && process.env.ALLOW_DB_RESET !== "1") {
  console.error("Refusing to wipe a production database. Set ALLOW_DB_RESET=1 to override.");
  process.exit(1);
}

const tableNames = Object.values(schema)
  .filter(isTable)
  .map((table) => getTableName(table as Table));

if (tableNames.length === 0) {
  console.error("Reset failed: no tables found in the schema.");
  process.exit(1);
}

const pool = new Pool({ connectionString: ENV.DATABASE_URL });

try {
  const list = tableNames.map((name) => `"${name}"`).join(", ");
  await pool.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
  console.log(`Reset: truncated ${tableNames.length} tables (data wiped, schema kept).`);
} catch (error) {
  console.error("Reset failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
