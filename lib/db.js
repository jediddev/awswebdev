import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
let queue = Promise.resolve();

async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      itinerary: Array.isArray(parsed.itinerary) ? parsed.itinerary : [],
    };
  } catch (err) {
    if (err.code === "ENOENT") return { itinerary: [] };
    throw err;
  }
}

async function writeDb(data) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export function transaction(fn, { write = false } = {}) {
  const run = queue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    if (write) await writeDb(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
