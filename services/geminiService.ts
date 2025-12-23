import { GoogleGenAI, Type } from "@google/genai";

// Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReceipt = async (base64Image: string): Promise<{ amount: number, date: string, description: string } | null> => {
  // Fix: Removed unnecessary manual apiKey check as guidelines say to assume it's pre-configured
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

    // Fix: Access response.text property directly and trim as per guidelines
    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    return null;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};

export const getHealthInsights = async (vitals: any[], meds: any[]): Promise<string> => {
  // Fix: Assuming process.env.API_KEY is pre-configured and using ai.models.generateContent directly
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes sinais vitais recentes de um paciente idoso: ${JSON.stringify(vitals.slice(-3))} e medicamentos: ${JSON.stringify(meds)}. Forneça um resumo diário de 2 frases ou alerta se os valores estiverem anormais. Responda em Português do Brasil.`
    });
    // Fix: Using response.text property directly
    return response.text || "Sem insights disponíveis.";
  } catch (e) {
    return "Insights indisponíveis.";
  }
}