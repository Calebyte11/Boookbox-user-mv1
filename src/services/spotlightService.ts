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
  getSpotlightVideo: async (): Promise<SpotlightAsset | null> => {
    const response = await apiClient.get<SpotlightAsset | null>(
      API_ENDPOINTS.SPOTLIGHT.GET_VIDEO
    );
    // console.log('Spotlight Video Response:', response.data);
    return  response.data || null;
  },

  getSpotlightImage: async (): Promise<SpotlightAsset | null> => {
    const response = await apiClient.get<SpotlightAsset | null>(
      API_ENDPOINTS.SPOTLIGHT.GET_IMAGE
    );
    // console.log('Spotlight Image Response:', response.data);
    return  response.data || null;
  },
};