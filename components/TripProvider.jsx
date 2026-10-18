"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const TripContext = createContext(null);

async function api(url, options) {
  let res;
  try {
    res = await fetch(url, { cache: "no-store", ...options });
  } catch {
    throw new Error(
      "Could not reach the server. Check your connection and try again.",
    );
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return body;
}

export function TripProvider({ children }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, tone = "ok") => {
    setToast({ message, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const body = await api("/api/itinerary");
      setItems(body.items);
      setError("");
      setStatus("ready");
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (d) => {
      try {
        const body = await api("/api/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: d.code,
            name: d.name,
            capital: d.capital,
            region: d.region,
            flag: d.flag,
            population: d.population,
          }),
        });
        setItems((prev) => [...prev, body.item]);
        notify(`Added ${d.name} to your trip.`);
      } catch (err) {
        if (err.status === 409) load();
        notify(err.message, "error");
      }
    },
    [load, notify],
  );

  const remove = useCallback(
    async (code, name) => {
      try {
        await api(`/api/itinerary?code=${encodeURIComponent(code)}`, {
          method: "DELETE",
        });
        setItems((prev) => prev.filter((i) => i.code !== code));
        notify(`Removed ${name || code} from your trip.`);
      } catch (err) {
        if (err.status === 404) load();
        notify(err.message, "error");
      }
    },
    [load, notify],
  );

  const saveNote = useCallback(
    async (code, note) => {
      try {
        const body = await api("/api/itinerary", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, note }),
        });
        setItems((prev) => prev.map((i) => (i.code === code ? body.item : i)));
        return true;
      } catch (err) {
        notify(err.message, "error");
        return false;
      }
    },
    [notify],
  );

  const has = useCallback(
    (code) => items.some((i) => i.code === code),
    [items],
  );

  return (
    <TripContext.Provider
      value={{ items, status, error, reload: load, add, remove, saveNote, has }}
    >
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-4 sm:w-80"
      >
        {toast && (
          <p
            className={`pointer-events-auto rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.tone === "error" ? "bg-post" : "bg-ink"
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside <TripProvider>");
  return ctx;
}
