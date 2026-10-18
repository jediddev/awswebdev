import { NextResponse } from "next/server";
import { transaction } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_RE = /^[A-Z]{3}$/;
const bad = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });
const serverError = (err) => {
  console.error("Itinerary error:", err);
  return bad("Something went wrong while saving your trip. Try again.", 500);
};

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? body
      : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const items = await transaction((db) => db.itinerary);
    return NextResponse.json({ items });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request) {
  const body = await readBody(request);
  if (!body) return bad("Send a JSON object in the request body.");

  const code = String(body.code || "").toUpperCase();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!CODE_RE.test(code))
    return bad(
      "code must be a three-letter destination code, for example JPN.",
    );
  if (!name || name.length > 100)
    return bad("name is required and must be 100 characters or fewer.");
  if (
    body.population != null &&
    (typeof body.population !== "number" || body.population < 0)
  )
    return bad("population must be a positive number.");

  const item = {
    code,
    name,
    capital:
      typeof body.capital === "string" ? body.capital.slice(0, 100) : null,
    region: typeof body.region === "string" ? body.region.slice(0, 50) : null,
    flag: typeof body.flag === "string" ? body.flag.slice(0, 300) : "",
    population: typeof body.population === "number" ? body.population : null,
    note: "",
    addedAt: new Date().toISOString(),
  };

  try {
    const created = await transaction(
      (db) => {
        if (db.itinerary.some((i) => i.code === code)) return null;
        db.itinerary.push(item);
        return item;
      },
      { write: true },
    );
    if (!created) return bad(`${name} is already in your trip.`, 409);
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request) {
  const body = await readBody(request);
  if (!body) return bad("Send a JSON object in the request body.");

  const code = String(body.code || "").toUpperCase();
  if (!CODE_RE.test(code))
    return bad(
      "code must be a three-letter destination code, for example JPN.",
    );
  if (typeof body.note !== "string" || body.note.length > 500)
    return bad("note must be text of 500 characters or fewer.");

  try {
    const updated = await transaction(
      (db) => {
        const found = db.itinerary.find((i) => i.code === code);
        if (!found) return null;
        found.note = body.note;
        return found;
      },
      { write: true },
    );
    if (!updated) return bad(`${code} is not in your trip.`, 404);
    return NextResponse.json({ item: updated });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request) {
  const code = (request.nextUrl.searchParams.get("code") || "").toUpperCase();
  if (!CODE_RE.test(code))
    return bad("Add ?code=JPN (a three-letter destination code) to the URL.");

  try {
    const removed = await transaction(
      (db) => {
        const index = db.itinerary.findIndex((i) => i.code === code);
        if (index === -1) return null;
        return db.itinerary.splice(index, 1)[0];
      },
      { write: true },
    );
    if (!removed) return bad(`${code} is not in your trip.`, 404);
    return NextResponse.json({ item: removed });
  } catch (err) {
    return serverError(err);
  }
}
