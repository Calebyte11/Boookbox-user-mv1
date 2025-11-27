import { useQuery, type UseQueryResult } from "@tanstack/react-query";

// Keep this for type safety if we still want to suggest some default reactions
export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "angry";

// Normalized emoji shape, same as before
export interface EmojiData {
  slug: string;
  character: string;
  unicodeName: string;
  codePoint: string;
  group?: string;
  subGroup?: string;
}

// Fallback static map for the default set, in case API fails
export const FALLBACK_EMOJIS: Record<ReactionType, EmojiData> = {
    like: { slug: "thumbs-up", character: "👍", unicodeName: "thumbs up", codePoint: "1F44D" },
    love: { slug: "red-heart", character: "❤️", unicodeName: "red heart", codePoint: "2764 FE0F" },
    laugh: { slug: "face-with-tears-of-joy", character: "😂", unicodeName: "face with tears of joy", codePoint: "1F602" },
    wow: { slug: "face-with-open-mouth", character: "😮", unicodeName: "face with open mouth", codePoint: "1F62E" },
    sad: { slug: "crying-face", character: "😢", unicodeName: "crying face", codePoint: "1F622" },
    angry: { slug: "angry-face", character: "😠", unicodeName: "angry face", codePoint: "1F620" },
};

export const DEFAULT_REACTIONS: ReactionType[] = ["like", "love", "laugh", "wow", "sad", "angry"];


const API_BASE_URL = import.meta.env.VITE_EMOJI_API_URL || "https://emoji-api.com/emojis";
const API_KEY = import.meta.env.VITE_EMOJI_API_KEY;

// New function to fetch all emojis
async function fetchAllEmojis(): Promise<EmojiData[]> {
  if (!API_KEY) {
    console.warn("Emoji API key is missing. Returning default set.");
    return DEFAULT_REACTIONS.map(r => FALLBACK_EMOJIS[r]);
  }

  try {
    const response = await fetch(`${API_BASE_URL}?access_key=${API_KEY}`);
    if (!response.ok) {
      throw new Error("Failed to fetch emojis");
    }
    const data: EmojiData[] = await response.json();
    return data.filter(emoji => emoji.character); // Filter out emojis without a character
  } catch (error) {
    console.error("Error fetching all emojis:", error);
    return DEFAULT_REACTIONS.map(r => FALLBACK_EMOJIS[r]); // Return default on error
  }
}

// New hook to get all emojis, cached
export function useAllEmojis(): UseQueryResult<EmojiData[], Error> {
  return useQuery<EmojiData[], Error>({
    queryKey: ["allEmojis"],
    queryFn: fetchAllEmojis,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
}

export function useEmoji(reaction: ReactionType): UseQueryResult<EmojiData, Error> {
  return useQuery<EmojiData, Error>({
    queryKey: ["emoji", reaction],
    queryFn: async () => {
      const allEmojis = await fetchAllEmojis();
      const emoji = allEmojis.find((e) => e.slug === reaction);
      if (!emoji) throw new Error("Emoji not found");
      return emoji;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  });
}
