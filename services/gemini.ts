import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPTS, GEMINI_MODEL } from "../constants";
import { AnalysisResult, StockDataPoint } from "../types";

export const analyzeStockData = async (
  data: StockDataPoint[],
  userApiKey?: string // Made optional
): Promise<AnalysisResult> => {
  // 1. Try User Key, 2. Try System Env Key
  const finalApiKey = userApiKey || process.env.API_KEY;

  if (!finalApiKey) {
    throw new Error("No API Key available. Please enter a key in Settings or configure the system environment.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  // Use the last 400 candles for analysis context
  const slicedData = data.slice(-400); 
  
  const csvString = [
    "Date,Open,High,Low,Close,Volume,MA50,MA200,VWAP",
    ...slicedData.map(
      (d) =>
        `${d.date},${d.open.toFixed(2)},${d.high.toFixed(2)},${d.low.toFixed(2)},${d.close.toFixed(2)},${d.volume},${d.ma50 ? d.ma50.toFixed(2) : ''},${d.ma200 ? d.ma200.toFixed(2) : ''},${d.vwap ? d.vwap.toFixed(2) : ''}`
    ),
  ].join("\n");

  const prompt = `
    Here is the market data CSV for the asset. 
    Perform the Wyckoff Analysis.
    
    CSV DATA:
    ${csvString}
  `;

  // Define Schema for Structured JSON Output (Bilingual)
  const bilingualTextSchema = {
    type: Type.OBJECT,
    properties: {
      en: { type: Type.STRING },
      cn: { type: Type.STRING }
    },
    required: ["en", "cn"]
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: bilingualTextSchema,
      detailedAnalysis: {
        type: Type.OBJECT,
        properties: {
            currentPhase: { type: Type.STRING },
            phaseExplanation: bilingualTextSchema,
            volumeBehavior: bilingualTextSchema,
            trendStructure: bilingualTextSchema
        },
        required: ["currentPhase", "phaseExplanation", "volumeBehavior", "trendStructure"]
      },
      keyLevels: {
          type: Type.OBJECT,
          properties: {
              support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } }
          },
          required: ["support", "resistance"]
      },
      tradeSetup: {
          type: Type.OBJECT,
          properties: {
              recommendation: bilingualTextSchema,
              entryZone: { type: Type.STRING },
              stopLoss: { type: Type.STRING },
              priceTargets: { type: Type.STRING }
          },
          required: ["recommendation", "entryZone", "stopLoss", "priceTargets"]
      },
      // NEW CONVICTION SECTION WITH SUB-SCORES
      tradeConviction: {
        type: Type.OBJECT,
        properties: {
            direction: { type: Type.STRING, enum: ["Long", "Short", "Neutral"] },
            score: { type: Type.NUMBER },
            subScores: {
                type: Type.OBJECT,
                properties: {
                    setupQuality: { type: Type.NUMBER },
                    riskReward: { type: Type.NUMBER },
                    phaseMaturity: { type: Type.NUMBER }
                },
                required: ["setupQuality", "riskReward", "phaseMaturity"]
            },
            reasoning: bilingualTextSchema
        },
        required: ["direction", "score", "subScores", "reasoning"]
      },
      futureOutlook: bilingualTextSchema,
      events: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            price: { type: Type.NUMBER },
            label: { type: Type.STRING },
            description: bilingualTextSchema,
          },
          required: ["date", "price", "label", "description"],
        },
      },
      zones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["Accumulation", "Distribution"] },
            startDate: { type: Type.STRING },
            endDate: { type: Type.STRING },
            topPrice: { type: Type.NUMBER },
            bottomPrice: { type: Type.NUMBER },
            phaseLabel: bilingualTextSchema,
          },
          required: ["type", "startDate", "endDate", "topPrice", "bottomPrice", "phaseLabel"],
        },
      },
    },
    required: ["summary", "detailedAnalysis", "keyLevels", "tradeSetup", "tradeConviction", "futureOutlook", "events", "zones"],
  };

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS.universal,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, 
        seed: 42,
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response from Gemini");
    }

    try {
        const parsed = JSON.parse(textResponse) as AnalysisResult;
        return parsed;
    } catch (e) {
        console.error("Failed to parse JSON", textResponse);
        throw new Error("Gemini returned invalid JSON. Please try again.");
    }
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};