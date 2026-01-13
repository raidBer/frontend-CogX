import apiClient from "./api-client";
import {
  LeaderboardResponse,
  LeaderboardDto,
  AddScoreRequest,
  GameStatsDto,
} from "@/types/api";

export const leaderboardService = {
  // Get leaderboard for a game type
  async getLeaderboard(
    gameType: string,
    top: number = 10,
    playerId?: string
  ): Promise<LeaderboardResponse> {
    const params: any = { top };
    if (playerId) params.playerId = playerId;

    const response = await apiClient.get<LeaderboardResponse>(
      `/Leaderboard/${gameType}`,
      { params }
    );
    return response.data;
  },

  // Get all game stats
  async getGameStats(): Promise<GameStatsDto[]> {
    const response = await apiClient.get<GameStatsDto[]>("/Leaderboard/games");
    return response.data;
  },

  // Add a score
  async addScore(request: AddScoreRequest): Promise<LeaderboardDto> {
    const response = await apiClient.post<LeaderboardDto>(
      "/Leaderboard",
      request
    );
    return response.data;
  },

  // Get player scores
  async getPlayerScores(
    playerId: string,
    gameType?: string
  ): Promise<LeaderboardDto[]> {
    const params = gameType ? { gameType } : {};
    const response = await apiClient.get<LeaderboardDto[]>(
      `/Leaderboard/player/${playerId}`,
      { params }
    );
    return response.data;
  },

  // Delete player from leaderboard
  async deletePlayerScores(playerId: string): Promise<void> {
    await apiClient.delete(`/Leaderboard/player/${playerId}`);
  },
};
