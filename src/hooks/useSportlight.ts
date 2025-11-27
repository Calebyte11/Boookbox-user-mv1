import { useQuery } from "@tanstack/react-query";
import { spotlightService,type SpotlightAsset } from "@/services/spotlightService";

// Get spotlight video
export const useSpotlightVideo = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightVideo"],
    queryFn: spotlightService.getSpotlightVideo,
  });

// Get spotlight image
export const useSpotlightImage = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightImage"],
    queryFn: spotlightService.getSpotlightImage,
  });
