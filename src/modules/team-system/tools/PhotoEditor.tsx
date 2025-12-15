import React, { useRef, useState, useEffect } from "react";
import { ProjectImage } from "./types";
import {
  X,
  Trash2,
  PenTool,
  Circle,
  Slash,
  MousePointer2,
  Scaling,
  AlertTriangle,
} from "lucide-react";

interface Props {
  image: ProjectImage;
  onUpdate: (img: ProjectImage) => void;
  onDelete: () => void;
  labels: any;
}

type DrawTool = "cross" | "circle" | "line";
type ConfirmAction = "delete-image" | "delete-annotation" | null;

export const PhotoEditor: React.FC<Props> = ({
  image,
  onUpdate,
  onDelete,
  labels,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawTool>("cross");
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      canvas.width = 400; // Fixed width for consistency in UI
      const scale = 400 / img.naturalWidth;
      canvas.height = img.naturalHeight * scale;

      // Draw Image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      image.annotations.forEach((ant, idx) => {
        const x = ant.x * canvas.width;
        const y = ant.y * canvas.height;
        // Default size is 20 if not specified
        const size = ant.size || 20;
        const isSelected = idx === selectedIdx;

        ctx.beginPath();
        // Selected item is Red, others are Blue
        ctx.strokeStyle = isSelected ? "#EF4444" : "#2563EB";
        ctx.lineWidth = isSelected ? 4 : 3;
        ctx.shadowColor = isSelected ? "rgba(0,0,0,0.5)" : "transparent";
        ctx.shadowBlur = isSelected ? 5 : 0;

        if (ant.type === "circle") {
          // Draw Circle
          ctx.arc(x, y, size, 0, 2 * Math.PI);
        } else if (ant.type === "line") {
          // Draw Line (Slash)
          ctx.moveTo(x - size, y + size);
          ctx.lineTo(x + size, y - size);
        } else {
          // Draw Cross (Default)
          ctx.moveTo(x - size, y - size);
          ctx.lineTo(x + size, y + size);
          ctx.moveTo(x + size, y - size);
          ctx.lineTo(x - size, y + size);
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      });
    };
  }, [image, selectedIdx]); // Re-render when image or selection changes

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Coordinates relative to canvas (pixels)
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Normalized coordinates (0-1)
    const normX = clickX / canvas.width;
    const normY = clickY / canvas.height;

    if (isDrawing) {
      // Add new annotation
      const newAnnotation = { x: normX, y: normY, type: activeTool, size: 20 };
      const newAnnotations = [...image.annotations, newAnnotation];
      onUpdate({ ...image, annotations: newAnnotations });
      // Automatically select the newly created annotation
      setSelectedIdx(newAnnotations.length - 1);
    } else {
      // Select existing annotation logic
      // Find closest annotation within click range (e.g. 30px radius)
      let foundIdx = -1;
      let minDist = 30; // hit threshold

      image.annotations.forEach((ant, idx) => {
        const antX = ant.x * canvas.width;
        const antY = ant.y * canvas.height;
        const dist = Math.sqrt(
          Math.pow(clickX - antX, 2) + Math.pow(clickY - antY, 2)
        );

        if (dist < minDist) {
          minDist = dist;
          foundIdx = idx;
        }
      });

      setSelectedIdx(foundIdx !== -1 ? foundIdx : null);
    }
  };

  const handleSizeChange = (newSize: number) => {
    if (selectedIdx === null) return;

    const updatedAnnotations = image.annotations.map((ant, idx) => {
      if (idx === selectedIdx) {
        return { ...ant, size: newSize };
      }
      return ant;
    });

    onUpdate({ ...image, annotations: updatedAnnotations });
  };

  // Trigger Confirmation Modal instead of immediate delete
  const triggerDeleteAnnotation = () => {
    if (selectedIdx !== null) {
      setConfirmAction("delete-annotation");
    }
  };

  const triggerDeleteImage = () => {
    setConfirmAction("delete-image");
  };

  // Execute actual delete after confirmation
  const confirmDelete = () => {
    if (confirmAction === "delete-image") {
      onDelete();
    } else if (confirmAction === "delete-annotation" && selectedIdx !== null) {
      const updatedAnnotations = image.annotations.filter(
        (_, idx) => idx !== selectedIdx
      );
      onUpdate({ ...image, annotations: updatedAnnotations });
      setSelectedIdx(null);
    }
    setConfirmAction(null);
  };

  const cancelDelete = () => {
    setConfirmAction(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3 relative">
      {/* Confirmation Modal Overlay */}
      {confirmAction && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="bg-red-50 p-3 rounded-full mb-3">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-1">
            {confirmAction === "delete-image"
              ? "Usunąć zdjęcie?"
              : "Usunąć element?"}
          </h4>
          <p className="text-xs text-gray-500 mb-4">
            {confirmAction === "delete-image"
              ? "Tej operacji nie można cofnąć."
              : "Wybrana adnotacja zostanie usunięta."}
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={cancelDelete}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Usuń
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          className={`rounded-md border bg-gray-50 w-full ${
            isDrawing ? "cursor-crosshair" : "cursor-default"
          }`}
          onClick={handleCanvasClick}
        />
        {!isDrawing && image.annotations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-100 pointer-events-none text-gray-500 text-xs text-center px-4">
            Kliknij "Rysuj", aby dodać oznaczenia
          </div>
        )}
      </div>

      {/* Toolbar - Only visible when drawing is enabled */}
      {isDrawing && (
        <div className="flex justify-center gap-2 pb-2 border-b border-gray-100 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => setActiveTool("cross")}
            className={`p-1.5 rounded ${
              activeTool === "cross"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
            title="Krzyżyk"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setActiveTool("circle")}
            className={`p-1.5 rounded ${
              activeTool === "circle"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
            title="Okrąg"
          >
            <Circle size={18} />
          </button>
          <button
            onClick={() => setActiveTool("line")}
            className={`p-1.5 rounded ${
              activeTool === "line"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
            title="Linia"
          >
            <Slash size={18} />
          </button>
        </div>
      )}

      {/* Size Slider - Visible when an item is selected */}
      {selectedIdx !== null && !isDrawing && (
        <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Scaling size={16} className="text-blue-600" />
          <input
            type="range"
            min="10"
            max="100"
            value={image.annotations[selectedIdx]?.size || 20}
            onChange={(e) => handleSizeChange(parseInt(e.target.value))}
            className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={triggerDeleteAnnotation}
            className="text-red-500 hover:bg-red-100 p-1 rounded transition-colors"
            title="Usuń to oznaczenie"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Inputs */}
      <input
        type="text"
        placeholder={labels.desc}
        value={image.caption}
        onChange={(e) => onUpdate({ ...image, caption: e.target.value })}
        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
      />

      <textarea
        placeholder="Szczegółowy opis / Details (opcjonalne)"
        value={image.description || ""}
        onChange={(e) => onUpdate({ ...image, description: e.target.value })}
        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border h-20 resize-none"
      />

      {/* Actions */}
      <div className="flex justify-between items-center text-sm pt-1">
        <button
          onClick={() => {
            setIsDrawing(!isDrawing);
            setSelectedIdx(null);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
            isDrawing
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="w-[14px] h-[14px] flex items-center justify-center">
            {isDrawing ? <X size={14} /> : <PenTool size={14} />}
          </span>
          {isDrawing ? "Zakończ" : labels.drawMode}
        </button>

        <div className="flex gap-2">
          {!isDrawing && image.annotations.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
              <MousePointer2 size={12} /> Kliknij element by edytować
            </div>
          )}
          <button
            onClick={() => onUpdate({ ...image, annotations: [] })}
            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1"
            title="Wyczyść wszystkie oznaczenia"
          >
            {labels.clear}
          </button>
          <button
            onClick={triggerDeleteImage}
            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
            title="Usuń zdjęcie"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
