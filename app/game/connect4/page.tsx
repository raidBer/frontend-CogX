"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createHubConnection } from "@/lib/signalr";
import { lobbyService } from "@/services";
import type { HubConnection } from "@microsoft/signalr";

interface Connect4GameState {
  gameSessionId: string;
  board: (string | null)[][];
  currentPlayerId: string;
  players: any[];
  status: string;
  winner?: string;
}

export default function Connect4Page() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const lobbyId = searchParams.get("lobby");

  // Get isHost from URL or localStorage (for page refreshes)
  const isHostParam = searchParams.get("isHost");
  const [isHost, setIsHost] = useState<boolean>(() => {
    if (isHostParam !== null) {
      const hostStatus = isHostParam === "true";
      // Store in localStorage for page refreshes
      if (sessionId) {
        localStorage.setItem(`isHost_${sessionId}`, hostStatus.toString());
      }
      return hostStatus;
    }
    // Try to retrieve from localStorage on refresh
    if (sessionId) {
      const stored = localStorage.getItem(`isHost_${sessionId}`);
      return stored === "true";
    }
    return false;
  });

  // Connect 4 board: 6 rows x 7 columns
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(6)
      .fill(null)
      .map(() => Array(7).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerPseudo, setWinnerPseudo] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameInitialized, setGameInitialized] = useState(false);
  const { player, setActiveGame } = usePlayer();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!player || !sessionId || !lobbyId) {
      router.push("/lobbies");
      return;
    }

    setupSignalR();

    return () => {
      if (connection) {
        connection.invoke("LeaveGameRoom", lobbyId).catch(console.error);
        connection.stop();
      }
    };
  }, [player, sessionId, lobbyId]);

  const setupSignalR = async () => {
    try {
      const hubConnection = createHubConnection("/connect4hub");

      // Log all incoming events for debugging
      hubConnection.onreconnecting(() => console.log("Reconnecting..."));
      hubConnection.onreconnected(() => console.log("Reconnected"));
      hubConnection.onclose(() => console.log("Connection closed"));

      // Try multiple possible event names
      hubConnection.on("Connect4Initialized", (gameState: any) => {
        console.log("✅ Connect4Initialized event received:", gameState);
        console.log("Current player turn:", gameState.currentPlayerTurn);
        console.log("My player ID:", player?.id);
        console.log("Player1:", gameState.player1);
        console.log("Player2:", gameState.player2);
        setBoard(
          gameState.board ||
            Array(6)
              .fill(null)
              .map(() => Array(7).fill(null))
        );
        setCurrentPlayer(
          gameState.currentPlayerTurn || gameState.currentPlayerId
        );
        setPlayers([gameState.player1, gameState.player2].filter((p) => p));
        setGameInitialized(true);
      });

      // Also listen for GameInitialized (generic name)
      hubConnection.on("GameInitialized", (gameState: any) => {
        console.log("✅ GameInitialized event received:", gameState);
        setBoard(
          gameState.board ||
            Array(6)
              .fill(null)
              .map(() => Array(7).fill(null))
        );
        setCurrentPlayer(
          gameState.currentPlayerTurn || gameState.currentPlayerId
        );
        setPlayers([gameState.player1, gameState.player2].filter((p) => p));
        setGameInitialized(true);
      });

      hubConnection.on("PieceDropped", (data: any) => {
        console.log("🔵 PieceDropped event received:", data);
        console.log("Full gameState:", data.gameState);
        console.log("Board from gameState:", data.gameState?.board);
        console.log("Column:", data.column, "Row:", data.row);
        console.log("PlayerId:", data.playerId, "Symbol:", data.symbol);
        
        // Backend sends {column, row, symbol, playerId, gameState}
        const gameState = data.gameState || data;

        // Create a deep copy of the board to force React re-render
        if (gameState.board) {
          const newBoard = gameState.board.map((row: any[]) => [...row]);
          console.log("Setting new board:", newBoard);
          setBoard(newBoard);
        }
        
        setCurrentPlayer(
          gameState.currentPlayerTurn || gameState.currentPlayerId
        );
      });

      hubConnection.on("GameOver", (result: any) => {
        console.log("Game over:", result);
        console.log("Winner ID:", result.winnerId);
        console.log("Winner Pseudo:", result.winnerPseudo);
        console.log("Is Draw:", result.isDraw);
        console.log("Winning Line:", result.winningLine);

        setGameOver(true);
        setWinner(result.winnerId || result.winner);
        setWinnerPseudo(result.winnerPseudo);
        setIsDraw(result.isDraw || false);

        if (result.gameState?.board) {
          setBoard(result.gameState.board);
        }

        // Clear active game when game ends
        setActiveGame(null);
        // Clean up localStorage
        if (sessionId) {
          localStorage.removeItem(`isHost_${sessionId}`);
        }
      });

      hubConnection.on("InvalidMove", (data: { reason: string }) => {
        // Ignore invalid move warnings after game over
        if (gameOver) {
          console.log("Ignored invalid move (game already over):", data.reason);
          return;
        }
        alert(`Invalid move: ${data.reason}`);
      });

      hubConnection.on("GameError", (data: { error: string }) => {
        alert(`Error: ${data.error}`);
      });

      hubConnection.on("LobbyClosed", (data: { reason: string }) => {
        console.log("Lobby closed during game:", data);
        setActiveGame(null);
        if (sessionId) {
          localStorage.removeItem(`isHost_${sessionId}`);
        }
        alert(`Game ended: ${data.reason || "The lobby was closed"}`);
        router.push("/lobbies");
      });

      await hubConnection.start();
      console.log("Connected to Connect4Hub");
      await hubConnection.invoke("JoinGameRoom", lobbyId);
      console.log("Joined game room");

      // Request current game state (in case rejoining after refresh)
      try {
        await hubConnection.invoke("GetGameState", sessionId);
        console.log("Requested current game state");
      } catch (err) {
        console.log(
          "Could not get game state (game might not be initialized yet)"
        );
      }

      setConnection(hubConnection);
    } catch (err) {
      console.error("Error connecting to SignalR:", err);
    }
  };

  const handleInitializeGame = async () => {
    if (!connection || !player || !sessionId || !lobbyId) {
      alert("Missing required data to initialize game");
      return;
    }

    try {
      console.log("Host initializing game...");
      console.log("LobbyId:", lobbyId);
      console.log("SessionId:", sessionId);

      const lobbyDetails = await lobbyService.getLobbyDetails(
        lobbyId,
        player.id
      );
      console.log("Lobby details:", lobbyDetails);

      const playerIds = lobbyDetails.players?.map((p) => p.id) || [];
      console.log("Player IDs:", playerIds);

      if (playerIds.length < 2) {
        alert("Need at least 2 players to start the game");
        return;
      }

      console.log("Calling InitializeGame with:", {
        lobbyId,
        sessionId,
        playerIds,
      });

      // Backend signature: InitializeGame(string lobbyId, Guid gameSessionId, List<Guid> playerIds)
      await connection.invoke("InitializeGame", lobbyId, sessionId, playerIds);
      console.log("Game initialization requested successfully");
    } catch (err) {
      console.error("Error initializing game:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      alert("Failed to initialize game. Check console for details.");
    }
  };

  const handleColumnClick = async (col: number) => {
    // Prevent moves after game over
    if (!connection || !player || gameOver) {
      console.log("Move blocked: game over or missing connection");
      return;
    }

    if (currentPlayer !== player.id) {
      alert(t("game.notYourTurn"));
      return;
    }

    try {
      await connection.invoke(
        "DropPiece",
        lobbyId,
        sessionId,
        player.id,
        col
      );
    } catch (error) {
      console.error("Error dropping piece:", error);
    }
  };

  const getPlayerSymbol = (playerId: string | null): string => {
    if (!playerId) return "";

    // Backend sends symbol in player object
    if (players.length >= 2) {
      const player1 = players[0];
      const player2 = players[1];

      // Use the symbol field from backend if available
      if (player1?.id === playerId) return player1.symbol || "🔴";
      if (player2?.id === playerId) return player2.symbol || "🟡";
    }

    return "";
  };

  const renderCell = (row: number, col: number) => {
    const cellValue = board[row][col];

    // Try multiple ways to get the symbol
    let symbol = "";
    let displaySymbol = "⚫"; // default empty cell

    // If cell contains emoji directly
    if (cellValue === "🔴" || cellValue === "🟡") {
      symbol = cellValue;
      displaySymbol = cellValue;
    }
    // If cell contains "Red" or "Yellow" string
    else if (cellValue === "Red" || cellValue === "red") {
      displaySymbol = "🔴";
    }
    else if (cellValue === "Yellow" || cellValue === "yellow") {
      displaySymbol = "🟡";
    }
    // If cell contains number (1 or 2 for player index)
    else if (cellValue === 1 || cellValue === "1") {
      displaySymbol = "🔴";
    }
    else if (cellValue === 2 || cellValue === "2") {
      displaySymbol = "🟡";
    }
    // If cell contains player ID
    else if (cellValue && typeof cellValue === "string") {
      const playerSymbol = getPlayerSymbol(cellValue);
      if (playerSymbol) {
        displaySymbol = playerSymbol;
      }
    }

    return (
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-4xl border-2 border-dark-border bg-dark-surface"
      >
        {displaySymbol}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold mb-3 text-neon-cyan"
            style={{ textShadow: "0 0 30px rgba(0, 240, 255, 0.6)" }}
          >
            Connect 4
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-neon-cyan to-neon-purple mx-auto rounded-full"></div>
        </div>

        {gameOver ? (
          <div className="bg-dark-surface border-2 border-neon-blue p-8 rounded-lg shadow-neon mb-8 text-center">
            <div className="mb-6">
              <div className="text-7xl mb-4">
                {isDraw ? "🤝" : winner === player?.id ? "🏆" : "🎯"}
              </div>
              <h2 className="text-4xl font-bold mb-4">
                {isDraw ? (
                  <span className="text-yellow-400">{t("game.draw")}</span>
                ) : winner === player?.id ? (
                  <span className="text-neon-green">{t("game.youWon")}</span>
                ) : (
                  <span className="text-red-400">{t("game.youLost")}</span>
                )}
              </h2>
              {!isDraw && winnerPseudo && (
                <div className="bg-dark-elevated border border-neon-purple p-4 rounded-lg inline-block">
                  <p className="text-lg text-gray-300">
                    {t("game.winner")}:{" "}
                    <span className="font-bold text-neon-cyan text-2xl">
                      {winnerPseudo}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setActiveGame(null);
                router.push("/lobbies");
              }}
              className="bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-bg px-8 py-4 rounded-lg font-bold text-lg hover:shadow-neon-cyan transition-all transform hover:scale-105"
            >
              {t("game.backToLobbies")}
            </button>
          </div>
        ) : (
          <div className="bg-dark-surface border border-dark-border p-6 rounded-lg shadow-lg mb-8 text-center">
            {!gameInitialized ? (
              <div>
                <div className="text-5xl mb-4">⏳</div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-300">
                  {t("game.waitingToStart")}
                </h2>
                {isHost && (
                  <button
                    onClick={handleInitializeGame}
                    className="bg-gradient-to-r from-neon-green to-green-500 text-dark-bg px-8 py-4 rounded-lg text-xl font-bold hover:shadow-neon-cyan transition-all transform hover:scale-105"
                  >
                    🎮 {t("game.initializeGame")}
                  </button>
                )}
                {!isHost && (
                  <p className="text-gray-400">
                    {t("game.waitingForHostInit")}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold">
                  {currentPlayer === player?.id ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-neon-green text-3xl">▶</span>
                      <span className="text-neon-green">
                        {t("game.yourTurn")}
                      </span>
                      <span className="text-4xl font-bold text-neon-cyan">
                        ({getPlayerSymbol(player?.id)})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-gray-500 text-3xl">⏸</span>
                      <span className="text-gray-400">
                        {t("game.opponentTurn")}
                      </span>
                      <span className="text-3xl font-bold text-gray-500">
                        ({getPlayerSymbol(currentPlayer)})
                      </span>
                    </div>
                  )}
                </h2>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="inline-block bg-dark-elevated p-6 rounded-xl border-2 border-dark-border shadow-lg">
            {/* Column click buttons */}
            <div className="flex gap-2 mb-2">
              {Array(7)
                .fill(null)
                .map((_, colIndex) => (
                  <button
                    key={colIndex}
                    onClick={() => handleColumnClick(colIndex)}
                    disabled={gameOver || currentPlayer !== player?.id}
                    className={`w-16 h-12 rounded-lg font-bold transition-all ${
                      gameOver || currentPlayer !== player?.id
                        ? "bg-dark-surface border-dark-border cursor-not-allowed text-gray-600"
                        : "bg-gradient-to-b from-neon-cyan to-neon-blue text-dark-bg hover:shadow-neon-cyan cursor-pointer transform hover:scale-105"
                    }`}
                  >
                    ↓
                  </button>
                ))}
            </div>

            {/* Board grid */}
            {board &&
              board.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 mb-2">
                  {row.map((_, colIndex) => (
                    <div key={colIndex}>{renderCell(rowIndex, colIndex)}</div>
                  ))}
                </div>
              ))}
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border p-6 rounded-lg shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-neon-cyan">
            {t("game.players")}:
          </h3>
          <div className="space-y-3">
            {players.map((p, index) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-dark-elevated border border-dark-border p-4 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                      getPlayerSymbol(p.id) === "🔴"
                        ? "bg-gradient-to-br from-red-500 to-red-700 text-white"
                        : "bg-gradient-to-br from-yellow-400 to-yellow-600 text-dark-bg"
                    }`}
                  >
                    {getPlayerSymbol(p.id)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {p.pseudo}
                    </p>
                    {p.id === player?.id && (
                      <span className="text-xs text-neon-purple bg-neon-purple/20 px-2 py-1 rounded-full border border-neon-purple">
                        You
                      </span>
                    )}
                  </div>
                </div>
                {currentPlayer === p.id && !gameOver && (
                  <div className="flex items-center gap-2 text-neon-green">
                    <span className="text-2xl animate-pulse">▶</span>
                    <span className="font-semibold">Playing</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
