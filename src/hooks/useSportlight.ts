import { useQuery } from "@tanstack/react-query";
import { spotlightService,type SpotlightAsset } from "@/services/spotlightService";


// Get spotlight videos
export const useSpotlightVideoOne = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightVideo1"],
    queryFn: () => spotlightService.getSpotlightVideo(1),
  });


export const useSpotlightVideoTwo = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightVideo2"],
    queryFn: () => spotlightService.getSpotlightVideo(2),
  });



// =========== Get spotlight images ========
export const useSpotlightImageOne = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightImage1"],
    queryFn: () => spotlightService.getSpotlightImage(1),
  });

export const useSpotlightImageTwo = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightImage2"],
    queryFn: () => spotlightService.getSpotlightImage(2),
  });


export const useSpotlightImageThree = () =>
  useQuery<SpotlightAsset | null>({
    queryKey: ["spotlightImage3"],
    queryFn: () => spotlightService.getSpotlightImage(3),
  });
