import React, { useState, useRef, useEffect, useCallback } from "react";
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

// Emoji mapping with Dutch labels
const REACTIONS = [
  {
    type: "like" as const,
    emoji: "👍",
    label: "Leuk",
    labelEn: "Like",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    type: "love" as const,
    emoji: "❤️",
    label: "Geweldig",
    labelEn: "Love",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    type: "wow" as const,
    emoji: "😮",
    label: "Wow",
    labelEn: "Wow",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    type: "sad" as const,
    emoji: "😢",
    label: "Verdrietig",
    labelEn: "Sad",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  {
    type: "angry" as const,
    emoji: "😡",
    label: "Boos",
    labelEn: "Angry",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
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
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 150);
  }, [onClose]);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen && !isAnimatingOut) return null;

  const handleReactionClick = (reactionType: ReactionType) => {
    if (currentReaction === reactionType) {
      // Same reaction = unreact
      onUnreact();
    } else {
      // Different reaction = change
      onReact(reactionType);
    }
    handleClose();
  };

  return (
    <div
      ref={pickerRef}
      className={`
        absolute bottom-full left-1/2 -translate-x-1/2 mb-3
        bg-white/95 backdrop-blur-xl rounded-2xl
        shadow-2xl shadow-slate-900/20 
        border border-white/60
        px-2 py-2 flex items-center gap-1
        transition-all duration-200 ease-out
        ${
          isAnimatingOut
            ? "opacity-0 scale-95 translate-y-2"
            : "opacity-100 scale-100 translate-y-0 animate-in fade-in zoom-in-95 slide-in-from-bottom-3"
        }
      `}
      style={{ zIndex: 9999 }}
    >
      {/* Decorative gradient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-lg opacity-60" />

      <div className="relative flex items-center gap-0.5">
        {REACTIONS.map((reaction, index) => {
          const isSelected = currentReaction === reaction.type;

          return (
            <button
              key={reaction.type}
              onClick={() => handleReactionClick(reaction.type)}
              className={`
                group relative flex items-center justify-center
                w-11 h-11 sm:w-12 sm:h-12 rounded-full
                transition-all duration-200 ease-out
                hover:scale-125 hover:-translate-y-1
                active:scale-110
                ${
                  isSelected
                    ? `${reaction.bgColor} scale-110 ring-2 ring-offset-1 ring-blue-400/50`
                    : "hover:bg-gray-100/80"
                }
              `}
              style={{
                animationDelay: `${index * 50}ms`,
                animation:
                  isOpen && !isAnimatingOut
                    ? "bounce-in 0.4s ease-out forwards"
                    : undefined,
              }}
              title={reaction.label}
              aria-label={reaction.label}
            >
              {/* Emoji with bounce animation */}
              <span
                className={`
                  text-2xl sm:text-[28px] leading-none select-none
                  transition-transform duration-200
                  ${isSelected ? "scale-110" : "group-hover:scale-110"}
                `}
              >
                {reaction.emoji}
              </span>

              {/* Hover tooltip - hidden on mobile */}
              <div className="hidden sm:block absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none shadow-lg">
                {reaction.label}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
              </div>
            </button>
          );
        })}
      </div>
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
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleReact = (reactionType: ReactionType) => {
    setIsAnimating(true);
    onReactionChange(reactionType);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleUnreact = () => {
    setIsAnimating(true);
    onReactionChange(null);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Quick tap = toggle like, long press = show picker
  const handleClick = () => {
    if (showPicker) {
      setShowPicker(false);
      return;
    }
    // Simple click toggles like reaction
    if (userReaction) {
      handleUnreact();
    } else {
      handleReact("like");
    }
  };

  // Long press to show picker (mobile-friendly)
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Find current reaction emoji
  const currentReactionData = REACTIONS.find((r) => r.type === userReaction);

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPicker(true);
        }}
        disabled={isLoading}
        className={`
          group/like flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-full
          transition-all duration-200 ease-out
          hover:bg-slate-100/80 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            userReaction
              ? currentReactionData?.color || "text-blue-600"
              : "text-slate-600 hover:text-red-500"
          }
          ${isAnimating ? "scale-110" : ""}
        `}
        title="Klik = Leuk, Lang drukken = Meer reacties"
      >
        {/* Emoji or Heart icon */}
        {userReaction && currentReactionData ? (
          <span
            className={`
            text-xl sm:text-2xl leading-none select-none
            transition-transform duration-300
            ${isAnimating ? "animate-bounce" : ""}
          `}
          >
            {currentReactionData.emoji}
          </span>
        ) : (
          <Heart
            className={`
              w-5 h-5 sm:w-6 sm:h-6 transition-all duration-200
              ${
                isAnimating
                  ? "fill-red-500 scale-125"
                  : "group-hover/like:fill-red-400/50"
              }
            `}
          />
        )}

        {/* Count with animation */}
        <span
          className={`
          text-xs sm:text-sm font-semibold tabular-nums
          transition-all duration-200
          ${userReaction ? currentReactionData?.color : "text-slate-600"}
        `}
        >
          {likesCount}
        </span>
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
// Shows tooltips on hover with smooth animations
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
  /** Compact mode for smaller display */
  compact?: boolean;
}

export function ReactionCountsDisplay({
  reactions,
  onClick,
  compact = false,
}: ReactionCountsDisplayProps) {
  if (!reactions || reactions.total === 0) return null;

  // Get non-zero reactions for stacked emoji display
  const activeReactions = REACTIONS.filter(
    (r) =>
      reactions[r.type as keyof typeof reactions] &&
      (reactions[r.type as keyof typeof reactions] as number) > 0
  );

  if (activeReactions.length === 0) return null;

  return (
    <div
      className={`
        flex items-center gap-2 text-sm
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
      `}
      onClick={onClick}
    >
      {/* Stacked Emoji Icons */}
      <div className="flex items-center -space-x-1">
        {activeReactions.slice(0, 3).map((reaction, index) => (
          <div
            key={reaction.type}
            className={`
              w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center
              ${reaction.bgColor} border-2 border-white shadow-sm
              transition-transform hover:scale-110 hover:z-10
            `}
            style={{ zIndex: 3 - index }}
            title={reaction.label}
          >
            <span className="text-xs sm:text-sm">{reaction.emoji}</span>
          </div>
        ))}
      </div>

      {/* Total Count */}
      <span className="text-xs sm:text-sm text-slate-600 font-medium">
        {reactions.total}
      </span>

      {/* Detailed counts on hover - desktop only */}
      {!compact && (
        <div className="hidden sm:flex items-center gap-2 ml-1 text-xs text-slate-500">
          {reactions.like && reactions.like > 0 && (
            <span className="flex items-center gap-0.5">
              <span>👍</span>
              <span>{reactions.like}</span>
            </span>
          )}
          {reactions.love && reactions.love > 0 && (
            <span className="flex items-center gap-0.5">
              <span>❤️</span>
              <span>{reactions.love}</span>
            </span>
          )}
          {reactions.wow && reactions.wow > 0 && (
            <span className="flex items-center gap-0.5">
              <span>😮</span>
              <span>{reactions.wow}</span>
            </span>
          )}
          {reactions.sad && reactions.sad > 0 && (
            <span className="flex items-center gap-0.5">
              <span>😢</span>
              <span>{reactions.sad}</span>
            </span>
          )}
          {reactions.angry && reactions.angry > 0 && (
            <span className="flex items-center gap-0.5">
              <span>😡</span>
              <span>{reactions.angry}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
