
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectAnalysis } from "../types";

export const analyzeProject = async (repoUrl: string): Promise<ProjectAnalysis> => {
  // Initialize AI client with the correct environment variable and structure
  // Using direct process.env.API_KEY reference as per strict guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for complex reasoning and coding analysis
      model: "gemini-3-pro-preview",
      contents: `Tu es un expert en audit de code. Analyse ce projet de billard : ${repoUrl}.
      Évalue le moteur physique et l'UI. Propose 5 améliorations majeures.
      Réponds au format JSON uniquement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            techStack: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  recommendations: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["title", "score", "description", "recommendations"]
              }
            },
            suggestedRoadmap: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "techStack", "categories", "suggestedRoadmap"]
        }
      }
    });

    // Directly access the .text property as per guidelines (it is a getter, not a method)
    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA.");
    
    return JSON.parse(text) as ProjectAnalysis;
  } catch (error: any) {
    console.error("Erreur critique Gemini:", error);
    throw error;
  }
};
