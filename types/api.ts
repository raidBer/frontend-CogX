// Player types
export interface PlayerDto {
  id: string;
  pseudo: string | null;
}

export interface CreatePlayerRequest {
  pseudo: string | null;
}

// Lobby types
export interface LobbyDto {
  id: string;
  gameType: string | null;
  hostPseudo: string | null;
  currentPlayers: number;
  maxPlayers: number;
  isPrivate: boolean;
}

export interface LobbyDetailsDto {
  id: string;
  gameType: string | null;
  players: PlayerDto[] | null;
  maxPlayers: number;
  isHost: boolean;
  status: string | null;
}

export interface CreateLobbyRequest {
  playerId: string;
  gameType: string | null;
  maxPlayers: number;
  password: string | null;
}

export interface CreateLobbyResponse {
  lobbyId: string;
  shareLink: string | null;
}

export interface JoinLobbyRequest {
  playerId: string;
  password: string | null;
}

// Leaderboard types
export interface LeaderboardDto {
  rank: number;
  pseudo: string | null;
  score: number;
  time: string | null;
  timeFormatted: string | null;
  achievedAt: string;
  isCurrentPlayer: boolean;
}

export interface LeaderboardResponse {
  gameType: string | null;
  entries: LeaderboardDto[] | null;
  totalEntries: number;
  currentPlayerEntry: LeaderboardDto | null;
}

export interface AddScoreRequest {
  gameType: string | null;
  playerId: string;
  score: number;
  time: string | null;
}

export interface GameStatsDto {
  gameType: string | null;
  totalPlayers: number;
  totalGames: number;
  highestScore: number;
  bestTime: string | null;
}

// Admin types
export interface GameSessionSummaryDto {
  id: string;
  gameType: string | null;
  startedAt: string;
  finishedAt: string | null;
  totalActions: number;
  playerCount: number;
}

export interface GameActionDto {
  id: string;
  playerPseudo: string | null;
  playerId: string;
  actionType: string | null;
  actionData: string | null;
  parsedActionData: any;
  timestamp: string;
  timeSinceStart: string | null;
}

export interface PlayerSummaryDto {
  playerId: string;
  pseudo: string | null;
  actionCount: number;
  actionBreakdown: { [key: string]: number } | null;
}

export interface GameHistoryResponse {
  gameSessionId: string;
  gameType: string | null;
  gameStartedAt: string;
  gameFinishedAt: string | null;
  duration: string;
  actions: GameActionDto[] | null;
  actionStats: { [key: string]: number } | null;
  playerSummaries: PlayerSummaryDto[] | null;
}
