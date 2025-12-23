
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeReceipt = async (base64Image: string): Promise<{ amount: number, date: string, description: string } | null> => {
  if (!apiKey) return null;

  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analise esta imagem de comprovante. Extraia o valor total (amount como number), a data (date YYYY-MM-DD) e uma breve descrição (description - nome do estabelecimento). Retorne estritamente JSON válido."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};

export const getHealthInsights = async (vitals: any[], meds: any[]): Promise<string> => {
  if (!apiKey) return "Configure a API Key para insights.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes sinais vitais recentes de um paciente idoso: ${JSON.stringify(vitals.slice(-3))} e medicamentos: ${JSON.stringify(meds)}. Forneça um resumo diário de 2 frases ou alerta se os valores estiverem anormais. Responda em Português do Brasil.`
    });
    return response.text || "Sem insights disponíveis.";
  } catch (e) {
    return "Insights indisponíveis.";
  }
}
