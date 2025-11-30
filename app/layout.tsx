import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const merriweather = Merriweather({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-merriweather"
});

export const metadata: Metadata = {
  title: "Kadris - L'histoire invisible de votre logement",
  description: "Passeport numérique immobilier et analyse de risques.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      {/* 👇 LA LIGNE MAGIQUE EST JUSTE EN DESSOUS */}
      <body
        className={`${inter.variable} ${merriweather.variable} bg-kadris-cream text-kadris-slate font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}