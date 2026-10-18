"use client";

import { useState } from "react";
import { useTrip } from "./TripProvider";

export default function AddButton({ destination, className = "" }) {
  const { has, add, remove, status } = useTrip();
  const [busy, setBusy] = useState(false);
  const added = has(destination.code);

  async function onClick() {
    setBusy(true);
    if (added) await remove(destination.code, destination.name);
    else await add(destination);
    setBusy(false);
  }

  const label = busy ? (added ? "Removing…" : "Adding…") : added ? "Remove from trip" : "Add to trip";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || status === "loading"}
      className={`btn ${added ? "btn-outline" : "btn-primary"} ${className}`}
    >
      {label}
    </button>
  );
}
