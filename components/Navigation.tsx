"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="bg-dark-surface border-b border-dark-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center px-2 py-2 text-2xl font-bold text-neon-cyan hover:text-neon-blue transition-colors"
              style={{ textShadow: "0 0 10px rgba(0, 240, 255, 0.5)" }}
            >
              CogX
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/player"
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-300 hover:text-neon-cyan hover:bg-dark-elevated transition-all"
            >
              {t("nav.player")}
            </Link>
            <Link
              href="/lobbies"
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-300 hover:text-neon-cyan hover:bg-dark-elevated transition-all"
            >
              {t("nav.lobbies")}
            </Link>
            <Link
              href="/leaderboard"
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-300 hover:text-neon-cyan hover:bg-dark-elevated transition-all"
            >
              {t("nav.leaderboard")}
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 rounded-md text-sm font-semibold text-gray-300 hover:text-neon-cyan hover:bg-dark-elevated transition-all"
            >
              {t("nav.admin")}
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center space-x-2 ml-4 border-l border-dark-border pl-4">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                  language === "en"
                    ? "bg-neon-blue text-white shadow-neon"
                    : "bg-dark-elevated text-gray-400 hover:text-white hover:bg-dark-border"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("fr")}
                className={`px-3 py-1 rounded text-sm font-bold transition-all ${
                  language === "fr"
                    ? "bg-neon-blue text-white shadow-neon"
                    : "bg-dark-elevated text-gray-400 hover:text-white hover:bg-dark-border"
                }`}
              >
                FR
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
