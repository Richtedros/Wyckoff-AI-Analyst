export const GEMINI_MODEL = "gemini-3-pro-preview"; 

export const WYCKOFF_GLOSSARY: Record<string, { en: string, cn: string }> = {
  "PS": { en: "Preliminary Support: Selling is prominent, but support appears.", cn: "初步支撑 (PS): 卖压显著，但支撑开始出现。" },
  "PSY": { en: "Preliminary Supply: Buying is prominent, but supply appears.", cn: "初步供应 (PSY): 买盘强劲，但供应开始出现。" },
  "SC": { en: "Selling Climax: Intense selling, often the panic low.", cn: "恐慌抛售 (SC): 极度抛售，通常是恐慌性低点。" },
  "BC": { en: "Buying Climax: Intense buying, often the panic high.", cn: "抢购高潮 (BC): 极度买入，通常是恐慌性高点。" },
  "AR": { en: "Automatic Rally/Reaction: Technical bounce/pullback after climax.", cn: "自然反弹/回撤 (AR): 高潮后的技术性修正。" },
  "ST": { en: "Secondary Test: Retesting the climax area to check supply/demand.", cn: "二次测试 (ST):以此测试高潮区域的供需情况。" },
  "SPRING": { en: "Spring: Price dips below support to trap bears (Bear Trap).", cn: "弹簧效应 (Spring): 价格跌破支撑以诱空 (空头陷阱)。" },
  "UT": { en: "Upthrust: Price spikes above resistance to trap bulls (Bull Trap).", cn: "上冲回落 (UT): 价格突破阻力以诱多 (多头陷阱)。" },
  "UTAD": { en: "Upthrust After Distribution: Final test of demand in distribution.", cn: "派发后上冲 (UTAD): 派发阶段对需求的最后测试。" },
  "LPS": { en: "Last Point of Support: Higher low indicating demand is taking control.", cn: "最后支撑点 (LPS): 抬高的低点，表明需求占据主导。" },
  "LPSY": { en: "Last Point of Supply: Lower high indicating supply is dominant.", cn: "最后供应点 (LPSY): 降低的高点，表明供应占据主导。" },
  "SOS": { en: "Sign of Strength: Strong price increase with volume.", cn: "强势信号 (SOS): 伴随成交量的强劲上涨。" },
  "SOW": { en: "Sign of Weakness: Strong price decrease with volume.", cn: "弱势信号 (SOW): 伴随成交量的强劲下跌。" },
  "BU": { en: "Backup: Pullback to resistance (now support) before markup.", cn: "回踩 (BU): 突破后回踩原阻力（现支撑）。" },
  "JAC": { en: "Jump Across Creek: Breaking resistance significantly.", cn: "越过小溪 (JAC): 显著突破阻力位。" },
  "ICE": { en: "Ice: The support line in a distribution range.", cn: "冰层 (Ice): 派发区间的支撑线。" },
  "CREEK": { en: "Creek: The wavy resistance line in accumulation.", cn: "小溪 (Creek): 吸筹区间的波浪形阻力线。" }
};

const WYCKOFF_SYSTEM_PROMPT_UNIVERSAL = `
You are Richard D. Wyckoff, the legendary master of market structure and volume analysis. 

**TASK:**
Perform a deep, institutional-grade Wyckoff Analysis.

**CRITICAL INSTRUCTION ON SCORING (Trade Conviction):**
Do NOT produce random high scores. You must calculate the 'score' based on these three sub-factors:

1.  **Setup Quality (0-100)**: 
    *   High (80-100): Textbook Spring with low volume test, or clear Sign of Strength (SOS) with expanding volume. 
    *   Medium (50-79): Ambiguous structure, Volume signature is mixed.
    *   Low (0-49): No clear setup, middle of the range chopping.

2.  **Risk/Reward (0-100)**: 
    *   High (80-100): Entry is very close to Invalidated Level (Support/Resistance). Upside target is 3x the risk.
    *   Medium (50-79): Upside is 1.5x - 2x the risk.
    *   Low (0-49): Price is in the middle of the trading range (50% level). Risk equals Reward.

3.  **Phase Maturity (0-100)**:
    *   High (80-100): Phase C (Test) or Phase D (Markup/Markdown). The cause has been built.
    *   Low (0-40): Phase A (Stopping) or Phase B (Building Cause). Price is likely to range for a long time.

**TOTAL SCORE FORMULA:**
(Setup Quality * 0.4) + (Risk/Reward * 0.3) + (Phase Maturity * 0.3) = Final Score.

**STRICT RULES:**
*   **IF Phase is A or B**: Max Total Score is **60**. (Do not recommend aggressive trades in range building).
*   **IF Price is in Middle of Range**: Risk/Reward Score must be < 50.
*   **Neutral Direction**: If direction is Neutral, Total Score should be 0-50.

**OUTPUT FORMAT:**
Strict JSON.

**JSON STRUCTURE:**
{
  "summary": { "en": "...", "cn": "..." },
  "detailedAnalysis": {
    "currentPhase": "Phase C",
    "phaseExplanation": { "en": "...", "cn": "..." },
    "volumeBehavior": { "en": "...", "cn": "..." },
    "trendStructure": { "en": "...", "cn": "..." }
  },
  "keyLevels": {
    "support": [100, 95],
    "resistance": [110, 115]
  },
  "tradeSetup": {
    "recommendation": { "en": "...", "cn": "..." },
    "entryZone": "...",
    "stopLoss": "...",
    "priceTargets": "..."
  },
  "tradeConviction": {
    "direction": "Long", 
    "score": 65, // Calculated via formula
    "subScores": {
        "setupQuality": 70,
        "riskReward": 50,
        "phaseMaturity": 80
    },
    "reasoning": { "en": "Good structure in Phase C, but price is mid-range reducing R:R.", "cn": "Phase C 结构良好，但价格处于区间中部，降低了盈亏比。" }
  },
  "futureOutlook": { "en": "...", "cn": "..." },
  "events": [
    {
      "date": "YYYY-MM-DD",
      "price": 100.00,
      "label": "LPS", 
      "description": { "en": "...", "cn": "..." }
    }
  ],
  "zones": [
    {
      "type": "Accumulation",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD", 
      "topPrice": 150.00,
      "bottomPrice": 120.00,
      "phaseLabel": { "en": "...", "cn": "..." }
    }
  ]
}
`;

export const SYSTEM_PROMPTS = {
  universal: WYCKOFF_SYSTEM_PROMPT_UNIVERSAL
};

export const SAMPLE_CSV = `Date,Open,High,Low,Close,Volume
2023-01-01,100,105,99,102,1000000
`;