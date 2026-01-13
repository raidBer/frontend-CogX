"use client";

import { useState, useEffect } from "react";
import { adminService } from "@/services";
import { useLanguage } from "@/contexts/LanguageContext";
import { GameSessionSummaryDto, GameHistoryResponse } from "@/types/api";

export default function AdminPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<GameSessionSummaryDto[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<GameHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ gameType: "", limit: 50 });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminService.getGameSessions(
        filter.gameType || undefined,
        filter.limit
      );
      setSessions(data);
    } catch (err: any) {
      setError(t("admin.errorFetchSessions"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (sessionId: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminService.getGameHistory(sessionId);
      setSelectedSession(data);
    } catch (err: any) {
      setError(t("admin.errorFetchHistory"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;

    try {
      await adminService.deleteGameSession(sessionId);
      alert(t("admin.deleteSuccess"));
      fetchSessions();
      setSelectedSession(null);
    } catch (err: any) {
      setError(t("admin.errorDeleteSession"));
    }
  };

  const handleExportSession = async (sessionId: string) => {
    try {
      const blob = await adminService.exportGameSession(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-session-${sessionId}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(t("admin.errorExportSession"));
    }
  };

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold text-neon-cyan mb-2"
            style={{ textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
          >
            {t("admin.title")}
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-neon-cyan to-neon-blue rounded-full"></div>
        </div>

        {error && (
          <div className="bg-red-900/30 border-2 border-red-500 text-red-300 p-4 rounded-lg mb-6 backdrop-blur-sm">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-dark-surface border border-dark-border p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-200">
            {t("admin.filters")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-300 font-medium">
                {t("admin.gameType")}
              </label>
              <select
                value={filter.gameType}
                onChange={(e) =>
                  setFilter({ ...filter, gameType: e.target.value })
                }
                className="w-full p-3 bg-dark-elevated border border-dark-border rounded-lg text-white focus:border-neon-blue focus:outline-none transition-all"
              >
                <option value="">{t("admin.allGames")}</option>
                <option value="Morpion">Tic-Tac-Toe (Morpion)</option>
                <option value="SpeedTyping">Speed Typing</option>
                <option value="Puissance4">Connect 4 (Puissance4)</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-gray-300 font-medium">
                {t("admin.limit")}
              </label>
              <input
                type="number"
                value={filter.limit}
                onChange={(e) =>
                  setFilter({ ...filter, limit: parseInt(e.target.value) })
                }
                className="w-full p-3 bg-dark-elevated border border-dark-border rounded-lg text-white focus:border-neon-blue focus:outline-none transition-all"
                min="1"
                max="200"
              />
            </div>
          </div>
          <button
            onClick={fetchSessions}
            className="mt-6 bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-bg px-6 py-3 rounded-lg font-bold hover:shadow-neon-cyan transition-all transform hover:scale-[1.02]"
          >
            {t("admin.applyFilters")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sessions List */}
          <div className="bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border bg-dark-elevated">
              <h2 className="text-2xl font-semibold text-neon-cyan">
                {t("admin.gameSessions")}
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {loading && (
                <p className="p-6 text-gray-400">
                  {t("admin.loadingSessions")}
                </p>
              )}
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 border-b border-dark-border hover:bg-dark-elevated cursor-pointer transition-colors"
                  onClick={() => handleViewHistory(session.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-neon-cyan">
                      {session.gameType}
                    </h3>
                    <span className="text-xs text-gray-400 bg-dark-elevated px-3 py-1 rounded-full">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-400">
                      {t("admin.players")}:{" "}
                      <span className="text-white font-semibold">
                        {session.playerCount}
                      </span>{" "}
                      | {t("admin.actions")}:{" "}
                      <span className="text-white font-semibold">
                        {session.totalActions}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400">
                      {t("admin.status")}:{" "}
                      <span
                        className={
                          session.finishedAt
                            ? "text-green-400"
                            : "text-yellow-400"
                        }
                      >
                        {session.finishedAt
                          ? t("admin.finished")
                          : t("admin.inProgress")}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSession(session.id);
                      }}
                      className="text-xs bg-neon-green/20 text-neon-green border border-neon-green px-3 py-1.5 rounded-lg hover:bg-neon-green/30 font-semibold transition-all"
                    >
                      {t("admin.export")}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      className="text-xs bg-red-900/30 text-red-400 border border-red-500 px-3 py-1.5 rounded-lg hover:bg-red-900/50 font-semibold transition-all"
                    >
                      {t("admin.delete")}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && sessions.length === 0 && (
                <p className="p-6 text-center text-gray-500">
                  {t("admin.noSessions")}
                </p>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="bg-dark-surface border border-dark-border rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-dark-border bg-dark-elevated">
              <h2 className="text-2xl font-semibold text-neon-cyan">
                {t("admin.sessionDetails")}
              </h2>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto">
              {selectedSession ? (
                <div>
                  <div className="mb-6 bg-dark-elevated border border-dark-border p-4 rounded-lg">
                    <h3 className="text-2xl font-bold mb-3 text-neon-blue">
                      {selectedSession.gameType}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-400">
                        {t("admin.started")}:{" "}
                        <span className="text-white">
                          {new Date(
                            selectedSession.gameStartedAt
                          ).toLocaleString()}
                        </span>
                      </p>
                      {selectedSession.gameFinishedAt && (
                        <p className="text-gray-400">
                          {t("admin.finished")}:{" "}
                          <span className="text-white">
                            {new Date(
                              selectedSession.gameFinishedAt
                            ).toLocaleString()}
                          </span>
                        </p>
                      )}
                      <p className="text-gray-400">
                        {t("admin.duration")}:{" "}
                        <span className="text-white font-semibold">
                          {selectedSession.duration}
                        </span>
                      </p>
                    </div>
                    {(() => {
                      // Find GameOver action to get winner info
                      const gameOverAction = selectedSession.actions?.find(
                        (action) => action.actionType === "GameOver"
                      );
                      if (gameOverAction) {
                        try {
                          // Try to parse the action data if it's a string
                          let actionData = gameOverAction.parsedActionData;
                          if (!actionData && gameOverAction.actionData) {
                            actionData = JSON.parse(gameOverAction.actionData);
                          }

                          if (actionData) {
                            const winnerPseudo =
                              actionData.winnerPseudo ||
                              actionData.WinnerPseudo;
                            const isDraw =
                              actionData.isDraw || actionData.IsDraw;

                            return (
                              <div className="mt-4 p-4 bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border border-neon-purple rounded-lg">
                                <p className="text-white font-bold text-lg">
                                  {isDraw
                                    ? `🤝 ${t("game.draw")}`
                                    : `🏆 ${t("game.winner")}: ${winnerPseudo}`}
                                </p>
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error("Error parsing GameOver action:", e);
                        }
                      }
                      return null;
                    })()}
                  </div>

                  {/* Player Summaries */}
                  {selectedSession.playerSummaries &&
                    selectedSession.playerSummaries.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 text-gray-200 text-lg">
                          {t("admin.players")}
                        </h4>
                        <div className="space-y-2">
                          {selectedSession.playerSummaries.map((player) => (
                            <div
                              key={player.playerId}
                              className="bg-dark-elevated border border-dark-border p-4 rounded-lg"
                            >
                              <p className="font-bold text-white text-lg">
                                {player.pseudo}
                              </p>
                              <p className="text-sm text-gray-400">
                                {t("admin.actions")}:{" "}
                                <span className="text-neon-blue font-semibold">
                                  {player.actionCount}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Action Stats */}
                  {selectedSession.actionStats && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-200 text-lg">
                        {t("admin.actionStatistics")}
                      </h4>
                      <div className="bg-dark-elevated border border-dark-border p-4 rounded-lg">
                        {Object.entries(selectedSession.actionStats).map(
                          ([action, count]) => (
                            <p
                              key={action}
                              className="text-sm text-gray-300 py-1"
                            >
                              <span className="text-neon-cyan font-semibold">
                                {action}
                              </span>
                              : {count}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedSession.actions &&
                    selectedSession.actions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-200 text-lg">
                          {t("admin.recentActions")} (
                          {selectedSession.actions.length})
                        </h4>
                        <div className="space-y-2">
                          {selectedSession.actions
                            .slice(0, 20)
                            .map((action) => (
                              <div
                                key={action.id}
                                className="bg-dark-elevated border border-dark-border p-3 rounded-lg text-sm"
                              >
                                <p className="font-bold text-neon-cyan">
                                  {action.playerPseudo}
                                </p>
                                <p className="text-gray-400">
                                  {action.actionType}{" "}
                                  <span className="text-gray-500">
                                    - {action.timeSinceStart}
                                  </span>
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-12">
                  {t("admin.selectSession")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
