/**
 * ===============================================
 * SAVE BUTTON - Post saving to folders
 * ===============================================
 * Features:
 * - Dropdown with 4 folder options
 * - Visual indicator when saved
 * - Multi-folder support (post can be in multiple folders)
 */

import { useState, useRef, useEffect } from "react";
import { Bookmark } from "./icons";

export type SaveFolder =
  | "do_aplikowania"
  | "polubiane"
  | "moje_reakcje"
  | "komentowane";

interface SaveButtonProps {
  postId: string;
  currentFolders: SaveFolder[]; // Foldery, w których post już jest zapisany
  onSave: (folder: SaveFolder) => Promise<void>;
  onUnsave: (folder: SaveFolder) => Promise<void>;
  userRole?: string; // Do różnicowania folderów dla twórców vs odbiorców
  compact?: boolean; // Compact mode for smaller displays
}

const SaveButton: React.FC<SaveButtonProps> = ({
  postId,
  currentFolders,
  onSave,
  onUnsave,
  userRole,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState<SaveFolder | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Folder definitions (różne dla creators vs consumers)
  const isCreator =
    userRole === "employer" ||
    userRole === "accountant" ||
    userRole === "admin";

  const folders: {
    value: SaveFolder;
    label: string;
    icon: string;
    description: string;
  }[] = isCreator
    ? [
        {
          value: "do_aplikowania",
          label: "Do aplikowania później",
          icon: "📁",
          description: "Zapisz aby aplikować później",
        },
        {
          value: "polubiane",
          label: "Polubiane",
          icon: "❤️",
          description: "Posty które lubię",
        },
        {
          value: "moje_reakcje",
          label: "Moje reakcje na oferty",
          icon: "💼",
          description: "Tylko oferty pracy z moją reakcją",
        },
        {
          value: "komentowane",
          label: "Komentowane",
          icon: "💬",
          description: "Posty gdzie skomentowałem",
        },
      ]
    : [
        {
          value: "do_aplikowania",
          label: "Do aplikowania później",
          icon: "📁",
          description: "Zapisz aby aplikować później",
        },
        {
          value: "polubiane",
          label: "Polubiane",
          icon: "❤️",
          description: "Posty które lubię",
        },
        {
          value: "moje_reakcje",
          label: "Moje reakcje",
          icon: "😊",
          description: "Posty z moimi reakcjami emoji",
        },
        {
          value: "komentowane",
          label: "Komentowane",
          icon: "💬",
          description: "Posty gdzie skomentowałem",
        },
      ];

  const toggleFolder = async (folder: SaveFolder) => {
    try {
      setSaving(folder);
      // Validate user context before toggle
      if (!currentFolders) {
        console.error("Error: currentFolders not initialized");
        return;
      }
      if (currentFolders.includes(folder)) {
        await onUnsave(folder);
      } else {
        await onSave(folder);
      }
    } catch (error) {
      console.error("Error toggling folder:", error);
    } finally {
      setSaving(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const isSaved = currentFolders.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative ${
          compact ? "p-1.5" : "p-2"
        } hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 ${
          isSaved ? "bg-amber-50 dark:bg-amber-900/20" : ""
        }`}
        title={
          isSaved
            ? `Zapisane w ${currentFolders.length} folderze(-ach)`
            : "Zapisz do folderu"
        }
        aria-label="Zapisz post"
      >
        <Bookmark
          className={`${
            compact ? "w-4 h-4" : "w-5 h-5"
          } transition-all duration-200 ${
            isSaved
              ? "fill-amber-500 text-amber-500 scale-110"
              : "text-gray-600 dark:text-gray-400 group-hover:text-amber-500"
          }`}
        />

        {/* Badge showing number of folders */}
        {isSaved && currentFolders.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {currentFolders.length}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <p className="text-sm font-bold flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Zapisz do folderu
            </p>
            <p className="text-xs opacity-90 mt-1">
              {currentFolders.length > 0
                ? `Zapisane w ${currentFolders.length} folderze(-ach)`
                : "Wybierz foldery"}
            </p>
          </div>

          {/* Folders List */}
          <div className="max-h-80 overflow-y-auto">
            {folders.map((folder) => {
              const isInFolder = currentFolders.includes(folder.value);
              const isLoading = saving === folder.value;

              return (
                <button
                  key={folder.value}
                  onClick={() => toggleFolder(folder.value)}
                  disabled={isLoading}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    isInFolder ? "bg-amber-50 dark:bg-amber-900/20" : ""
                  } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
                >
                  {/* Icon */}
                  <span className="text-2xl flex-shrink-0 mt-0.5">
                    {folder.icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.label}
                      </span>
                      {isInFolder && (
                        <span className="text-green-600 dark:text-green-400 flex-shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {folder.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Możesz zapisać post w wielu folderach
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveButton;
