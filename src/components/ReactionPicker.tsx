import React, { useState, useRef, useEffect } from "react";
import { Heart } from "../../components/icons";
import type { ReactionType } from "../services/feedService";

// =====================================================
// REACTION PICKER COMPONENT
// =====================================================
// Displays emoji reaction picker (👍 Like, ❤️ Love, 😮 Wow, 😢 Sad, 😡 Angry)
// Shows user's current reaction as highlighted
// Calls onReact callback when emoji clicked
// =====================================================

interface ReactionPickerProps {
  /** Current user's reaction (if any) */
  currentReaction?: ReactionType | null;
  /** Callback when user selects reaction */
  onReact: (reactionType: ReactionType) => void;
  /** Callback when user removes reaction (clicks same emoji twice) */
  onUnreact: () => void;
  /** Show picker (controlled) */
  isOpen: boolean;
  /** Close picker callback */
  onClose: () => void;
}

// Emoji mapping
const REACTIONS = [
  { type: "like" as const, emoji: "👍", label: "Like", color: "text-blue-600" },
  { type: "love" as const, emoji: "❤️", label: "Love", color: "text-red-600" },
  { type: "wow" as const, emoji: "😮", label: "Wow", color: "text-yellow-600" },
  { type: "sad" as const, emoji: "😢", label: "Sad", color: "text-gray-600" },
  {
    type: "angry" as const,
    emoji: "😡",
    label: "Angry",
    color: "text-orange-600",
  },
];

export function ReactionPicker({
  currentReaction,
  onReact,
  onUnreact,
  isOpen,
  onClose,
}: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReactionClick = (reactionType: ReactionType) => {
    if (currentReaction === reactionType) {
      // Same reaction = unreact
      onUnreact();
    } else {
      // Different reaction = change
      onReact(reactionType);
    }
    onClose();
  };

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 px-2 py-2 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50"
    >
      {REACTIONS.map((reaction) => {
        const isSelected = currentReaction === reaction.type;

        return (
          <button
            key={reaction.type}
            onClick={() => handleReactionClick(reaction.type)}
            className={`
              group relative flex items-center justify-center
              w-12 h-12 rounded-full
              transition-all duration-200
              hover:scale-125 hover:bg-gray-100
              ${isSelected ? "bg-blue-50 scale-110" : ""}
            `}
            title={reaction.label}
          >
            {/* Emoji */}
            <span className="text-2xl leading-none select-none">
              {reaction.emoji}
            </span>

            {/* Selected indicator (ring) */}
            {isSelected && (
              <div className="absolute inset-0 rounded-full ring-2 ring-blue-500 ring-offset-2 animate-pulse" />
            )}

            {/* Hover tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {reaction.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// REACTION BUTTON COMPONENT
// =====================================================
// Button that opens ReactionPicker on click
// Shows current reaction count and emoji
// =====================================================

interface ReactionButtonProps {
  /** Total likes count (all reactions) */
  likesCount: number;
  /** User's current reaction */
  userReaction?: ReactionType | null;
  /** Callback when reaction changes */
  onReactionChange: (reactionType: ReactionType | null) => void;
  /** Loading state */
  isLoading?: boolean;
}

export function ReactionButton({
  likesCount,
  userReaction,
  onReactionChange,
  isLoading = false,
}: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (reactionType: ReactionType) => {
    onReactionChange(reactionType);
  };

  const handleUnreact = () => {
    onReactionChange(null);
  };

  // Find current reaction emoji
  const currentReactionData = REACTIONS.find((r) => r.type === userReaction);

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={isLoading}
        className={`
          group/like flex items-center gap-2
          transition-all transform hover:scale-110
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            userReaction
              ? currentReactionData?.color || "text-blue-600"
              : "text-gray-600 hover:text-red-600"
          }
        `}
      >
        {/* Emoji or Heart icon */}
        {userReaction && currentReactionData ? (
          <span className="text-2xl leading-none animate-in zoom-in duration-200">
            {currentReactionData.emoji}
          </span>
        ) : (
          <Heart
            className={`w-6 h-6 transition-all ${
              userReaction
                ? "fill-red-600 scale-110"
                : "group-hover/like:fill-red-600"
            }`}
          />
        )}

        {/* Count */}
        <span className="font-bold">{likesCount}</span>
      </button>

      {/* Reaction Picker Popup */}
      <ReactionPicker
        currentReaction={userReaction}
        onReact={handleReact}
        onUnreact={handleUnreact}
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}

// =====================================================
// REACTION COUNTS DISPLAY COMPONENT
// =====================================================
// Displays emoji counts: "👍 12  ❤️ 5  😮 2" (only non-zero)
// Shows tooltips on hover
// =====================================================

interface ReactionCountsDisplayProps {
  /** Reaction counts object */
  reactions?: {
    like?: number;
    love?: number;
    wow?: number;
    sad?: number;
    angry?: number;
    total?: number;
  } | null;
  /** Optional click handler (e.g., for employer to see who reacted) */
  onClick?: () => void;
}

export function ReactionCountsDisplay({
  reactions,
  onClick,
}: ReactionCountsDisplayProps) {
  if (!reactions || reactions.total === 0) return null;

  return (
    <div
      className={`flex items-center gap-3 text-sm ${
        onClick ? "cursor-pointer hover:underline" : ""
      }`}
      onClick={onClick}
    >
      {/* Like */}
      {reactions.like && reactions.like > 0 && (
        <div className="flex items-center gap-1 text-blue-600 font-semibold">
          <span className="text-base">👍</span>
          <span>{reactions.like}</span>
        </div>
      )}

      {/* Love */}
      {reactions.love && reactions.love > 0 && (
        <div className="flex items-center gap-1 text-red-600 font-semibold">
          <span className="text-base">❤️</span>
          <span>{reactions.love}</span>
        </div>
      )}

      {/* Wow */}
      {reactions.wow && reactions.wow > 0 && (
        <div className="flex items-center gap-1 text-yellow-600 font-semibold">
          <span className="text-base">😮</span>
          <span>{reactions.wow}</span>
        </div>
      )}

      {/* Sad */}
      {reactions.sad && reactions.sad > 0 && (
        <div className="flex items-center gap-1 text-gray-600 font-semibold">
          <span className="text-base">😢</span>
          <span>{reactions.sad}</span>
        </div>
      )}

      {/* Angry */}
      {reactions.angry && reactions.angry > 0 && (
        <div className="flex items-center gap-1 text-orange-600 font-semibold">
          <span className="text-base">😡</span>
          <span>{reactions.angry}</span>
        </div>
      )}
    </div>
  );
}
