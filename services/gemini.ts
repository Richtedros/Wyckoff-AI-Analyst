
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPTS, DEFAULT_MODEL } from "../constants";
import { AnalysisResult, StockDataPoint } from "../types";

export const analyzeStockData = async (
  data: StockDataPoint[],
  userApiKey?: string,
  context?: { costBasis?: number },
  modelId: string = DEFAULT_MODEL
): Promise<AnalysisResult> => {
  // 1. Try User Key, 2. Try System Env Key
  const finalApiKey = userApiKey || process.env.API_KEY;

  if (!finalApiKey) {
    throw new Error("No API Key available. Please enter a key in Settings or configure the system environment.");
  }

  const ai = new GoogleGenAI({ apiKey: finalApiKey });

  // Use the last 400 candles for analysis context
  const slicedData = data.slice(-400); 
  const lastPrice = slicedData[slicedData.length - 1].close;
  
  const csvString = [
    "Date,Open,High,Low,Close,Volume,MA50,MA200,VWAP",
    ...slicedData.map(
      (d) =>
        `${d.date},${d.open.toFixed(2)},${d.high.toFixed(2)},${d.low.toFixed(2)},${d.close.toFixed(2)},${d.volume},${d.ma50 ? d.ma50.toFixed(2) : ''},${d.ma200 ? d.ma200.toFixed(2) : ''},${d.vwap ? d.vwap.toFixed(2) : ''}`
    ),
  ].join("\n");

  let prompt = `
    Here is the market data CSV for the asset. 
    Perform the Wyckoff Analysis.
    
    CSV DATA:
    ${csvString}
  `;

  // Inject Cost Basis Context if provided
  if (context && context.costBasis) {
      const pnl = ((lastPrice - context.costBasis) / context.costBasis) * 100;
      prompt += `
      
      **USER PORTFOLIO CONTEXT:**
      - **Cost Basis:** ${context.costBasis.toFixed(2)}
      - **Current Price:** ${lastPrice.toFixed(2)}
      - **Current P&L:** ${pnl.toFixed(2)}%
      
      **YOUR TASK: CUSTOMIZED ADVICE**
      The user OWNS this stock. Do not act like they are flat.
      
      1.  **If P&L is HUGE (> +30%):** 
          - Do NOT recommend "ADD" if price is extended. Suggest "HOLD" or "Trailing Stop".
          - Only "ADD" if it's a perfect pyramid point (Backup).
          - *Example:* If user bought TTD at 38 and it's now 100, do not say "Buy". Say "Hold Trend".
          
      2.  **If P&L is NEGATIVE:**
          - Do NOT suggest "Add" to average down unless a Phase C Spring is confirmed.
          - Focus on "Structural Support" survival.
      `;
  } else {
      // General Search Context (No Position yet)
      prompt += `
      **USER STRATEGY: NEW ENTRY SNIPER**
      - **Phase C Entry:** Only buy if the Stop Loss is tight (High R/R).
      - **Rule:** If Risk/Reward < 2.5, Recommendation = "WAIT".
      `;
  }

  prompt += `
  **TARGET INSTRUCTIONS:**
  - Calculate targets using **Confluence** (Range Depth + Structure + Fibs).
  - Return the target text in BOTH English and Chinese.
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
              priceTargets: bilingualTextSchema, // UPDATED to Object
              expectedDuration: bilingualTextSchema,
              positionManagement: {
                  type: Type.OBJECT,
                  properties: {
                      action: { type: Type.STRING, enum: ['Buy', 'Add', 'Hold', 'Trim', 'Sell', 'Stop Loss', 'Wait'] },
                      reasoning: bilingualTextSchema
                  },
                  required: ["action", "reasoning"]
              }
          },
          required: ["recommendation", "entryZone", "stopLoss", "priceTargets", "expectedDuration"]
      },
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
      model: modelId,
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
