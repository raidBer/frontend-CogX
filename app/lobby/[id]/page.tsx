"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { lobbyService } from "@/services";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LobbyDetailsDto, PlayerDto } from "@/types/api";
import { createHubConnection } from "@/lib/signalr";
import type { HubConnection } from "@microsoft/signalr";

export default function LobbyDetailsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const lobbyId = params.id as string;
  const [lobby, setLobby] = useState<LobbyDetailsDto | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { player, activeGame, setActiveGame } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    if (!player || !lobbyId) {
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

    fetchLobbyDetails();
    setupSignalR();

    return () => {
      if (connection) {
        connection.invoke("LeaveLobbyGroup", lobbyId).catch(console.error);
        connection.stop();
      }
    };
  }, [player, lobbyId]);

  const setupSignalR = async () => {
    try {
      const hubConnection = createHubConnection("/lobbyhub");

      hubConnection.on("PlayerJoined", (joinedPlayer: PlayerDto) => {
        console.log("Player joined:", joinedPlayer);
        setLobby((prev) => {
          if (!prev) return prev;
          // Check if player already exists to avoid duplicates
          const playerExists = prev.players?.some(
            (p) => p.id === joinedPlayer.id
          );
          if (playerExists) {
            console.log("Player already in lobby, skipping duplicate add");
            return prev;
          }
          return {
            ...prev,
            players: [...(prev.players || []), joinedPlayer],
          };
        });
      });

      hubConnection.on("PlayerLeft", (leftPlayer: PlayerDto) => {
        console.log("Player left:", leftPlayer);
        setLobby((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: (prev.players || []).filter((p) => p.id !== leftPlayer.id),
          };
        });
      });

      hubConnection.on("GameStarted", (data: any) => {
        console.log("Game started:", data);
        setLobby((currentLobby) => {
          const amIHost = currentLobby?.isHost || false;
          console.log("Am I host?", amIHost);
          const gameType = data.gameType.toLowerCase();

          // Store active game in context
          setActiveGame({
            sessionId: data.gameSessionId,
            lobbyId: lobbyId,
            gameType: gameType,
          });

          router.push(
            `/game/${gameType}?session=${data.gameSessionId}&lobby=${lobbyId}&isHost=${amIHost}`
          );
          return currentLobby;
        });
      });

      hubConnection.on("LobbyClosed", (data: { reason: string }) => {
        alert(`Lobby closed: ${data.reason}`);
        router.push("/lobbies");
      });

      await hubConnection.start();
      console.log("Connected to LobbyHub");
      await hubConnection.invoke("JoinLobbyGroup", lobbyId);
      setConnection(hubConnection);
    } catch (err) {
      console.error("Error connecting to SignalR:", err);
      setError("Failed to connect to real-time updates");
    }
  };
  const fetchLobbyDetails = async () => {
    if (!player) return;

    setLoading(true);
    try {
      // Try to join the lobby (will fail if already in or lobby full, but that's ok)
      try {
        await lobbyService.joinLobby(lobbyId, player.id);
      } catch (joinErr) {
        // Ignore join errors - player might already be in lobby
        console.log("Join attempt result:", joinErr);
      }

      // Get full details
      const data = await lobbyService.getLobbyDetails(lobbyId, player.id);
      setLobby(data);
      setIsHost(data.isHost);
      console.log("Lobby details loaded, isHost:", data.isHost);
    } catch (err: any) {
      setError(err.response?.data || "Failed to load lobby details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!player || !lobby || !lobby.isHost) return;

    if ((lobby.players?.length || 0) < 2) {
      alert("Need at least 2 players to start the game");
      return;
    }

    try {
      await lobbyService.startGame(lobbyId, player.id);
      // SignalR will handle navigation via GameStarted event
    } catch (err: any) {
      alert(err.response?.data || "Failed to start game");
    }
  };

  const handleLeaveLobby = async () => {
    if (!player) return;

    try {
      await lobbyService.leaveLobby(lobbyId, player.id);
      router.push("/lobbies");
    } catch (err: any) {
      alert(err.response?.data || "Failed to leave lobby");
    }
  };

  const handleCopyLink = () => {
    const lobbyLink = `${window.location.origin}/lobby/${lobbyId}`;
    navigator.clipboard
      .writeText(lobbyLink)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        alert("Failed to copy link");
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-neon-cyan text-xl mb-2">
            Loading lobby...
          </div>
          <div className="h-2 w-32 bg-dark-elevated rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-blue animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen p-8 bg-dark-bg">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/30 border-2 border-red-500 text-red-300 p-6 rounded-lg mb-4">
            <p className="font-semibold text-lg">
              ⚠️ {error || "Lobby not found"}
            </p>
          </div>
          <button
            onClick={() => router.push("/lobbies")}
            className="bg-neon-blue text-white px-6 py-3 rounded-lg font-bold hover:shadow-neon transition-all"
          >
            Back to Lobbies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-4xl mx-auto">
        <div className="bg-dark-surface border border-dark-border rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1
                className="text-4xl font-bold mb-3 text-neon-cyan"
                style={{ textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
              >
                {lobby.gameType}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">
                  {t("lobby.status")}:{" "}
                  <span className="font-semibold text-white">
                    {lobby.status}
                  </span>
                </p>
                {lobby.isHost && (
                  <div className="flex items-center gap-2 bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full border border-yellow-600">
                    <span className="text-xl">👑</span>
                    <span className="font-semibold">
                      {t("lobby.youAreHost")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="bg-dark-elevated border border-neon-blue text-neon-blue px-5 py-3 rounded-lg font-bold hover:bg-neon-blue hover:text-white transition-all"
              >
                {copySuccess
                  ? `✓ ${t("lobby.copied")}`
                  : `📋 ${t("lobby.copyLink")}`}
              </button>
              <button
                onClick={handleLeaveLobby}
                className="bg-red-900/30 border border-red-500 text-red-400 px-5 py-3 rounded-lg font-bold hover:bg-red-900/50 transition-all"
              >
                {t("lobby.leave")}
              </button>
            </div>
          </div>

          <div className="border-t border-dark-border pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-200">
                {t("game.players")}
              </h2>
              <div className="text-neon-blue font-bold text-xl">
                {lobby.players?.length || 0} / {lobby.maxPlayers}
              </div>
            </div>
            <div className="space-y-3">
              {lobby.players && lobby.players.length > 0 ? (
                lobby.players.map((p, index) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-dark-elevated border border-dark-border p-4 rounded-lg hover:border-neon-blue transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-blue rounded-full flex items-center justify-center font-bold text-dark-bg">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-white text-lg">
                        {p.pseudo}
                        {p.id === player?.id && (
                          <span className="ml-3 text-sm text-neon-purple bg-neon-purple/20 px-3 py-1 rounded-full border border-neon-purple">
                            You
                          </span>
                        )}
                      </span>
                    </div>
                    {index === 0 && (
                      <span className="text-sm bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-600 font-semibold">
                        👑 {t("lobbies.host")}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No players yet</p>
              )}
            </div>
          </div>

          {lobby.isHost && (
            <div className="border-t border-dark-border mt-8 pt-8">
              <button
                onClick={handleStartGame}
                disabled={(lobby.players?.length || 0) < 2}
                className="w-full bg-gradient-to-r from-neon-green to-green-500 text-dark-bg p-5 rounded-lg text-xl font-bold hover:shadow-neon-cyan disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-100"
              >
                {(lobby.players?.length || 0) < 2
                  ? `⏳ ${t("lobby.waiting")}`
                  : `🎮 ${t("lobby.startGame")}`}
              </button>
              {(lobby.players?.length || 0) < 2 && (
                <p className="text-sm text-gray-400 text-center mt-3">
                  {t("lobby.needPlayers")}
                </p>
              )}
            </div>
          )}

          {!lobby.isHost && (
            <div className="border-t border-dark-border mt-8 pt-8 text-center">
              <div className="bg-dark-elevated border border-dark-border rounded-lg p-6">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-300 text-lg">
                  {t("lobby.waitingForHost")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-dark-surface border border-neon-blue/30 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎮</span>
            <h3 className="font-bold text-xl text-neon-cyan">
              {t("lobby.howToPlay")} {lobby.gameType}
            </h3>
          </div>
          <p className="text-gray-300 leading-relaxed">
            {lobby.gameType === "Morpion" && t("game.tictactoe.instructions")}
            {lobby.gameType === "SpeedTyping" &&
              t("game.speedtyping.instructions")}
            {lobby.gameType === "Puissance4" &&
              t("game.puissance4.instructions")}
          </p>
        </div>
      </div>
    </div>
  );
}
