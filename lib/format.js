const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-IN");

export const formatPopulation = (n) => (typeof n === "number" ? compact.format(n) : "Unknown");
export const formatNumber = (n) => (typeof n === "number" ? full.format(n) : "Unknown");
