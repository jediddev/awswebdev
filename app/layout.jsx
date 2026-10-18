import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import "./globals.css";
import { TripProvider } from "@/components/TripProvider";
import Header from "@/components/Header";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  title: "TripWise: plan your trip",
  description: "Explore destinations, check the weather, and build a trip you can come back to.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <TripProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-ink/70 sm:px-6">
            Destination data from{" "}
            <a className="underline" href="https://restcountries.com" target="_blank" rel="noreferrer">
              REST Countries
            </a>
            . Weather by{" "}
            <a className="underline" href="https://open-meteo.com" target="_blank" rel="noreferrer">
              Open-Meteo
            </a>
            .
          </footer>
        </TripProvider>
      </body>
    </html>
  );
}
