# TripWise: Smart Travel Planner

**Track:** Full-Stack · AWS Student Builder Group, VIT Chennai · Web Development recruitment task (Round 1)

TripWise lets you explore destinations, open one to see its details and live weather, and build a personal trip that is saved on the server and survives refreshes.

## Features

- **Explore:** every country as a card, with search (name or capital), region filter, four sort orders, and "Show more" paging.
- **Destination details:** capital, region, population, area, languages, currency, time zones, neighbours, a map link, and a 5-day forecast for the capital.
- **My trip:** add, view, remove, and write notes per destination. Saved in `data/db.json`.
- **States:** loading skeletons, empty results, empty trip, and clear error messages with retry for failed or unreachable requests.
- **Responsive:** built mobile-first with Tailwind CSS; keyboard focus and reduced-motion are respected.

## Tech stack

- Next.js 14 (App Router) with API route handlers as the backend
- Tailwind CSS 3
- JSON file database (`data/db.json`), written atomically through a serialised queue
- External APIs (no keys needed):
  - [REST Countries v3.1](https://restcountries.com): destination data
  - [Open-Meteo](https://open-meteo.com): weather (attribution in the footer)

## Run locally

Requires Node.js 18.17 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
# production:
npm run build && npm start
```

There are no environment variables and no secrets. `data/db.json` ships with two placeholder trip items (Japan, Iceland). Remove them from the My trip page, or replace the file contents with `{ "itinerary": [] }`.

## Database

`data/db.json` holds one collection:

```json
{
  "itinerary": [
    {
      "code": "JPN", "name": "Japan", "capital": "Tokyo", "region": "Asia",
      "flag": "https://flagcdn.com/jp.svg", "population": 123210000,
      "note": "Tokyo and Kyoto in cherry blossom season.",
      "addedAt": "2026-10-01T09:00:00.000Z"
    }
  ]
}
```

## API reference

All responses are JSON. Errors look like `{ "error": "message" }`.

### `GET /api/destinations`

Query parameters (all optional): `q` (up to 60 chars; matches name, official name, capital), `region` (`all`, `Africa`, `Americas`, `Antarctic`, `Asia`, `Europe`, `Oceania`), `sort` (`name` or `population`), `order` (`asc` or `desc`).

```
GET /api/destinations?q=ice&region=Europe&sort=population&order=desc
200 { "total": 1, "results": [ { "code": "ISL", "name": "Iceland", "capital": "Reykjavik",
      "region": "Europe", "subregion": "Northern Europe", "population": 366425,
      "flag": "https://flagcdn.com/is.svg", "languages": ["Icelandic"], "currencies": ["Icelandic króna (kr)"] } ] }
400 { "error": "Unknown region \"Mars\". Use one of: all, Africa, ..." }
502 { "error": "The destinations service is not responding. Try again in a moment." }
```

### `GET /api/destinations/:code`

```
GET /api/destinations/JPN
200 { "destination": { "code": "JPN", "name": "Japan", "area": 377930, "timezones": ["UTC+09:00"],
      "borders": [], "landlocked": false, "mapUrl": "https://www.openstreetmap.org/...", ... },
      "weather": { "current": { "temperature": 21.4, "wind": 9.1, "summary": "Partly cloudy" },
                   "daily": [ { "date": "2026-10-19", "max": 24, "min": 17, "summary": "Rain showers" } ],
                   "units": { "temperature": "°C", "wind": "km/h" } } }
400 { "error": "Destination codes are three letters, for example JPN." }
404 { "error": "No destination found for code ZZZ." }
```

`weather` is `null` if the weather service fails; the destination still loads.

### `GET /api/itinerary`

```
200 { "items": [ { "code": "JPN", "name": "Japan", "note": "", "addedAt": "..." } ] }
```

### `POST /api/itinerary`

```
POST /api/itinerary
{ "code": "FRA", "name": "France", "capital": "Paris", "region": "Europe",
  "flag": "https://flagcdn.com/fr.svg", "population": 67391582 }
201 { "item": { "code": "FRA", "name": "France", "note": "", "addedAt": "..." } }
400 { "error": "code must be a three-letter destination code, for example JPN." }
409 { "error": "France is already in your trip." }
```

### `PATCH /api/itinerary`

```
{ "code": "FRA", "note": "Book the Louvre in advance" }
200 { "item": { ... } }     404 { "error": "FRA is not in your trip." }
```

### `DELETE /api/itinerary?code=FRA`

```
200 { "item": { "code": "FRA", ... } }
400 { "error": "Add ?code=JPN (a three-letter destination code) to the URL." }
404 { "error": "FRA is not in your trip." }
```

## Deployment note

The itinerary is stored in a local file, so deploy to a host with a **persistent writable disk** (Render with a disk, Railway with a volume, a VPS, etc.). Serverless hosts such as Vercel have a read-only, ephemeral filesystem: reads work, but saved items will not persist there.

## Submission checklist

- [ ] Public GitHub repo, no secrets committed (none are used)
- [ ] Live URL tested on desktop and mobile
- [ ] PDF named `26BCE5008_fullstack.pdf` with screenshots: Explore, search/filter result, Destination Details, My trip (populated and empty), error or empty state, and mobile views of each
# awswebdev
