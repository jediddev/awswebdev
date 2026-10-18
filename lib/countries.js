const BASE = "https://api.restcountries.com/countries/v5";
const TTL = 60 * 60 * 1000;

const LIST_FIELDS = [
  "names.common",
  "names.official",
  "codes.alpha_2",
  "codes.alpha_3",
  "capitals",
  "region",
  "subregion",
  "population",
  "flag.url_svg",
  "flag.url_png",
  "flag.description",
  "languages",
  "currencies",
].join(",");

const cache = (globalThis.__countryCache ??= {
  list: null,
  listAt: 0,
  byCode: new Map(),
});

async function rc(path) {
  const key = process.env.RESTCOUNTRIES_API_KEY;
  if (!key) {
    throw new Error(
      "RESTCOUNTRIES_API_KEY is not set. Add it to .env.local and restart `npm run dev`.",
    );
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

const apiMessage = (r) =>
  r.body?.errors?.[0]?.message ||
  `REST Countries responded with status ${r.status}`;

const NAME_KEYS = ["name", "english_name", "name_english", "english", "common"];
function labelOf(x) {
  if (typeof x === "string") return x;
  if (x && typeof x === "object") {
    for (const k of NAME_KEYS) {
      const v = x[k];
      if (typeof v === "string" && v) return v;
      if (v && typeof v === "object" && typeof v.english === "string")
        return v.english;
    }
    const first = Object.values(x).find((v) => typeof v === "string" && v);
    return first || null;
  }
  return null;
}

function toLatLng(c) {
  if (!c) return null;
  if (Array.isArray(c) && c.length >= 2) return [Number(c[0]), Number(c[1])];
  const lat = c.lat ?? c.latitude;
  const lng = c.lng ?? c.lon ?? c.longitude;
  return lat != null && lng != null ? [Number(lat), Number(lng)] : null;
}

function listOf(value) {
  if (Array.isArray(value)) return value.map(labelOf).filter(Boolean);
  if (value && typeof value === "object")
    return Object.values(value).map(labelOf).filter(Boolean);
  return [];
}

function currencyList(value) {
  if (!value || typeof value !== "object") return [];
  const entries = Array.isArray(value)
    ? value.map((v) => [null, v])
    : Object.entries(value);
  return entries
    .map(([code, v]) => {
      const name = labelOf(v) || code;
      return name ? (v?.symbol ? `${name} (${v.symbol})` : name) : null;
    })
    .filter(Boolean);
}

export function normalize(c) {
  const caps = Array.isArray(c.capitals) ? c.capitals : [];
  const cap = caps.find((x) => x?.attributes?.primary) ?? caps[0];
  const alpha2 = (c.codes?.alpha_2 || "").toLowerCase();
  return {
    code: c.codes?.alpha_3,
    name: c.names?.common ?? c.codes?.alpha_3,
    officialName: c.names?.official ?? "",
    capital: cap ? labelOf(cap) : null,
    region: c.region || "Other",
    subregion: c.subregion ?? null,
    population: typeof c.population === "number" ? c.population : 0,
    flag:
      c.flag?.url_svg ||
      c.flag?.url_png ||
      (alpha2 ? `https://flags.restcountries.com/v5/w320/${alpha2}.png` : ""),
    flagAlt: c.flag?.description || "",
    languages: listOf(c.languages),
    currencies: currencyList(c.currencies),
  };
}

export async function fetchAllCountries() {
  if (cache.list && Date.now() - cache.listAt < TTL) return cache.list;

  const objects = [];
  let offset = 0;
  for (let page = 0; page < 6; page++) {
    const r = await rc(
      `?limit=100&offset=${offset}&response_fields=${LIST_FIELDS}`,
    );
    if (!r.ok) throw new Error(apiMessage(r));
    const batch = r.body?.data?.objects;
    if (!Array.isArray(batch)) {
      throw new Error(
        `Unexpected REST Countries response: ${JSON.stringify(r.body).slice(0, 300)}`,
      );
    }
    objects.push(...batch);
    if (!r.body.data.meta?.more) break;
    offset += 100;
  }

  const list = objects.map(normalize).filter((d) => d.code);
  cache.list = list;
  cache.listAt = Date.now();
  return list;
}

export async function fetchCountry(code) {
  const hit = cache.byCode.get(code);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const r = await rc(`/codes.alpha_3/${encodeURIComponent(code)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(apiMessage(r));

  const c = r.body?.data?.objects?.[0];
  if (!c) return null;

  const caps = Array.isArray(c.capitals) ? c.capitals : [];
  const cap = caps.find((x) => x?.attributes?.primary) ?? caps[0];
  const point = toLatLng(cap?.coordinates) ?? toLatLng(c.coordinates);

  const value = {
    ...normalize(c),
    area: c.area?.kilometers ?? null,
    timezones: Array.isArray(c.timezones) ? c.timezones : [],
    borders: Array.isArray(c.borders) ? c.borders : [],
    landlocked: Boolean(c.landlocked),
    mapUrl:
      c.links?.open_street_maps ||
      (point
        ? `https://www.openstreetmap.org/?mlat=${point[0]}&mlon=${point[1]}#map=5/${point[0]}/${point[1]}`
        : null),
    weatherPoint: point,
  };

  cache.byCode.set(code, { value, at: Date.now() });
  return value;
}
