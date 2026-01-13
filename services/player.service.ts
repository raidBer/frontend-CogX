import apiClient from "./api-client";
import { PlayerDto, CreatePlayerRequest } from "@/types/api";

export const playerService = {
  // Create a new player
  async createPlayer(request: CreatePlayerRequest): Promise<PlayerDto> {
    const response = await apiClient.post<PlayerDto>("/Player", request);
    return response.data;
  },

  // Get player by ID
  async getPlayer(id: string): Promise<PlayerDto> {
    const response = await apiClient.get<PlayerDto>(`/Player/${id}`);
    return response.data;
  },
};
