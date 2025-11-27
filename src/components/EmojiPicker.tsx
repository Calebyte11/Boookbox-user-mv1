import React from "react";
import { useAllEmojis, type EmojiData } from "@/hooks/useEmojiReactions";
import Button from "@/components/Button";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: EmojiData) => void;
  selectedEmoji: EmojiData | null;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, selectedEmoji }) => {
  const { data: emojis, isLoading, error } = useAllEmojis();

  if (isLoading) {
    return (
      <div className="grid lg:grid-cols-8 grid-cols-4 gap-2 p-4">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading emojis: {error.message}</div>;
  }

  return (
    <div className="grid grid-cols-8 gap-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
      {emojis?.map((emoji) => (
        <Button
          key={emoji.slug}
          onClick={() => onSelectEmoji(emoji)}
          className={`text-2xl p-2 rounded-lg transition-transform transform hover:scale-125 ${
            selectedEmoji?.slug === emoji.slug ? "bg-primary/20 ring-2 ring-primary" : "bg-transparent"
          }`}
          aria-label={emoji.unicodeName}
          aria-pressed={selectedEmoji?.slug === emoji.slug}
        >
          {emoji.character}
        </Button>
      ))}
    </div>
  );
};

export default EmojiPicker;
