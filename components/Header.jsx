"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTrip } from "./TripProvider";

export default function Header() {
  const pathname = usePathname();
  const { items, status } = useTrip();

  const link = (href, label, extra) => {
    const active = href === "/" ? pathname === "/" || pathname.startsWith("/destination") : pathname.startsWith(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`rounded-md px-3 py-2 text-sm font-semibold ${
          active ? "bg-ink text-white" : "text-ink hover:bg-mist"
        }`}
      >
        {label}
        {extra}
      </Link>
    );
  };

  return (
    <header className="border-b border-line bg-white">
      <div className="airmail" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          TripWise
        </Link>
        <nav aria-label="Main" className="flex gap-1">
          {link("/", "Explore")}
          {link(
            "/trip",
            "My trip",
            status === "ready" && items.length > 0 ? (
              <span className="ml-2 rounded-full bg-post px-2 py-0.5 text-xs text-white">{items.length}</span>
            ) : null
          )}
        </nav>
      </div>
    </header>
  );
}
