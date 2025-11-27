import React from "react";
import Button from "@/components/Button";
import { useEmoji, DEFAULT_REACTIONS, FALLBACK_EMOJIS } from "@/hooks/useEmojiReactions";
import type { ReactionType } from "@/hooks/useEmojiReactions";

export interface ReactionButtonsProps {
  currentReaction: string | null;
  isPostingReaction: boolean;
  onReact: (reaction: ReactionType) => void;
  isAnimating?: boolean;
  reactions?: ReactionType[];
}

const ReactionButtons: React.FC<ReactionButtonsProps> = ({
  currentReaction,
  isPostingReaction,
  onReact,
  isAnimating,
  reactions = DEFAULT_REACTIONS,
}) => {
  // Always call hooks in stable order for DEFAULT_REACTIONS, then filter
  const likeQ = useEmoji("like");
  const loveQ = useEmoji("love");
  const wowQ = useEmoji("wow");
  const sadQ = useEmoji("sad");
  const angryQ = useEmoji("angry");
  const laughQ = useEmoji("laugh");

  const reactionMap: Record<ReactionType, ReturnType<typeof useEmoji>> = {
      like: likeQ,
      love: loveQ,
      wow: wowQ,
      sad: sadQ,
      angry: angryQ,
      laugh: laughQ
  };

  const toRender = reactions.filter((r) => DEFAULT_REACTIONS.includes(r));
  return (
    <div className="flex justify-around gap-2">
      {toRender.map((reaction) => {
        const query = reactionMap[reaction];
        const emoji = query.data?.character || FALLBACK_EMOJIS[reaction].character;
        const hasUserReacted = currentReaction === reaction;
        const count = hasUserReacted ? 1 : 0; // placeholder for aggregated counts
        return (
          <Button
            key={reaction}
            onClick={() => onReact(reaction)}
            disabled={isPostingReaction || query.isLoading}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all transform ${
              hasUserReacted
                ? "bg-orange-200 text-orange-700 border-orange-300 scale-110"
                : "bg-gray-50 hover:bg-orange-100 text-gray-600 border-gray-200"
            } ${isAnimating && hasUserReacted ? "animate-bounce" : ""}`}
            aria-pressed={hasUserReacted}
            aria-label={`React with ${reaction}`}
          >
            <span className="text-lg" aria-hidden={query.isLoading}>
              {query.isLoading ? "…" : emoji}
            </span>
            <span className="text-xs font-medium">{count}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default ReactionButtons;
