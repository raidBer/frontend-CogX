"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { lobbyService } from "@/services";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LobbyDto } from "@/types/api";
import { createHubConnection } from "@/lib/signalr";
import type { HubConnection } from "@microsoft/signalr";

export default function LobbiesPage() {
  const { t } = useLanguage();
  const [lobbies, setLobbies] = useState<LobbyDto[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [gameType, setGameType] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
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

    checkExistingLobby();
    fetchLobbies();
    setupSignalR();

    return () => {
      if (connection) {
        connection.invoke("UnsubscribeFromLobbyList").catch(console.error);
        connection.stop();
      }
    };
  }, [player]);

  const checkExistingLobby = async () => {
    if (!player) return;

    try {
      const allLobbies = await lobbyService.getLobbies();

      // Check if player is in ANY lobby (as host or member)
      const playerLobby = allLobbies.find(
        (lobby) =>
          lobby.hostPseudo === player.pseudo || lobby.currentPlayers > 0 // This is a simplified check
      );

      // If player might be in a lobby, we need to check each lobby's details
      // to see if they're actually a member
      for (const lobby of allLobbies) {
        try {
          const details = await lobbyService.getLobbyDetails(
            lobby.id,
            player.id
          );
          // Check if player is in this lobby's player list
          const isInLobby = details.players?.some((p) => p.id === player.id);
          if (isInLobby) {
            console.log("Player found in lobby:", lobby.id, "redirecting...");
            router.push(`/lobby/${lobby.id}`);
            return;
          }
        } catch (err) {
          // Lobby might not exist anymore or player doesn't have access
          continue;
        }
      }
    } catch (err) {
      console.error("Error checking existing lobby:", err);
    }
  };

  const setupSignalR = async () => {
    try {
      const hubConnection = createHubConnection("/lobbyhub");

      hubConnection.on("LobbyCreated", (lobby: LobbyDto) => {
        console.log("Lobby created:", lobby);
        setLobbies((prev) => {
          // Check if lobby already exists to prevent duplicates
          if (prev.some((l) => l.id === lobby.id)) {
            return prev;
          }
          return [...prev, lobby];
        });
      });

      hubConnection.on("LobbyDeleted", (data: any) => {
        const lobbyId = data?.lobbyId || data;
        console.log("Lobby deleted:", lobbyId);
        if (lobbyId) {
          setLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
        }
      });

      hubConnection.on("PlayerJoined", (data: any) => {
        console.log("Player joined:", data);
        fetchLobbies();
      });

      hubConnection.on("GameStarted", (data: any) => {
        console.log("Game started:", data);
        setLobbies((prev) => prev.filter((l) => l.id !== data.lobbyId));
      });

      await hubConnection.start();
      console.log("Connected to LobbyHub");
      await hubConnection.invoke("SubscribeToLobbyList");
      setConnection(hubConnection);
    } catch (err) {
      console.error("Error connecting to SignalR:", err);
      setError("Failed to connect to real-time updates");
    }
  };

  const fetchLobbies = async () => {
    try {
      const data = await lobbyService.getLobbies();
      setLobbies(data);
    } catch (err) {
      console.error("Error fetching lobbies:", err);
    }
  };

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    setLoading(true);
    setError("");

    try {
      const response = await lobbyService.createLobby({
        playerId: player.id,
        gameType,
        maxPlayers,
        password: password || null,
      });

      router.push(`/lobby/${response.lobbyId}`);
    } catch (err: any) {
      setError(err.response?.data || "Failed to create lobby");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async (lobbyId: string, isPrivate: boolean) => {
    if (!player) return;

    const lobbyPassword = isPrivate ? prompt(t("lobbies.enterPassword")) : null;
    if (isPrivate && !lobbyPassword) return;

    setLoading(true);
    try {
      await lobbyService.joinLobby(lobbyId, {
        playerId: player.id,
        password: lobbyPassword,
      });

      router.push(`/lobby/${lobbyId}`);
    } catch (err: any) {
      alert(err.response?.data || "Failed to join lobby");
    } finally {
      setLoading(false);
    }
  };

  if (!player) {
    return (
      <div className="min-h-screen p-8 bg-dark-bg">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">{t("lobbies.pleaseCreatePlayer")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-4xl font-bold text-neon-cyan"
            style={{ textShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
          >
            {t("lobbies.title")}
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-neon-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 hover:shadow-neon transition-all"
          >
            {showCreateForm ? t("common.cancel") : t("lobbies.createNew")}
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-400">
          {t("lobbies.playingAs")}:{" "}
          <strong className="text-neon-cyan">{player.pseudo}</strong>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="bg-dark-surface p-6 rounded-lg border border-dark-border shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">
              {t("lobbies.createNew")}
            </h2>
            <form onSubmit={handleCreateLobby}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-300">
                    {t("lobbies.gameType")}
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => {
                      const selectedGame = e.target.value;
                      setGameType(selectedGame);
                      // Auto-set max players to 2 for Morpion and Puissance4
                      if (
                        selectedGame === "Morpion" ||
                        selectedGame === "Puissance4"
                      ) {
                        setMaxPlayers(2);
                      }
                    }}
                    className="w-full p-3 bg-dark-elevated border border-dark-border rounded text-white"
                    required
                  >
                    <option value="">{t("lobbies.selectGameType")}</option>
                    <option value="Morpion">Tic-Tac-Toe (Morpion)</option>
                    <option value="SpeedTyping">Speed Typing</option>
                    <option value="Puissance4">Connect 4 (Puissance4)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-300">
                    {t("lobbies.maxPlayers")}
                  </label>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full p-3 bg-dark-elevated border border-dark-border rounded text-white"
                    min="2"
                    max="10"
                    required
                    disabled={
                      gameType === "Morpion" || gameType === "Puissance4"
                    }
                  />
                  {(gameType === "Morpion" || gameType === "Puissance4") && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t("lobbies.fixedPlayers")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-300">
                  {t("lobbies.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-dark-elevated border border-dark-border rounded text-white placeholder-gray-500"
                  placeholder={t("lobbies.passwordPlaceholder")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neon-green text-dark-bg p-3 rounded-lg font-bold hover:bg-green-500 hover:shadow-neon-cyan disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
              >
                {loading ? `${t("lobbies.create")}...` : t("lobbies.create")}
              </button>
            </form>
          </div>
        )}

        <div className="bg-dark-surface rounded-lg border border-dark-border shadow-lg overflow-hidden">
          <div className="p-6 border-b border-dark-border">
            <h2 className="text-2xl font-semibold text-gray-200">
              {t("lobbies.available")}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {lobbies.length}{" "}
              {t(
                lobbies.length === 1
                  ? "lobbies.lobbySingular"
                  : "lobbies.lobbyPlural"
              )}{" "}
              {t("lobbies.availableCount")}
            </p>
          </div>

          {lobbies.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="mb-4 text-lg">{t("lobbies.noLobbies")}</p>
              <p className="text-sm text-gray-500">
                {t("lobbies.createToStart")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="p-6 hover:bg-dark-elevated transition-colors flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-neon-cyan">
                        {lobby.gameType}
                      </h3>
                      {lobby.isPrivate && (
                        <span className="text-xs bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full border border-yellow-600">
                          🔒 {t("lobbies.private")}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">
                      {t("lobbies.host")}:{" "}
                      <strong className="text-white">{lobby.hostPseudo}</strong>
                    </p>
                    <p className="text-gray-400">
                      {t("lobbies.players")}:{" "}
                      <span className="text-neon-blue font-semibold">
                        {lobby.currentPlayers} / {lobby.maxPlayers}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleJoinLobby(lobby.id, lobby.isPrivate)}
                    disabled={
                      loading || lobby.currentPlayers >= lobby.maxPlayers
                    }
                    className="bg-neon-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 hover:shadow-neon disabled:bg-gray-700 disabled:cursor-not-allowed transition-all"
                  >
                    {lobby.currentPlayers >= lobby.maxPlayers
                      ? t("lobbies.full")
                      : t("lobbies.joinLobby")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
