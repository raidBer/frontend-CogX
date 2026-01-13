"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playerService } from "@/services";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { player, setPlayer } = usePlayer();
  const { t } = useLanguage();
  const router = useRouter();

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const newPlayer = await playerService.createPlayer({ pseudo });
      setPlayer(newPlayer);
      setPseudo("");
      alert(`Player created: ${newPlayer.pseudo}`);
      router.push("/lobbies");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  const handleGetPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fetchedPlayer = await playerService.getPlayer(playerId);
      setPlayer(fetchedPlayer);
      setPlayerId("");
      alert(`Welcome back, ${fetchedPlayer.pseudo}!`);
      router.push("/lobbies");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get player");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-4xl font-bold mb-8 text-neon-cyan"
          style={{ textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
        >
          {t("player.title")}
        </h1>

        {player && (
          <div className="bg-dark-elevated border border-neon-blue text-white p-4 rounded-lg mb-6 shadow-neon">
            <p className="text-lg">
              {t("player.welcome")}:{" "}
              <strong className="text-neon-cyan">{player.pseudo}</strong>
            </p>
            <button
              onClick={() => setPlayer(null)}
              className="mt-2 text-sm text-neon-purple hover:text-neon-cyan transition-colors underline"
            >
              Switch Player
            </button>
          </div>
        )}

        {/* Create Player */}
        <div className="bg-dark-surface p-6 rounded-lg border border-dark-border shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">
            {t("player.enterName")}
          </h2>
          <form onSubmit={handleCreatePlayer}>
            <input
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t("player.namePlaceholder")}
              className="w-full p-3 bg-dark-elevated border border-dark-border rounded mb-4 text-white placeholder-gray-500 focus:border-neon-blue focus:shadow-neon transition-all"
              required
              minLength={3}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neon-blue text-white p-3 rounded-lg font-bold hover:bg-blue-600 hover:shadow-neon disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            >
              {loading ? `${t("common.loading")}...` : t("player.join")}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
