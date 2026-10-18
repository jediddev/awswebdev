"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Stamp from "@/components/Stamp";
import AddButton from "@/components/AddButton";
import { formatNumber } from "@/lib/format";

function Fact({ label, children }) {
  return (
    <div className="border-t border-line py-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm font-semibold text-ink/70">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true">
      <p className="sr-only">Loading destination…</p>
      <div className="h-10 w-1/2 bg-mist" />
      <div className="mt-6 grid gap-8 md:grid-cols-[18rem_1fr]">
        <div className="h-48 bg-mist" />
        <div className="space-y-3">
          <div className="h-5 bg-mist" />
          <div className="h-5 bg-mist" />
          <div className="h-5 w-2/3 bg-mist" />
        </div>
      </div>
    </div>
  );
}

export default function DestinationPage() {
  const { code } = useParams();
  const [state, setState] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/destinations/${encodeURIComponent(code)}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(body.error || `Request failed (${res.status}).`);
          err.status = res.status;
          throw err;
        }
        setState({ status: "ready", destination: body.destination, weather: body.weather });
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setState({
          status: "error",
          notFound: err.status === 404 || err.status === 400,
          message:
            err instanceof TypeError
              ? "Could not reach the server. Check your connection and try again."
              : err.message,
        });
      });

    return () => ctrl.abort();
  }, [code, attempt]);

  const back = (
    <Link href="/" className="mb-6 inline-block text-sm font-semibold text-sea underline">
      Back to Explore
    </Link>
  );

  if (state.status === "loading") {
    return (
      <div>
        {back}
        <Loading />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        {back}
        <div role="alert" className="rounded-md border border-post bg-white p-6">
          <h1 className="font-display text-2xl font-semibold">
            {state.notFound ? "That destination does not exist" : "This destination did not load"}
          </h1>
          <p className="mt-1 text-ink/80">{state.message}</p>
          {state.notFound ? (
            <Link href="/" className="btn btn-primary mt-4">
              Browse destinations
            </Link>
          ) : (
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn btn-primary mt-4">
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const { destination: d, weather } = state;

  return (
    <div>
      {back}
      <div className="grid gap-8 md:grid-cols-[18rem_1fr]">
        <div>
          <Stamp src={d.flag} alt={d.flagAlt || `Flag of ${d.name}`} />
          <AddButton destination={d} className="mt-4 w-full" />
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{d.name}</h1>
          {d.officialName && <p className="mt-1 text-ink/80">{d.officialName}</p>}

          <dl className="mt-6 border-b border-line">
            <Fact label="Capital">{d.capital || "None"}</Fact>
            <Fact label="Region">{d.subregion ? `${d.subregion}, ${d.region}` : d.region}</Fact>
            <Fact label="Population">{formatNumber(d.population)}</Fact>
            <Fact label="Area">{d.area ? `${formatNumber(d.area)} km²` : "Unknown"}</Fact>
            <Fact label="Languages">{d.languages.length ? d.languages.join(", ") : "Unknown"}</Fact>
            <Fact label="Currency">{d.currencies.length ? d.currencies.join(", ") : "Unknown"}</Fact>
            <Fact label="Time zones">{d.timezones.length ? d.timezones.join(", ") : "Unknown"}</Fact>
            <Fact label="Coastline">{d.landlocked ? "Landlocked" : "Has a coastline"}</Fact>
            {d.borders.length > 0 && (
              <Fact label="Neighbours">
                <span className="flex flex-wrap gap-2">
                  {d.borders.map((b) => (
                    <Link
                      key={b}
                      href={`/destination/${b}`}
                      className="rounded-md border border-line bg-white px-2 py-0.5 text-sm font-semibold text-sea hover:bg-mist"
                    >
                      {b}
                    </Link>
                  ))}
                </span>
              </Fact>
            )}
          </dl>

          {d.mapUrl && (
            <a
              href={d.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-sea underline"
            >
              Open {d.capital || d.name} on OpenStreetMap
            </a>
          )}
        </div>
      </div>

      <section aria-labelledby="weather" className="mt-10">
        <h2 id="weather" className="font-display text-2xl font-semibold">
          Weather in {d.capital || d.name}
        </h2>
        {weather ? (
          <>
            <p className="mt-2 text-lg">
              Now: {Math.round(weather.current.temperature)}
              {weather.units.temperature}, {weather.current.summary.toLowerCase()}, wind{" "}
              {Math.round(weather.current.wind)} {weather.units.wind}
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {weather.daily.map((day) => (
                <li key={day.date} className="rounded-md border border-line bg-white p-3">
                  <p className="text-sm font-semibold">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-ink/80">{day.summary}</p>
                  <p className="mt-1 text-sm">
                    {Math.round(day.max)}
                    {weather.units.temperature} / {Math.round(day.min)}
                    {weather.units.temperature}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 rounded-md border border-dashed border-line bg-white p-4 text-ink/80">
            The forecast is not available right now. The rest of the details above are unaffected.
          </p>
        )}
      </section>
    </div>
  );
}
