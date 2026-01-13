"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { leaderboardService } from "@/services";
import { LeaderboardResponse, GameStatsDto } from "@/types/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [gameStats, setGameStats] = useState<GameStatsDto[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { player, activeGame } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    if (!player) {
      router.push("/player");
      return;
    }

    // Redirect to active game if one exists
    if (activeGame) {
      router.push(
        `/game/${activeGame.gameType}?session=${activeGame.sessionId}&lobby=${activeGame.lobbyId}`
      );
      return;
    }

    fetchGameStats();
  }, [player, activeGame]);

  useEffect(() => {
    if (selectedGame) {
      fetchLeaderboard();
    }
  }, [selectedGame]);

  const fetchGameStats = async () => {
    setLoading(true);
    try {
      const data = await leaderboardService.getGameStats();
      setGameStats(data);
      if (data.length > 0 && !selectedGame) {
        setSelectedGame(data[0].gameType || "");
      }
    } catch (err: any) {
      setError("Failed to fetch game stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedGame) return;

    setLoading(true);
    setError("");
    try {
      const data = await leaderboardService.getLeaderboard(selectedGame, 10);
      setLeaderboard(data);
    } catch (err: any) {
      setError("Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        <h1
          className="text-4xl font-bold mb-8 text-neon-cyan"
          style={{ textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
        >
          {t("leaderboard.title")}
        </h1>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {gameStats.map((stat) => (
            <div
              key={stat.gameType}
              onClick={() => setSelectedGame(stat.gameType || "")}
              className={`p-6 rounded-lg border cursor-pointer transition-all ${
                selectedGame === stat.gameType
                  ? "bg-neon-blue text-white border-neon-blue shadow-neon"
                  : "bg-dark-surface border-dark-border text-gray-300 hover:bg-dark-elevated hover:border-neon-cyan"
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{stat.gameType}</h3>
              <p className="text-sm mb-1">Players: {stat.totalPlayers}</p>
              <p className="text-sm mb-1">Games: {stat.totalGames}</p>
              <p className="text-sm mb-1">High Score: {stat.highestScore}</p>
              {stat.bestTime && (
                <p className="text-sm">Best Time: {stat.bestTime}</p>
              )}
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <p className="text-gray-400">Loading leaderboard...</p>
        ) : leaderboard &&
          leaderboard.entries &&
          leaderboard.entries.length > 0 ? (
          <div className="bg-dark-surface rounded-lg border border-dark-border shadow-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border">
              <h2 className="text-2xl font-semibold text-gray-200">
                {leaderboard.gameType} - Top Players
              </h2>
              <p className="text-gray-400">
                Total Entries: {leaderboard.totalEntries}
              </p>
            </div>
            <table className="w-full">
              <thead className="bg-dark-elevated">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("leaderboard.rank")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("leaderboard.player")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("leaderboard.score")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {t("leaderboard.date")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-surface divide-y divide-dark-border">
                {leaderboard.entries.map((entry) => (
                  <tr
                    key={`${entry.pseudo}-${entry.rank}`}
                    className={
                      entry.isCurrentPlayer
                        ? "bg-neon-blue/20"
                        : "hover:bg-dark-elevated transition-colors"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-neon-cyan">
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {entry.pseudo}
                      {entry.isCurrentPlayer && (
                        <span className="ml-2 text-xs bg-neon-purple/30 text-neon-purple px-2 py-1 rounded-full border border-neon-purple">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neon-blue font-bold">
                      {entry.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {entry.timeFormatted || entry.time || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {new Date(entry.achievedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {t("leaderboard.noScores")}
          </p>
        )}
      </div>
    </div>
  );
}
