import apiClient from "./api-client";
import {
  LobbyDto,
  LobbyDetailsDto,
  CreateLobbyRequest,
  CreateLobbyResponse,
  JoinLobbyRequest,
} from "@/types/api";

export const lobbyService = {
  // Get all lobbies
  async getLobbies(): Promise<LobbyDto[]> {
    const response = await apiClient.get<LobbyDto[]>("/Lobby");
    return response.data;
  },

  // Get lobby details
  async getLobbyDetails(
    id: string,
    playerId?: string
  ): Promise<LobbyDetailsDto> {
    const params = playerId ? { playerId } : {};
    const response = await apiClient.get<LobbyDetailsDto>(`/Lobby/${id}`, {
      params,
    });
    return response.data;
  },

  // Create a new lobby
  async createLobby(request: CreateLobbyRequest): Promise<CreateLobbyResponse> {
    const response = await apiClient.post<CreateLobbyResponse>(
      "/Lobby",
      request
    );
    return response.data;
  },

  // Join a lobby
  async joinLobby(id: string, request: JoinLobbyRequest): Promise<void> {
    await apiClient.post(`/Lobby/${id}/join`, request);
  },

  // Leave a lobby
  async leaveLobby(id: string, playerId: string): Promise<void> {
    await apiClient.post(`/Lobby/${id}/leave`, JSON.stringify(playerId), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // Start a game
  async startGame(id: string, hostId: string): Promise<void> {
    await apiClient.post(`/Lobby/${id}/start`, JSON.stringify(hostId), {
      headers: { "Content-Type": "application/json" },
    });
  },

  // Delete a lobby
  async deleteLobby(id: string, hostId?: string): Promise<void> {
    const params = hostId ? { hostId } : {};
    await apiClient.delete(`/Lobby/${id}`, { params });
  },
};
