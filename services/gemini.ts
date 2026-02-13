
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not configured.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const askGemini = async (prompt: string, context?: any) => {
  const ai = getAIClient();
  const systemInstruction = `
    You are a professional business assistant for "Sổ Bán Hàng" (a Vietnamese store management app). 
    Help users analyze their current todo items, sales data, and inventory.
    Current data context: ${JSON.stringify(context)}
    Provide actionable insights in Vietnamese. 
    Be concise but deep in your reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }
};
