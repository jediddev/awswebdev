"use client";

import { useState } from "react";
import Link from "next/link";
import Stamp from "@/components/Stamp";
import { useTrip } from "@/components/TripProvider";
import { formatPopulation } from "@/lib/format";

function TripItem({ item }) {
  const { remove, saveNote } = useTrip();
  const [note, setNote] = useState(item.note || "");
  const [saveState, setSaveState] = useState("idle");
  const [removing, setRemoving] = useState(false);

  async function commitNote() {
    if (note === (item.note || "")) return;
    setSaveState("saving");
    const ok = await saveNote(item.code, note);
    setSaveState(ok ? "saved" : "idle");
  }

  async function onRemove() {
    setRemoving(true);
    await remove(item.code, item.name);
    setRemoving(false);
  }

  return (
    <li className="flex flex-col gap-4 rounded-md border border-line bg-white p-4 sm:flex-row">
      <Link
        href={`/destination/${item.code}`}
        className="w-28 shrink-0 self-start"
        aria-label={`Open ${item.name}`}
      >
        <Stamp src={item.flag} alt="" onWhite />
      </Link>

      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-semibold">
          <Link href={`/destination/${item.code}`} className="hover:underline">
            {item.name}
          </Link>
        </h2>
        <p className="text-sm text-ink/80">
          {item.capital ? `Capital: ${item.capital}. ` : ""}
          {item.region || ""}
          {item.population != null
            ? `. Population: ${formatPopulation(item.population)}`
            : ""}
        </p>

        <label
          htmlFor={`note-${item.code}`}
          className="mt-3 block text-sm font-semibold"
        >
          Trip notes
        </label>
        <textarea
          id={`note-${item.code}`}
          value={note}
          maxLength={500}
          rows={2}
          onChange={(e) => {
            setNote(e.target.value);
            setSaveState("idle");
          }}
          onBlur={commitNote}
          placeholder="Dates, things to see, who is coming"
          className="field mt-1"
        />
        <p className="mt-1 h-5 text-sm text-ink/70" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Notes saved"}
        </p>
      </div>

      <div className="sm:self-start">
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="btn btn-danger w-full sm:w-auto"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
      </div>
    </li>
  );
}

export default function TripPage() {
  const { items, status, error, reload } = useTrip();
  const regions = new Set(items.map((i) => i.region).filter(Boolean));

  return (
    <div>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        My trip
      </h1>

      {status === "loading" && (
        <div className="mt-6 space-y-4" aria-busy="true">
          <p className="sr-only">Loading your trip…</p>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-md border border-line bg-mist"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-post bg-white p-6"
        >
          <h2 className="font-display text-xl font-semibold">
            Your trip did not load
          </h2>
          <p className="mt-1 text-ink/80">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="btn btn-primary mt-4"
          >
            Try again
          </button>
        </div>
      )}

      {status === "ready" && items.length === 0 && (
        <div className="mt-6 rounded-md border border-dashed border-line bg-white p-8 text-center">
          <h2 className="font-display text-xl font-semibold">
            Your trip is empty
          </h2>
          <p className="mt-1 text-ink/80">
            Add a destination from Explore and it will show up here.
          </p>
          <Link href="/" className="btn btn-primary mt-4">
            Explore destinations
          </Link>
        </div>
      )}

      {status === "ready" && items.length > 0 && (
        <>
          <p className="mt-2 text-lg text-ink/80">
            {items.length} {items.length === 1 ? "destination" : "destinations"}
            {regions.size > 0 &&
              ` across ${regions.size} ${regions.size === 1 ? "region" : "regions"}`}
          </p>
          <ul className="mt-6 space-y-4">
            {items.map((item) => (
              <TripItem key={item.code} item={item} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
