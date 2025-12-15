/**
 * ================================================================
 * GEMINI AI SERVICE - STUB
 * ================================================================
 * Tymczasowo wyłączone - brak pakietu @google/genai
 * Do implementacji w przyszłości
 */

export const generateTaskDescription = async (
  title: string,
  language: "pl" | "nl"
): Promise<string> => {
  // TODO: Zaimplementować z Gemini API gdy będzie potrzebne
  return `Zadanie: ${title}\n\n• Przygotowanie materiałów\n• Wykonanie pracy\n• Kontrola jakości\n• Sprzątanie stanowiska`;
};

export const suggestMaterials = async (
  taskDescription: string,
  language: "pl" | "nl"
): Promise<string> => {
  // TODO: Zaimplementować z Gemini API gdy będzie potrzebne
  return "Materiały podstawowe - 1 szt\nNarzędzia - 1 zestaw";
};
