/**
 * Seeds the local database with the sample Korean course.
 *
 * Runs both validation layers from @vernora/content-schema before touching
 * the database, and is idempotent: published versions are immutable, so an
 * existing (course_id, version) row is left alone rather than overwritten.
 *
 * Usage: npm run seed   (database from infrastructure/compose.yaml must be up)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { Course, validateCourseReferences } from "@vernora/content-schema";

const here = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.resolve(
  here,
  "../../packages/content-schema/samples/korean-course.json",
);

async function main(): Promise<void> {
  const document = JSON.parse(readFileSync(samplePath, "utf8"));

  const parsed = Course.safeParse(document);
  if (!parsed.success) {
    console.error("Structural validation failed:");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  const referenceErrors = validateCourseReferences(parsed.data);
  if (referenceErrors.length > 0) {
    console.error("Semantic validation failed:");
    for (const error of referenceErrors) console.error(`  - ${error}`);
    process.exit(1);
  }

  const course = parsed.data;
  const client = new pg.Client({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5433),
    database: process.env.DB_NAME ?? "vernora",
    user: process.env.DB_USER ?? "vernora",
    password: process.env.DB_PASSWORD ?? "vernora",
  });
  await client.connect();
  try {
    await client.query(
      "insert into courses (id, language) values ($1, $2) on conflict (id) do nothing",
      [course.id, course.language],
    );
    const inserted = await client.query(
      `insert into course_versions (course_id, version, status, content, published_at)
       values ($1, $2, 'PUBLISHED', $3::jsonb, now())
       on conflict (course_id, version) do nothing`,
      [course.id, course.version, JSON.stringify(document)],
    );
    if (inserted.rowCount === 1) {
      console.log(`Seeded "${course.id}" version ${course.version} (PUBLISHED).`);
    } else {
      console.log(
        `"${course.id}" version ${course.version} already exists — skipped ` +
          "(published content is immutable; bump the version to publish changes).",
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
