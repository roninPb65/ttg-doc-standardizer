import * as fs from "fs";
import * as path from "path";
import { pool } from "../db";

async function main() {
  // schema.sql is copied next to the compiled script in the Docker image,
  // and lives at ../../db/schema.sql in the source tree.
  const candidates = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "..", "db", "schema.sql"),
    path.join(process.cwd(), "db", "schema.sql"),
  ];
  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) throw new Error(`schema.sql not found. Looked in:\n${candidates.join("\n")}`);

  const sql = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log(`[migrate] applied ${schemaPath}`);
  await pool.end();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[migrate] failed", e);
  process.exit(1);
});
