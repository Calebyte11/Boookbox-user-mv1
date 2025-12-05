/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface SpotlightAsset {
  _id: string;
  name: string;
  url: string;
  assetType: string;
  extension: string;
  [key: string]: any;
}

const apiClient = new ApiClient();

export const spotlightService = {
  getSpotlightVideo: async (
    videoId: number
  ): Promise<SpotlightAsset | null> => {
    const response = await apiClient.get<SpotlightAsset | null>(
      API_ENDPOINTS.SPOTLIGHT.GET_VIDEO(videoId)
    );
    // console.log('Spotlight Video Response:', response.data);
    return  response.data || null;
  },

  getSpotlightImage: async (
    imageId: number
  ): Promise<SpotlightAsset | null> => {
    const response = await apiClient.get<SpotlightAsset | null>(
      API_ENDPOINTS.SPOTLIGHT.GET_IMAGE(imageId)
    );
    // console.log('Spotlight Image Response:', response.data);
    return  response.data || null;
  },
};