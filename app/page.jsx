"use client";

import { useEffect, useState } from "react";
import DestinationCard from "@/components/DestinationCard";
import { REGIONS, SORT_OPTIONS } from "@/lib/regions";

const PAGE_SIZE = 24;

function Skeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex animate-pulse gap-4 rounded-md border border-line bg-white p-4">
          <div className="h-[72px] w-24 shrink-0 bg-mist" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 bg-mist" />
            <div className="h-4 w-1/2 bg-mist" />
            <div className="h-4 w-1/3 bg-mist" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: "loading", results: [], total: 0, error: "" });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const ctrl = new AbortController();
    const [sortKey, order] = sort.split("-");
    const params = new URLSearchParams({ q: debouncedQ, region, sort: sortKey, order });

    setState((s) => ({ ...s, status: "loading", error: "" }));
    setVisible(PAGE_SIZE);

    fetch(`/api/destinations?${params}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
        setState({ status: "ready", results: body.results, total: body.total, error: "" });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        const message =
          err instanceof TypeError
            ? "Could not reach the server. Check your connection and try again."
            : err.message;
        setState({ status: "error", results: [], total: 0, error: message });
      });

    return () => ctrl.abort();
  }, [debouncedQ, region, sort, attempt]);

  const filtersActive = q !== "" || region !== "all" || sort !== "name-asc";
  const reset = () => {
    setQ("");
    setDebouncedQ("");
    setRegion("all");
    setSort("name-asc");
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Where to next?</h1>
      <p className="mt-2 max-w-xl text-lg text-ink/80">
        Search any country, narrow by region, and add the places you want to visit to your trip.
      </p>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_14rem]"
      >
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-semibold">
            Search by country or capital
          </label>
          <input
            id="q"
            type="search"
            value={q}
            maxLength={60}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try “Japan” or “Lisbon”"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-semibold">
            Region
          </label>
          <select id="region" value={region} onChange={(e) => setRegion(e.target.value)} className="field">
            <option value="all">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-sm font-semibold">
            Sort by
          </label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="field">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="mt-6 flex min-h-[2rem] items-center justify-between gap-4" aria-live="polite">
        <p className="text-sm text-ink/80">
          {state.status === "ready" && `${state.total} ${state.total === 1 ? "destination" : "destinations"}`}
          {state.status === "loading" && "Loading destinations…"}
        </p>
        {filtersActive && (
          <button type="button" onClick={reset} className="text-sm font-semibold text-sea underline">
            Clear search and filters
          </button>
        )}
      </div>

      <div className="mt-2">
        {state.status === "loading" && <Skeleton />}

        {state.status === "error" && (
          <div role="alert" className="rounded-md border border-post bg-white p-6">
            <h2 className="font-display text-xl font-semibold">Destinations did not load</h2>
            <p className="mt-1 text-ink/80">{state.error}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn btn-primary mt-4">
              Try again
            </button>
          </div>
        )}

        {state.status === "ready" && state.total === 0 && (
          <div className="rounded-md border border-dashed border-line bg-white p-8 text-center">
            <h2 className="font-display text-xl font-semibold">No destinations match</h2>
            <p className="mt-1 text-ink/80">Check the spelling, or search for a capital city instead.</p>
            <button type="button" onClick={reset} className="btn btn-outline mt-4">
              Clear search and filters
            </button>
          </div>
        )}

        {state.status === "ready" && state.total > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.results.slice(0, visible).map((d) => (
                <DestinationCard key={d.code} destination={d} />
              ))}
            </div>
            {visible < state.total && (
              <div className="mt-8 text-center">
                <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn btn-outline">
                  Show more ({state.total - visible} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
