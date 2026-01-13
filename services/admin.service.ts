import apiClient from "./api-client";
import {
  GameHistoryResponse,
  GameSessionSummaryDto,
  GameActionDto,
} from "@/types/api";

export const adminService = {
  // Get game history
  async getGameHistory(gameSessionId: string): Promise<GameHistoryResponse> {
    const response = await apiClient.get<GameHistoryResponse>(
      `/Admin/game-history/${gameSessionId}`
    );
    return response.data;
  },

  // Delete game session
  async deleteGameSession(gameSessionId: string): Promise<void> {
    await apiClient.delete(`/Admin/game-history/${gameSessionId}`);
  },

  // Get game sessions
  async getGameSessions(
    gameType?: string,
    limit: number = 50
  ): Promise<GameSessionSummaryDto[]> {
    const params: any = { limit };
    if (gameType) params.gameType = gameType;

    const response = await apiClient.get<GameSessionSummaryDto[]>(
      "/Admin/game-sessions",
      { params }
    );
    return response.data;
  },

  // Get player actions
  async getPlayerActions(
    playerId: string,
    gameSessionId?: string
  ): Promise<GameActionDto[]> {
    const params = gameSessionId ? { gameSessionId } : {};
    const response = await apiClient.get<GameActionDto[]>(
      `/Admin/player-actions/${playerId}`,
      { params }
    );
    return response.data;
  },

  // Export game session
  async exportGameSession(gameSessionId: string): Promise<Blob> {
    const response = await apiClient.get(`/Admin/export/${gameSessionId}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // Get platform stats
  async getPlatformStats(): Promise<any> {
    const response = await apiClient.get("/Admin/platform-stats");
    return response.data;
  },
};
