/**
 * ================================================================
 * CLIENT SIGNATURE PAD - Podpis klienta na canvasie
 * ================================================================
 */

import React, { useRef, useState, useEffect } from "react";





import { supabase } from "../../../../lib/supabase";
import { useAuth } from "../../../../../contexts/AuthContext";
import { toast } from "sonner";

interface ClientSignatureProps {
  projectId: string;
  signatureType?: "start" | "partial" | "completion" | "warranty";
  onSignatureComplete?: (signatureUrl: string) => void;
  onCancel?: () => void;
}

export const ClientSignature: React.FC<ClientSignatureProps> = ({
  projectId,
  signatureType = "completion",
  onSignatureComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (!clientName.trim()) {
      toast.error("Wprowadź imię i nazwisko osoby podpisującej");
      return;
    }

    if (!hasSignature) {
      toast.error("Brak podpisu - proszę podpisać");
      return;
    }

    setIsSaving(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      // Convert to base64
      const signatureDataUrl = canvas.toDataURL("image/png");

      // Save to database
      const { data, error } = await supabase
        .from("team_project_signatures")
        .insert({
          project_id: projectId,
          signature_type: signatureType,
          signature_url: signatureDataUrl,
          signed_by_name: clientName.trim(),
          signed_by_email: clientEmail.trim() || null,
          signed_by_role: clientRole.trim() || null,
          notes: notes.trim() || null,
          ip_address: null, // Would need server-side to get real IP
          user_agent: navigator.userAgent,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Also update main project with latest signature
      await supabase
        .from("team_projects")
        .update({
          client_signature_url: signatureDataUrl,
          client_signature_date: new Date().toISOString(),
          client_signed_by: clientName.trim(),
          client_email: clientEmail.trim() || null,
          completion_notes: notes.trim() || null,
        })
        .eq("id", projectId);

      toast.success("✅ Podpis zapisany pomyślnie!");
      onSignatureComplete?.(signatureDataUrl);
    } catch (error: any) {
      console.error("Error saving signature:", error);
      toast.error("Błąd podczas zapisywania podpisu");
    } finally {
      setIsSaving(false);
    }
  };

  const getSignatureTypeLabel = () => {
    switch (signatureType) {
      case "start":
        return "Rozpoczęcie prac";
      case "partial":
        return "Częściowy odbiór";
      case "completion":
        return "Odbiór końcowy";
      case "warranty":
        return "Gwarancja";
      default:
        return "Podpis";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
          <PenTool className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Podpis klienta</h2>
          <p className="text-sm text-gray-500">{getSignatureTypeLabel()}</p>
        </div>
      </div>

      {/* Client Info Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imię i nazwisko *
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="np. Jan Kowalski"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opcjonalnie)
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Funkcja
            </label>
            <input
              type="text"
              value={clientRole}
              onChange={(e) => setClientRole(e.target.value)}
              placeholder="np. Eigenaar"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Uwagi (opcjonalnie)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dodatkowe uwagi..."
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Signature Canvas */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Podpis (rysuj palcem lub myszką)
        </label>
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-40 touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">Podpisz tutaj</p>
            </div>
          )}
        </div>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearCanvas}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <RotateCcw className="w-4 h-4" />
        Wyczyść podpis
      </button>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Anuluj
          </button>
        )}
        <button
          onClick={saveSignature}
          disabled={isSaving || !hasSignature || !clientName.trim()}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
            isSaving || !hasSignature || !clientName.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
          }`}
        >
          {isSaving ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          Zatwierdź podpis
        </button>
      </div>

      {/* Legal Notice */}
      <p className="text-xs text-gray-400 text-center mt-4">
        Składając podpis, potwierdzam odbiór wykonanych prac zgodnie z umową.
      </p>
    </div>
  );
};

export default ClientSignature;
