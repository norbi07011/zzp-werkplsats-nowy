/**
 * CreateStoryEditor - Professional Story Creation Editor
 *
 * Inspired by Facebook/Instagram story creators:
 * - Full-screen editing experience
 * - Text overlay with customizable fonts, colors, sizes
 * - Stickers and emoji
 * - Drawing tools
 * - Multiple stories support (queue)
 * - Background colors and gradients
 * - Music/audio (future)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Upload,
  Type,
  Image as ImageIcon,
  Palette,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  Send,
} from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

// =====================================================
// TYPES
// =====================================================

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  rotation: number;
  align: "left" | "center" | "right";
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface StorySlide {
  id: string;
  mediaFile: File | null;
  mediaPreview: string;
  mediaType: "image" | "video" | "text";
  backgroundColor: string;
  backgroundGradient: string;
  // Media positioning controls
  mediaScale: number; // 0.5 to 2.0 (zoom)
  mediaPositionX: number; // 0-100 (horizontal position %)
  mediaPositionY: number; // 0-100 (vertical position %)
  mediaRotation: number; // -180 to 180 degrees
  mediaFit: "cover" | "contain" | "fill"; // object-fit style
  textOverlays: TextOverlay[];
  stickers: StickerOverlay[];
  caption: string;
  isJobPosting: boolean;
  jobData: {
    title: string;
    category: string;
    location: string;
    budgetMin: string;
    budgetMax: string;
    urgency: string;
    preferredDate: string;
  };
}

interface CreateStoryEditorProps {
  onClose: () => void;
  onSuccess: () => void;
}

// =====================================================
// CONSTANTS
// =====================================================

const FONTS = [
  { name: "Sans", value: "Inter, sans-serif" },
  { name: "Serif", value: "Georgia, serif" },
  { name: "Mono", value: "JetBrains Mono, monospace" },
  { name: "Handwriting", value: "Caveat, cursive" },
  { name: "Bold", value: "Impact, sans-serif" },
];

const TEXT_COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#FF6B00",
  "#FFD700",
  "#00FF00",
  "#00D4FF",
  "#0066FF",
  "#9900FF",
  "#FF00FF",
];

const BG_COLORS = [
  "transparent",
  "#000000",
  "#FFFFFF",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96E6A1",
  "#DDA0DD",
  "#F7DC6F",
  "#BB8FCE",
];

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(180deg, #0c0c0c 0%, #1a1a2e 100%)",
  "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
];

const STICKERS = [
  "🔥",
  "❤️",
  "👍",
  "🎉",
  "💪",
  "⭐",
  "✨",
  "💼",
  "🏠",
  "🔧",
  "🎨",
  "📍",
  "⏰",
  "💰",
  "🚗",
  "📞",
  "✅",
  "🆕",
  "🔝",
  "💯",
  "😊",
  "😍",
  "🤩",
  "👏",
  "🙌",
  "💡",
  "🎯",
  "🚀",
  "💎",
  "🏆",
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptySlide = (): StorySlide => ({
  id: generateId(),
  mediaFile: null,
  mediaPreview: "",
  mediaType: "text",
  backgroundColor: "#1a1a2e",
  backgroundGradient: GRADIENTS[8],
  // Media positioning defaults
  mediaScale: 1.0,
  mediaPositionX: 50,
  mediaPositionY: 50,
  mediaRotation: 0,
  mediaFit: "cover",
  textOverlays: [],
  stickers: [],
  caption: "",
  isJobPosting: false,
  jobData: {
    title: "",
    category: "",
    location: "",
    budgetMin: "",
    budgetMax: "",
    urgency: "normal",
    preferredDate: "",
  },
});

// =====================================================
// MAIN COMPONENT
// =====================================================

export const CreateStoryEditor = ({
  onClose,
  onSuccess,
}: CreateStoryEditorProps) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Role-based access: only employer, regular_user, accountant can create stories
  const allowedRoles = ["employer", "regular_user", "accountant"];
  const canCreateStory = user && allowedRoles.includes(user.role);

  // If user doesn't have permission, show message and close
  useEffect(() => {
    if (!canCreateStory) {
      toast.error(
        "❌ Nie masz uprawnień do tworzenia Stories. Dostęp mają tylko: pracodawcy, użytkownicy i księgowi."
      );
      onClose();
    }
  }, [canCreateStory, onClose]);

  // Slides (multiple stories)
  const [slides, setSlides] = useState<StorySlide[]>([createEmptySlide()]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Editor state
  const [activeTab, setActiveTab] = useState<
    "media" | "text" | "stickers" | "draw" | "job"
  >("media");
  const [uploading, setUploading] = useState(false);

  // Text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [newTextInput, setNewTextInput] = useState("");
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [selectedTextColor, setSelectedTextColor] = useState("#FFFFFF");
  const [selectedTextBg, setSelectedTextBg] = useState("transparent");
  const [selectedFontSize, setSelectedFontSize] = useState(32);

  // Dragging
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const currentSlide = slides[currentSlideIndex];

  // =====================================================
  // SLIDE MANAGEMENT
  // =====================================================

  const updateCurrentSlide = useCallback(
    (updates: Partial<StorySlide>) => {
      setSlides((prev) =>
        prev.map((slide, index) =>
          index === currentSlideIndex ? { ...slide, ...updates } : slide
        )
      );
    },
    [currentSlideIndex]
  );

  const addSlide = () => {
    if (slides.length >= 10) {
      toast.error("Maksymalnie 10 slajdów");
      return;
    }
    const newSlide = createEmptySlide();
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length === 1) {
      toast.error("Musisz mieć przynajmniej jeden slajd");
      return;
    }
    setSlides((prev) => prev.filter((_, i) => i !== index));
    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, slides.length - 2));
    }
  };

  // =====================================================
  // MEDIA HANDLING
  // =====================================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Tylko obrazy i wideo są dozwolone");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Plik jest za duży (max 50MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updateCurrentSlide({
        mediaFile: file,
        mediaPreview: event.target?.result as string,
        mediaType: file.type.startsWith("image/") ? "image" : "video",
      });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    updateCurrentSlide({
      mediaFile: null,
      mediaPreview: "",
      mediaType: "text",
    });
  };

  // =====================================================
  // TEXT OVERLAYS
  // =====================================================

  const addTextOverlay = () => {
    if (!newTextInput.trim()) {
      toast.error("Wpisz tekst");
      return;
    }

    const newText: TextOverlay = {
      id: generateId(),
      text: newTextInput,
      x: 50,
      y: 50,
      fontSize: selectedFontSize,
      fontFamily: selectedFont,
      color: selectedTextColor,
      backgroundColor: selectedTextBg,
      rotation: 0,
      align: "center",
    };

    updateCurrentSlide({
      textOverlays: [...currentSlide.textOverlays, newText],
    });
    setNewTextInput("");
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    updateCurrentSlide({
      textOverlays: currentSlide.textOverlays.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  };

  const removeTextOverlay = (id: string) => {
    updateCurrentSlide({
      textOverlays: currentSlide.textOverlays.filter((t) => t.id !== id),
    });
  };

  // =====================================================
  // STICKERS
  // =====================================================

  const addSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: generateId(),
      emoji,
      x: 50 + Math.random() * 20 - 10,
      y: 50 + Math.random() * 20 - 10,
      size: 48,
      rotation: 0,
    };

    updateCurrentSlide({
      stickers: [...currentSlide.stickers, newSticker],
    });
  };

  const removeSticker = (id: string) => {
    updateCurrentSlide({
      stickers: currentSlide.stickers.filter((s) => s.id !== id),
    });
  };

  // =====================================================
  // DRAG AND DROP
  // =====================================================

  const handleDragStart = (
    e: React.MouseEvent | React.TouchEvent,
    id: string,
    type: "text" | "sticker"
  ) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const item =
      type === "text"
        ? currentSlide.textOverlays.find((t) => t.id === id)
        : currentSlide.stickers.find((s) => s.id === id);

    if (!item) return;

    setDraggingId(id);
    setDragOffset({
      x: clientX - rect.left - (item.x / 100) * rect.width,
      y: clientY - rect.top - (item.y / 100) * rect.height,
    });
  };

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggingId || !canvasRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;

      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      // Check if it's text or sticker
      const isText = currentSlide.textOverlays.some((t) => t.id === draggingId);
      if (isText) {
        updateTextOverlay(draggingId, { x: clampedX, y: clampedY });
      } else {
        updateCurrentSlide({
          stickers: currentSlide.stickers.map((s) =>
            s.id === draggingId ? { ...s, x: clampedX, y: clampedY } : s
          ),
        });
      }
    },
    [draggingId, dragOffset, currentSlide]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);

      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleDragMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [draggingId, handleDragMove, handleDragEnd]);

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Musisz być zalogowany");
      return;
    }

    // Validate slides
    const validSlides = slides.filter(
      (slide) =>
        slide.mediaFile ||
        slide.textOverlays.length > 0 ||
        slide.stickers.length > 0
    );

    if (validSlides.length === 0) {
      toast.error("Dodaj przynajmniej jedno zdjęcie lub tekst");
      return;
    }

    setUploading(true);

    try {
      for (const slide of validSlides) {
        let mediaUrl = "";
        let mediaType: "image" | "video" = "image";

        // Upload media if exists
        if (slide.mediaFile) {
          const fileExt = slide.mediaFile.name.split(".").pop();
          const fileName = `${
            user.id
          }_${Date.now()}_${generateId()}.${fileExt}`;
          const filePath = `stories/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, slide.mediaFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

          mediaUrl = urlData.publicUrl;
          mediaType = slide.mediaFile.type.startsWith("image/")
            ? "image"
            : "video";
        } else {
          // For text-only stories, create a placeholder image URL or use gradient
          mediaUrl = `data:text/plain;base64,${btoa(
            JSON.stringify({
              type: "text-story",
              background: slide.backgroundGradient || slide.backgroundColor,
              texts: slide.textOverlays,
              stickers: slide.stickers,
            })
          )}`;
        }

        // Create story record
        const supabaseAny = supabase as any;
        const { error: insertError } = await supabaseAny
          .from("stories")
          .insert({
            author_id: user.id,
            author_type: "regular_user",
            media_url: mediaUrl,
            media_type: mediaType,
            caption: slide.caption || null,
            is_job_posting: slide.isJobPosting,
            job_title: slide.isJobPosting ? slide.jobData.title : null,
            job_category: slide.isJobPosting ? slide.jobData.category : null,
            job_location: slide.isJobPosting ? slide.jobData.location : null,
            job_budget_min:
              slide.isJobPosting && slide.jobData.budgetMin
                ? parseFloat(slide.jobData.budgetMin)
                : null,
            job_budget_max:
              slide.isJobPosting && slide.jobData.budgetMax
                ? parseFloat(slide.jobData.budgetMax)
                : null,
            job_urgency: slide.isJobPosting ? slide.jobData.urgency : null,
            job_preferred_date:
              slide.isJobPosting && slide.jobData.preferredDate
                ? slide.jobData.preferredDate
                : null,
          });

        if (insertError) throw insertError;
      }

      toast.success(`✅ ${validSlides.length} story dodano!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating stories:", error);
      toast.error(`Błąd: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col lg:flex-row">
      {/* Left Panel - Canvas */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-gray-300"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Anuluj</span>
          </button>

          <h2 className="text-white font-bold text-lg">
            Utwórz Story{" "}
            {slides.length > 1 && `(${currentSlideIndex + 1}/${slides.length})`}
          </h2>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Udostępnij</span>
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            ref={canvasRef}
            className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-black"
          >
            {/* Media Layer with positioning controls */}
            {currentSlide.mediaPreview && (
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${currentSlide.mediaScale}) rotate(${currentSlide.mediaRotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {currentSlide.mediaType === "video" ? (
                  <video
                    src={currentSlide.mediaPreview}
                    className="w-full h-full"
                    style={{
                      objectFit: currentSlide.mediaFit,
                      objectPosition: `${currentSlide.mediaPositionX}% ${currentSlide.mediaPositionY}%`,
                    }}
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={currentSlide.mediaPreview}
                    alt="Story media"
                    className="w-full h-full"
                    style={{
                      objectFit: currentSlide.mediaFit,
                      objectPosition: `${currentSlide.mediaPositionX}% ${currentSlide.mediaPositionY}%`,
                    }}
                  />
                )}
              </div>
            )}

            {/* Background for text-only stories */}
            {!currentSlide.mediaPreview && (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    currentSlide.backgroundGradient ||
                    currentSlide.backgroundColor,
                }}
              />
            )}

            {/* Text Overlays */}
            {currentSlide.textOverlays.map((text) => (
              <div
                key={text.id}
                className={`absolute cursor-move select-none ${
                  draggingId === text.id ? "z-50" : "z-10"
                }`}
                style={{
                  left: `${text.x}%`,
                  top: `${text.y}%`,
                  transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                }}
                onMouseDown={(e) => handleDragStart(e, text.id, "text")}
                onTouchStart={(e) => handleDragStart(e, text.id, "text")}
              >
                <div
                  className="px-3 py-2 rounded-lg whitespace-nowrap"
                  style={{
                    fontFamily: text.fontFamily,
                    fontSize: `${text.fontSize}px`,
                    color: text.color,
                    backgroundColor:
                      text.backgroundColor !== "transparent"
                        ? text.backgroundColor
                        : undefined,
                    textAlign: text.align,
                    textShadow:
                      text.backgroundColor === "transparent"
                        ? "2px 2px 4px rgba(0,0,0,0.8)"
                        : undefined,
                  }}
                >
                  {text.text}
                </div>
                <button
                  onClick={() => removeTextOverlay(text.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Stickers */}
            {currentSlide.stickers.map((sticker) => (
              <div
                key={sticker.id}
                className={`absolute cursor-move select-none ${
                  draggingId === sticker.id ? "z-50" : "z-10"
                }`}
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                  fontSize: `${sticker.size}px`,
                }}
                onMouseDown={(e) => handleDragStart(e, sticker.id, "sticker")}
                onTouchStart={(e) => handleDragStart(e, sticker.id, "sticker")}
              >
                {sticker.emoji}
                <button
                  onClick={() => removeSticker(sticker.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Empty State */}
            {!currentSlide.mediaPreview &&
              currentSlide.textOverlays.length === 0 &&
              currentSlide.stickers.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Dodaj zdjęcie lub tekst</p>
                  <p className="text-sm">Kliknij poniżej aby rozpocząć</p>
                </div>
              )}
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center justify-center gap-3 p-4 border-t border-gray-800">
          <button
            onClick={() =>
              setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
            }
            disabled={currentSlideIndex === 0}
            className="p-2 text-white hover:bg-gray-800 rounded-full disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2 overflow-x-auto max-w-[200px]">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                className={`w-10 h-14 rounded flex-shrink-0 border-2 transition-all ${
                  index === currentSlideIndex
                    ? "border-purple-500"
                    : "border-gray-600 hover:border-gray-500"
                }`}
                style={{
                  background: slide.mediaPreview
                    ? `url(${slide.mediaPreview}) center/cover`
                    : slide.backgroundGradient || slide.backgroundColor,
                }}
              >
                {index === currentSlideIndex && (
                  <div className="w-full h-full bg-purple-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={addSlide}
              className="w-10 h-14 rounded flex-shrink-0 border-2 border-dashed border-gray-600 hover:border-gray-500 flex items-center justify-center text-gray-500 hover:text-gray-400"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() =>
              setCurrentSlideIndex(
                Math.min(slides.length - 1, currentSlideIndex + 1)
              )
            }
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 text-white hover:bg-gray-800 rounded-full disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {slides.length > 1 && (
            <button
              onClick={() => removeSlide(currentSlideIndex)}
              className="p-2 text-red-500 hover:bg-red-500/20 rounded-full"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Panel - Tools */}
      <div className="w-full lg:w-80 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col">
        {/* Tool Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: "media", icon: ImageIcon, label: "Media" },
            { id: "text", icon: Type, label: "Tekst" },
            { id: "stickers", icon: Sparkles, label: "Naklejki" },
            { id: "job", icon: Briefcase, label: "Zlecenie" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-700 text-purple-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-750"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tool Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Media Tab */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Zdjęcie/Wideo</h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-xl hover:border-purple-500 transition-colors flex flex-col items-center gap-2 text-gray-400 hover:text-purple-400"
              >
                <Upload className="w-8 h-8" />
                <span>Wybierz plik</span>
              </button>

              {/* Media Positioning Controls */}
              {currentSlide.mediaPreview && (
                <div className="space-y-4 p-4 bg-gray-900 rounded-xl">
                  <h4 className="text-white font-medium text-sm">
                    🎯 Dopasowanie obrazu
                  </h4>

                  {/* Scale (Zoom) */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Powiększenie: {Math.round(currentSlide.mediaScale * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.05"
                      value={currentSlide.mediaScale}
                      onChange={(e) =>
                        updateCurrentSlide({
                          mediaScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>50%</span>
                      <span>200%</span>
                    </div>
                  </div>

                  {/* Position X */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Pozycja pozioma: {Math.round(currentSlide.mediaPositionX)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentSlide.mediaPositionX}
                      onChange={(e) =>
                        updateCurrentSlide({
                          mediaPositionX: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>←</span>
                      <span>→</span>
                    </div>
                  </div>

                  {/* Position Y */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Pozycja pionowa: {Math.round(currentSlide.mediaPositionY)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={currentSlide.mediaPositionY}
                      onChange={(e) =>
                        updateCurrentSlide({
                          mediaPositionY: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>↑</span>
                      <span>↓</span>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Obrót: {currentSlide.mediaRotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={currentSlide.mediaRotation}
                      onChange={(e) =>
                        updateCurrentSlide({
                          mediaRotation: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-180°</span>
                      <span>180°</span>
                    </div>
                  </div>

                  {/* Fit Mode */}
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">
                      Dopasowanie
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "cover", label: "Wypełnij" },
                        { value: "contain", label: "Zmieść" },
                        { value: "fill", label: "Rozciągnij" },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() =>
                            updateCurrentSlide({
                              mediaFit: mode.value as any,
                            })
                          }
                          className={`p-2 rounded text-xs ${
                            currentSlide.mediaFit === mode.value
                              ? "bg-purple-500 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() =>
                      updateCurrentSlide({
                        mediaScale: 1.0,
                        mediaPositionX: 50,
                        mediaPositionY: 50,
                        mediaRotation: 0,
                        mediaFit: "cover",
                      })
                    }
                    className="w-full p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 text-sm"
                  >
                    🔄 Resetuj pozycję
                  </button>
                </div>
              )}

              {currentSlide.mediaPreview && (
                <button
                  onClick={removeMedia}
                  className="w-full p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Usuń media
                </button>
              )}

              <div>
                <h4 className="text-gray-400 text-sm mb-2">
                  Tło (bez zdjęcia)
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {GRADIENTS.map((gradient, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        updateCurrentSlide({ backgroundGradient: gradient })
                      }
                      className={`w-full aspect-square rounded-lg border-2 ${
                        currentSlide.backgroundGradient === gradient
                          ? "border-purple-500"
                          : "border-transparent"
                      }`}
                      style={{ background: gradient }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Text Tab */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Dodaj tekst</h3>

              <textarea
                value={newTextInput}
                onChange={(e) => setNewTextInput(e.target.value)}
                placeholder="Wpisz tekst..."
                rows={3}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />

              <div>
                <h4 className="text-gray-400 text-sm mb-2">Czcionka</h4>
                <div className="flex flex-wrap gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.value)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedFont === font.value
                          ? "bg-purple-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-gray-400 text-sm mb-2">Kolor tekstu</h4>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedTextColor === color
                          ? "border-purple-500"
                          : "border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-gray-400 text-sm mb-2">Tło tekstu</h4>
                <div className="flex flex-wrap gap-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedTextBg(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedTextBg === color
                          ? "border-purple-500"
                          : "border-gray-600"
                      } ${color === "transparent" ? "bg-gray-700" : ""}`}
                      style={{
                        backgroundColor:
                          color !== "transparent" ? color : undefined,
                      }}
                    >
                      {color === "transparent" && (
                        <X className="w-4 h-4 text-gray-500 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-gray-400 text-sm mb-2">
                  Rozmiar: {selectedFontSize}px
                </h4>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={selectedFontSize}
                  onChange={(e) =>
                    setSelectedFontSize(parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <button
                onClick={addTextOverlay}
                disabled={!newTextInput.trim()}
                className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Dodaj tekst
              </button>
            </div>
          )}

          {/* Stickers Tab */}
          {activeTab === "stickers" && (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Naklejki i emoji</h3>

              <div className="grid grid-cols-5 gap-3">
                {STICKERS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addSticker(emoji)}
                    className="w-12 h-12 text-2xl flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Job Posting Tab */}
          {activeTab === "job" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isJobPosting"
                  checked={currentSlide.isJobPosting}
                  onChange={(e) =>
                    updateCurrentSlide({ isJobPosting: e.target.checked })
                  }
                  className="w-5 h-5 text-purple-500 rounded"
                />
                <label
                  htmlFor="isJobPosting"
                  className="text-white font-semibold"
                >
                  To jest ogłoszenie o pracę
                </label>
              </div>

              {currentSlide.isJobPosting && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={currentSlide.jobData.title}
                    onChange={(e) =>
                      updateCurrentSlide({
                        jobData: {
                          ...currentSlide.jobData,
                          title: e.target.value,
                        },
                      })
                    }
                    placeholder="Tytuł zlecenia"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <input
                    type="text"
                    value={currentSlide.jobData.category}
                    onChange={(e) =>
                      updateCurrentSlide({
                        jobData: {
                          ...currentSlide.jobData,
                          category: e.target.value,
                        },
                      })
                    }
                    placeholder="Kategoria"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <input
                    type="text"
                    value={currentSlide.jobData.location}
                    onChange={(e) =>
                      updateCurrentSlide({
                        jobData: {
                          ...currentSlide.jobData,
                          location: e.target.value,
                        },
                      })
                    }
                    placeholder="Lokalizacja"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={currentSlide.jobData.budgetMin}
                      onChange={(e) =>
                        updateCurrentSlide({
                          jobData: {
                            ...currentSlide.jobData,
                            budgetMin: e.target.value,
                          },
                        })
                      }
                      placeholder="Budżet min €"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      value={currentSlide.jobData.budgetMax}
                      onChange={(e) =>
                        updateCurrentSlide({
                          jobData: {
                            ...currentSlide.jobData,
                            budgetMax: e.target.value,
                          },
                        })
                      }
                      placeholder="Budżet max €"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  <select
                    value={currentSlide.jobData.urgency}
                    onChange={(e) =>
                      updateCurrentSlide({
                        jobData: {
                          ...currentSlide.jobData,
                          urgency: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="low">Niski priorytet</option>
                    <option value="normal">Normalny</option>
                    <option value="high">Wysoki</option>
                    <option value="urgent">🔥 Pilne</option>
                  </select>

                  <input
                    type="date"
                    value={currentSlide.jobData.preferredDate}
                    onChange={(e) =>
                      updateCurrentSlide({
                        jobData: {
                          ...currentSlide.jobData,
                          preferredDate: e.target.value,
                        },
                      })
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="p-4 border-t border-gray-700">
          <textarea
            value={currentSlide.caption}
            onChange={(e) => updateCurrentSlide({ caption: e.target.value })}
            placeholder="Dodaj opis..."
            rows={2}
            maxLength={500}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {currentSlide.caption.length}/500
          </p>
        </div>
      </div>
    </div>
  );
};
