"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { createHubConnection } from "@/lib/signalr";
import { lobbyService, leaderboardService } from "@/services";
import type { HubConnection } from "@microsoft/signalr";

interface SpeedTypingGameState {
  gameSessionId: string;
  text: string;
  players: any[];
  status: string;
}

interface PlayerProgress {
  playerId: string;
  pseudo: string;
  progress: number;
  wpm: number;
  finished: boolean;
  finishTime?: number;
}

export default function SpeedTypingPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const lobbyId = searchParams.get("lobby");

  const isHostParam = searchParams.get("isHost");
  const [isHost, setIsHost] = useState<boolean>(() => {
    if (isHostParam !== null) {
      const hostStatus = isHostParam === "true";
      if (sessionId) {
        localStorage.setItem(`isHost_${sessionId}`, hostStatus.toString());
      }
      return hostStatus;
    }
    if (sessionId) {
      const stored = localStorage.getItem(`isHost_${sessionId}`);
      return stored === "true";
    }
    return false;
  });

  const [textToType, setTextToType] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [playerProgress, setPlayerProgress] = useState<
    Map<string, PlayerProgress>
  >(new Map());
  const [gameInitialized, setGameInitialized] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTime, setFinishTime] = useState<number | null>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [hasFinished, setHasFinished] = useState(false);
  const [updateProgressWarningShown, setUpdateProgressWarningShown] =
    useState(false);
  const [raceStarted, setRaceStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { player, setActiveGame } = usePlayer();
  const { t } = useLanguage();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      const hubConnection = createHubConnection("/speedtypinghub");

      hubConnection.onreconnecting(() => console.log("Reconnecting..."));
      hubConnection.onreconnected(() => console.log("Reconnected"));
      hubConnection.onclose(() => console.log("Connection closed"));

      hubConnection.on("SpeedTypingInitialized", (gameState: any) => {
        console.log("✅ SpeedTypingInitialized event received:", gameState);
        setTextToType(gameState.text || gameState.textToType || "");
        setPlayers([gameState.player1, gameState.player2].filter((p) => p));
        setGameInitialized(true);
        setRaceStarted(false);

        // Initialize progress for all players
        const progressMap = new Map<string, PlayerProgress>();
        [gameState.player1, gameState.player2]
          .filter((p) => p)
          .forEach((p) => {
            progressMap.set(p.id, {
              playerId: p.id,
              pseudo: p.pseudo,
              progress: 0,
              wpm: 0,
              finished: false,
            });
          });
        setPlayerProgress(progressMap);
      });

      hubConnection.on("RaceStarted", (data: any) => {
        console.log("🏁 RaceStarted event received:", data);
        setRaceStarted(true);
        setCountdown(null);
      });

      hubConnection.on("CountdownTick", (data: any) => {
        console.log("⏱️ CountdownTick:", data.remainingSeconds);
        setCountdown(data.remainingSeconds);
      });

      hubConnection.on("GameInitialized", (gameState: any) => {
        console.log("✅ GameInitialized event received:", gameState);
        setTextToType(gameState.text || gameState.textToType || "");
        setPlayers([gameState.player1, gameState.player2].filter((p) => p));
        setGameInitialized(true);

        const progressMap = new Map<string, PlayerProgress>();
        [gameState.player1, gameState.player2]
          .filter((p) => p)
          .forEach((p) => {
            progressMap.set(p.id, {
              playerId: p.id,
              pseudo: p.pseudo,
              progress: 0,
              wpm: 0,
              finished: false,
            });
          });
        setPlayerProgress(progressMap);
      });

      hubConnection.on("ProgressUpdated", (data: any) => {
        console.log("📊 ProgressUpdated:", data);
        setPlayerProgress((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(data.playerId) || {
            playerId: data.playerId,
            pseudo: data.pseudo || "Unknown",
            progress: 0,
            wpm: 0,
            finished: false,
          };

          newMap.set(data.playerId, {
            ...existing,
            progress: data.progressPercentage || data.progress || data.percentageComplete || 0,
            wpm: data.wpm || 0,
            accuracy: data.accuracy || 100,
          });

          return newMap;
        });
      });

      hubConnection.on("PlayerFinished", (data: any) => {
        console.log("🏁 PlayerFinished:", data);
        setPlayerProgress((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(data.playerId);
          if (existing) {
            newMap.set(data.playerId, {
              ...existing,
              finished: true,
              finishTime: data.timeSeconds || data.finishTime || data.time,
              progress: 100,
              rank: data.rank,
              wpm: data.wpm || existing.wpm,
              accuracy: data.accuracy || existing.accuracy,
            });
          }
          return newMap;
        });
      });

      hubConnection.on("GameOver", (result: any) => {
        console.log("🏆 Game over - Full result:", result);
        console.log("🏆 Rankings data:", result.rankings);
        console.log("🏆 finalRankings data:", result.finalRankings);
        console.log("🏆 finalResults data:", result.finalResults);
        console.log("🏆 results data:", result.results);
        const rankingsData =
          result.finalResults ||
          result.rankings ||
          result.finalRankings ||
          result.results ||
          [];
        console.log("🏆 Setting rankings:", rankingsData);
        setGameOver(true);
        setRankings(rankingsData);

        // Save score to leaderboard
        if (result.rankings && player) {
          const myRanking = result.rankings.find(
            (r: any) => r.playerId === player.id
          );
          if (myRanking && myRanking.wpm > 0) {
            saveScoreToLeaderboard(
              myRanking.wpm,
              myRanking.timeSeconds || myRanking.time || 0
            );
          }
        }

        setActiveGame(null);
        if (sessionId) {
          localStorage.removeItem(`isHost_${sessionId}`);
        }
      });

      // Also listen for RaceEnded event (alternative name)
      hubConnection.on("RaceEnded", (result: any) => {
        console.log("🏁 Race ended - Full result:", result);
        console.log("🏁 Rankings data:", result.rankings);
        console.log("🏁 finalRankings data:", result.finalRankings);
        console.log("🏁 finalResults data:", result.finalResults);
        console.log("🏁 results data:", result.results);
        const rankingsData =
          result.finalResults ||
          result.rankings ||
          result.finalRankings ||
          result.results ||
          [];
        console.log("🏁 Setting rankings:", rankingsData);
        setGameOver(true);
        setRankings(rankingsData);

        if (result.rankings && player) {
          const myRanking = result.rankings.find(
            (r: any) => r.playerId === player.id
          );
          if (myRanking && myRanking.wpm > 0) {
            saveScoreToLeaderboard(
              myRanking.wpm,
              myRanking.timeSeconds || myRanking.time || 0
            );
          }
        }

        setActiveGame(null);
        if (sessionId) {
          localStorage.removeItem(`isHost_${sessionId}`);
        }
      });

      hubConnection.on("InvalidMove", (data: { reason: string }) => {
        if (gameOver) return;
        console.log("Invalid action:", data.reason);
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
      console.log("Connected to SpeedTypingHub");
      await hubConnection.invoke("JoinGameRoom", lobbyId);
      console.log("Joined game room");

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
      const lobbyDetails = await lobbyService.getLobbyDetails(
        lobbyId,
        player.id
      );
      const playerIds = lobbyDetails.players?.map((p) => p.id) || [];

      if (playerIds.length < 2) {
        alert("Need at least 2 players to start the game");
        return;
      }

      await connection.invoke("InitializeGame", lobbyId, sessionId, playerIds);
      console.log("Game initialization requested successfully");
    } catch (err) {
      console.error("Error initializing game:", err);
      alert("Failed to initialize game. Check console for details.");
    }
  };

  const handleStartRace = async () => {
    if (!connection || !lobbyId || !sessionId) {
      alert("Missing required data to start race");
      return;
    }

    try {
      console.log("Host starting race...");
      await connection.invoke("StartRace", lobbyId, sessionId);
      console.log("Race start requested successfully");
    } catch (err) {
      console.error("Error starting race:", err);
      alert("Failed to start race. Check console for details.");
    }
  };

  const calculateErrors = (typed: string, target: string): number => {
    let errors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== target[i]) {
        errors++;
      }
    }
    return errors;
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (
      !connection ||
      !player ||
      gameOver ||
      hasFinished ||
      !gameInitialized ||
      !raceStarted
    )
      return;

    const newInput = e.target.value;

    // Only allow correct characters - reject if wrong character typed
    if (newInput.length > userInput.length) {
      // User is adding a character
      const newChar = newInput[newInput.length - 1];
      const expectedChar = textToType[newInput.length - 1];
      
      if (newChar !== expectedChar) {
        // Wrong character - don't register it
        return;
      }
    }

    setUserInput(newInput);

    // Start timer on first character
    if (!startTime && newInput.length === 1) {
      setStartTime(Date.now());
    }

    // Calculate charactersTyped and errorCount (exactly as backend expects)
    const charactersTyped = newInput.length;
    const errorCount = 0; // Always 0 now since we only accept correct characters

    // Send progress update to backend with exact parameters it expects
    if (!lobbyId || !sessionId) {
      console.error("❌ Missing lobbyId or sessionId:", { lobbyId, sessionId });
      return;
    }

    try {
      console.log("📤 Sending UpdateProgress:", {
        lobbyId,
        sessionId,
        playerId: player.id,
        charactersTyped,
        errorCount,
      });
      await connection.invoke(
        "UpdateProgress",
        lobbyId,
        sessionId,
        player.id,
        charactersTyped,
        errorCount
      );
      console.log("✅ UpdateProgress sent successfully");
    } catch (error: any) {
      console.error("❌ UpdateProgress failed - Full error:", error);
      console.error(
        "Error type:",
        typeof error,
        "Error keys:",
        Object.keys(error || {})
      );
      if (!updateProgressWarningShown) {
        alert(`Error updating progress: ${JSON.stringify(error)}`);
        setUpdateProgressWarningShown(true);
      }
    }

    // Check if finished (typed entire text correctly)
    if (newInput.length >= textToType.length && !hasFinished) {
      // Only finish if we've typed at least as many characters as the target
      setHasFinished(true);
      const totalTime = startTime ? (Date.now() - startTime) / 1000 : 0;
      setFinishTime(totalTime);

      console.log("🏁 Finished typing! Notifying backend...");
      // Backend will automatically detect completion via UpdateProgress
      // No need to call a separate FinishTyping method
    }
  };

  const saveScoreToLeaderboard = async (wpm: number, time: number) => {
    if (!player) return;

    try {
      await leaderboardService.addScore({
        gameType: "SpeedTyping",
        playerId: player.id,
        score: wpm,
        time: time.toString(),
      });
      console.log("Score saved to leaderboard");
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  const getCharacterClass = (index: number): string => {
    if (index >= userInput.length) return "text-gray-500";
    if (userInput[index] === textToType[index]) return "text-neon-green";
    return "text-red-500";
  };

  const getProgressPercentage = (): number => {
    return Math.min((userInput.length / textToType.length) * 100, 100);
  };

  const calculateWPM = (): number => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60;
    const wordsTyped = userInput.trim().split(/\s+/).length;
    return timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
  };

  return (
    <div className="min-h-screen p-8 bg-dark-bg">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold mb-3 text-neon-cyan"
            style={{ textShadow: "0 0 30px rgba(0, 240, 255, 0.6)" }}
          >
            ⚡ Speed Typing Race
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full mx-auto"></div>
        </div>

        {gameOver ? (
          <div className="bg-dark-surface border-2 border-neon-blue p-8 rounded-lg shadow-neon mb-8 text-center">
            <div className="mb-6">
              <div className="text-7xl mb-4">🏆</div>
              <h2 className="text-4xl font-bold mb-6 text-neon-green">
                Race Complete!
              </h2>

              {/* Rankings */}
              <div className="bg-dark-elevated p-6 rounded-lg border border-neon-purple mb-6">
                <h3 className="text-2xl font-bold text-neon-cyan mb-4">
                  Final Rankings
                </h3>
                <div className="space-y-3">
                  {rankings.map((ranking, index) => (
                    <div
                      key={ranking.playerId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        ranking.playerId === player?.id
                          ? "bg-neon-cyan/20 border-2 border-neon-cyan"
                          : "bg-dark-surface border border-dark-border"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-3xl font-bold ${
                            index === 0
                              ? "text-yellow-400"
                              : index === 1
                              ? "text-gray-400"
                              : index === 2
                              ? "text-orange-600"
                              : "text-gray-500"
                          }`}
                        >
                          #{index + 1}
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xl text-white">
                            {ranking.pseudo}
                          </p>
                          <p className="text-sm text-gray-400">
                            {ranking.time?.toFixed(2)}s
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-neon-green">
                          {ranking.wpm} WPM
                        </p>
                        <p className="text-sm text-gray-400">Words/Min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveGame(null);
                router.push("/lobbies");
              }}
              className="bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-bg px-8 py-4 rounded-lg font-bold text-lg hover:shadow-neon-cyan transition-all transform hover:scale-105"
            >
              Back to Lobbies
            </button>
          </div>
        ) : (
          <>
            <div className="bg-dark-surface border border-dark-border p-6 rounded-lg shadow-lg mb-8 text-center">
              {!gameInitialized ? (
                <div>
                  <div className="text-5xl mb-4">⏳</div>
                  <h2 className="text-2xl font-semibold mb-6 text-gray-300">
                    Waiting to Start
                  </h2>
                  {isHost && (
                    <button
                      onClick={handleInitializeGame}
                      className="bg-gradient-to-r from-neon-green to-green-500 text-dark-bg px-8 py-4 rounded-lg text-xl font-bold hover:shadow-neon-cyan transition-all transform hover:scale-105"
                    >
                      🎮 Initialize Game
                    </button>
                  )}
                  {!isHost && (
                    <p className="text-gray-400">
                      Waiting for host to initialize the game...
                    </p>
                  )}
                </div>
              ) : !raceStarted ? (
                <div>
                  {countdown !== null ? (
                    <div>
                      <div className="text-8xl font-bold mb-4 text-neon-cyan animate-pulse">
                        {countdown}
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-300">
                        Get Ready!
                      </h2>
                    </div>
                  ) : (
                    <div>
                      <div className="text-5xl mb-4">🏁</div>
                      <h2 className="text-2xl font-semibold mb-6 text-gray-300">
                        Ready to Race
                      </h2>
                      {isHost && (
                        <button
                          onClick={handleStartRace}
                          className="bg-gradient-to-r from-neon-green to-green-500 text-dark-bg px-8 py-4 rounded-lg text-xl font-bold hover:shadow-neon-cyan transition-all transform hover:scale-105"
                        >
                          🚦 START RACE
                        </button>
                      )}
                      {!isHost && (
                        <p className="text-gray-400">
                          Waiting for host to start the race...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : hasFinished ? (
                <div>
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-2xl font-bold text-neon-green mb-2">
                    You Finished!
                  </h2>
                  <p className="text-gray-400">Waiting for other players...</p>
                  <div className="mt-4">
                    <p className="text-3xl font-bold text-neon-cyan">
                      {calculateWPM()} WPM
                    </p>
                    <p className="text-sm text-gray-400">
                      Time: {finishTime?.toFixed(2)}s
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-3xl">⚡</span>
                    <div>
                      <p className="text-4xl font-bold text-neon-cyan">
                        {calculateWPM()} WPM
                      </p>
                      <p className="text-sm text-gray-400">Words Per Minute</p>
                    </div>
                  </div>
                  <div className="w-full bg-dark-elevated rounded-full h-4 mb-2">
                    <div
                      className="bg-gradient-to-r from-neon-cyan to-neon-green h-4 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400">
                    {Math.round(getProgressPercentage())}% Complete
                  </p>
                </div>
              )}
            </div>

            {gameInitialized && !hasFinished && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Text Display */}
                <div className="lg:col-span-2">
                  <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                      Text to Type:
                    </h3>
                    <div className="bg-dark-elevated p-6 rounded-lg mb-4 font-mono text-lg leading-relaxed">
                      {textToType.split("").map((char, index) => (
                        <span key={index} className={getCharacterClass(index)}>
                          {char}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-xl font-bold mb-4 text-neon-purple">
                      Your Input:
                    </h3>
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={handleInputChange}
                      disabled={!raceStarted || gameOver || hasFinished}
                      className="w-full h-40 bg-dark-elevated border-2 border-neon-blue rounded-lg p-4 text-white font-mono text-lg focus:outline-none focus:border-neon-cyan resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder={
                        raceStarted
                          ? "Start typing here..."
                          : "Waiting for race to start..."
                      }
                      autoFocus
                    />
                  </div>
                </div>

                {/* Players Progress */}
                <div className="lg:col-span-1">
                  <div className="bg-dark-surface p-6 rounded-xl border border-dark-border">
                    <h3 className="text-xl font-bold mb-4 text-neon-cyan">
                      Players:
                    </h3>
                    <div className="space-y-4">
                      {Array.from(playerProgress.values()).map((progress) => (
                        <div
                          key={progress.playerId}
                          className={`p-4 rounded-lg border ${
                            progress.playerId === player?.id
                              ? "bg-neon-cyan/10 border-neon-cyan"
                              : "bg-dark-elevated border-dark-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-white">
                              {progress.pseudo}
                            </p>
                            {progress.finished && (
                              <span className="text-green-400 text-xl">✓</span>
                            )}
                          </div>
                          <div className="w-full bg-dark-bg rounded-full h-3 mb-1">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                progress.finished
                                  ? "bg-green-500"
                                  : "bg-gradient-to-r from-neon-blue to-neon-purple"
                              }`}
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              {Math.round(progress.progress)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
