import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "CogX - Gaming Platform",
  description: "Multiplayer cognitive gaming platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <PlayerProvider>
            <Navigation />
            {children}
          </PlayerProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
