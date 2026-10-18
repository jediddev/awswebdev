import { NextResponse } from "next/server";
import { fetchCountry } from "@/lib/countries";
import { fetchWeather } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const code = String(params.code || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    return NextResponse.json(
      { error: "Destination codes are three letters, for example JPN." },
      { status: 400 },
    );
  }

  let destination;
  try {
    destination = await fetchCountry(code);
  } catch (err) {
    console.error("Destination upstream error:", err);
    return NextResponse.json(
      {
        error:
          "The destinations service is not responding. Try again in a moment.",
      },
      { status: 502 },
    );
  }
  if (!destination) {
    return NextResponse.json(
      { error: `No destination found for code ${code}.` },
      { status: 404 },
    );
  }

  let weather = null;
  try {
    weather = await fetchWeather(destination.weatherPoint);
  } catch (err) {
    console.error("Weather upstream error:", err);
  }

  const { weatherPoint, ...rest } = destination;
  return NextResponse.json({ destination: rest, weather });
}
