import { NextResponse } from "next/server";
import { fetchAllCountries } from "@/lib/countries";
import { REGIONS } from "@/lib/regions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTS = ["name", "population"];
const fold = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const bad = (message) => NextResponse.json({ error: message }, { status: 400 });

export async function GET(request) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const region = sp.get("region") || "all";
  const sort = sp.get("sort") || "name";
  const order = sp.get("order") || "asc";

  if (q.length > 60) return bad("Search text must be 60 characters or fewer.");
  if (region !== "all" && !REGIONS.includes(region))
    return bad(
      `Unknown region "${region}". Use one of: all, ${REGIONS.join(", ")}.`,
    );
  if (!SORTS.includes(sort))
    return bad(`Unknown sort "${sort}". Use one of: ${SORTS.join(", ")}.`);
  if (!["asc", "desc"].includes(order))
    return bad('Order must be "asc" or "desc".');

  let all;
  try {
    all = await fetchAllCountries();
  } catch (err) {
    console.error("Destinations upstream error:", err);
    return NextResponse.json(
      {
        error:
          "The destinations service is not responding. Try again in a moment.",
      },
      { status: 502 },
    );
  }

  const needle = fold(q);
  let results = all.filter((d) => {
    if (region !== "all" && d.region !== region) return false;
    if (!needle) return true;
    return [d.name, d.officialName, d.capital].some((v) =>
      fold(v).includes(needle),
    );
  });

  const dir = order === "desc" ? -1 : 1;
  results.sort((a, b) =>
    sort === "population"
      ? (a.population - b.population) * dir
      : a.name.localeCompare(b.name) * dir,
  );

  return NextResponse.json({ total: results.length, results });
}
