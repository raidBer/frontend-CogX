"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { PlayerDto } from "@/types/api";

interface PlayerContextType {
  player: PlayerDto | null;
  setPlayer: (player: PlayerDto | null) => void;
  isLoading: boolean;
  activeGame: { sessionId: string; lobbyId: string; gameType: string } | null;
  setActiveGame: (
    game: { sessionId: string; lobbyId: string; gameType: string } | null
  ) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<PlayerDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGame, setActiveGameState] = useState<{
    sessionId: string;
    lobbyId: string;
    gameType: string;
  } | null>(null);

  useEffect(() => {
    // Load player from localStorage on mount
    const savedPlayerId = localStorage.getItem("playerId");
    const savedPlayerPseudo = localStorage.getItem("playerPseudo");
    const savedActiveGame = localStorage.getItem("activeGame");

    if (savedPlayerId && savedPlayerPseudo) {
      setPlayerState({
        id: savedPlayerId,
        pseudo: savedPlayerPseudo,
      });
    }

    if (savedActiveGame) {
      try {
        setActiveGameState(JSON.parse(savedActiveGame));
      } catch (err) {
        console.error("Error parsing active game:", err);
      }
    }

    setIsLoading(false);
  }, []);

  const setPlayer = (player: PlayerDto | null) => {
    setPlayerState(player);
    if (player) {
      localStorage.setItem("playerId", player.id);
      localStorage.setItem("playerPseudo", player.pseudo || "");
    } else {
      localStorage.removeItem("playerId");
      localStorage.removeItem("playerPseudo");
      localStorage.removeItem("activeGame");
      setActiveGameState(null);
    }
  };

  const setActiveGame = (
    game: { sessionId: string; lobbyId: string; gameType: string } | null
  ) => {
    setActiveGameState(game);
    if (game) {
      localStorage.setItem("activeGame", JSON.stringify(game));
    } else {
      localStorage.removeItem("activeGame");
    }
  };

  return (
    <PlayerContext.Provider
      value={{ player, setPlayer, isLoading, activeGame, setActiveGame }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
