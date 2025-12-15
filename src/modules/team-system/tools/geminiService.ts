// Stubbed version - @google/genai not installed
// Original import: import { GoogleGenAI } from "@google/genai";

export const polishDescription = async (text: string): Promise<string> => {
  // AI polishing disabled - return original text with indicator
  console.info(
    "[geminiService] AI polishing disabled - returning original text"
  );
  return text + " (AI polish disabled)";
};
