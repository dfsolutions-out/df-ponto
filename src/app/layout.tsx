import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "leaflet/dist/leaflet.css";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DF Ponto",
    template: "%s | DF Ponto",
  },

  description:
    "Sistema de controle digital de jornadas, funcionários, locais autorizados e registros de ponto.",

  applicationName: "DF Ponto",

  authors: [
    {
      name: "DF Solutions",
    },
  ],

  creator: "DF Solutions",
  publisher: "DF Solutions",

  robots: {
    index: false,
    follow: false,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}