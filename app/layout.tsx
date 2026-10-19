import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/app/context/AuthContext";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bricq · Le passeport de votre logement",
    template: "%s · Bricq",
  },
  description:
    "Tout ce que les données publiques savent de votre logement : bâtiment, énergie, risques, urbanisme et prix du quartier, puis le carnet de santé du propriétaire.",
  icons: { icon: "/logo-bricq.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1E3A4C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${atkinson.variable} ${bricolage.variable} ${plexMono.variable} bg-papier text-texte font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] btn btn-encre">
          Aller au contenu
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
