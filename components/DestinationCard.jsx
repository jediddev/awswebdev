import Link from "next/link";
import Stamp from "./Stamp";
import AddButton from "./AddButton";
import { formatPopulation } from "@/lib/format";

export default function DestinationCard({ destination: d }) {
  const href = `/destination/${d.code}`;
  return (
    <article className="flex gap-4 rounded-md border border-line bg-white p-4">
      <Link href={href} className="w-24 shrink-0 self-start" aria-label={`Open ${d.name}`}>
        <Stamp src={d.flag} alt="" onWhite />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="font-display text-xl font-semibold leading-tight">
          <Link href={href} className="hover:underline">
            {d.name}
          </Link>
        </h2>
        <p className="mt-1 text-sm text-ink/80">Capital: {d.capital || "None"}</p>
        <p className="text-sm text-ink/80">{d.subregion || d.region}</p>
        <p className="text-sm text-ink/80">Population: {formatPopulation(d.population)}</p>
        <AddButton destination={d} className="mt-3 self-start" />
      </div>
    </article>
  );
}
