"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { playerService } from "@/services";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PlayerPage() {
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
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold mb-4 text-neon-cyan"
            style={{ textShadow: "0 0 30px rgba(0, 240, 255, 0.6)" }}
          >
            {t("player.title")}
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-neon-cyan to-neon-blue mx-auto rounded-full"></div>
        </div>

        {player && (
          <div className="bg-dark-elevated border border-neon-blue rounded-lg p-6 mb-8 shadow-neon">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">
                  {t("player.welcome")}
                </p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {player.pseudo}
                </p>
              </div>
              <button
                onClick={() => setPlayer(null)}
                className="px-4 py-2 bg-dark-surface border border-dark-border text-neon-purple hover:text-neon-cyan hover:border-neon-cyan rounded-lg transition-all font-semibold"
              >
                Switch Player
              </button>
            </div>
          </div>
        )}

        {/* Create Player */}
        <div className="bg-dark-surface border border-dark-border rounded-lg p-8 shadow-lg mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-200 mb-2">
              {t("player.enterName")}
            </h2>
            <p className="text-gray-400 text-sm">Choose your gaming identity</p>
          </div>
          <form onSubmit={handleCreatePlayer}>
            <div className="mb-6">
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder={t("player.namePlaceholder")}
                className="w-full p-4 bg-dark-elevated border-2 border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none focus:shadow-neon-cyan transition-all text-lg"
                required
                minLength={3}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-bg p-4 rounded-lg font-bold text-lg hover:shadow-neon-cyan disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-100"
            >
              {loading ? `${t("common.loading")}...` : t("player.join")}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-500 text-red-300 p-4 rounded-lg mb-6 backdrop-blur-sm">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
