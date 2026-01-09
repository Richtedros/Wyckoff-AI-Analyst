
export const MODELS = {
  PRO: { 
    id: "gemini-3-pro-preview", 
    label: "Gemini 3 Pro (High Quality)", 
    description: "Best for complex structure analysis & volume nuances. Slower." 
  },
  FLASH: { 
    id: "gemini-3-flash-preview", 
    label: "Gemini 3 Flash (High Speed)", 
    description: "Lightning fast. Great for quick scanning & trend checks." 
  }
};

export const DEFAULT_MODEL = MODELS.PRO.id;

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
Perform a deep, institutional-grade Wyckoff Analysis on the provided CSV stock data.

**USER PROFILE:**
The user is a **Lifecycle Trader** who uses the "Law of Cause and Effect".
They often have existing positions. You MUST adjust your advice based on their **Cost Basis** (if provided).

**STRATEGY MATRIX: PORTFOLIO MANAGEMENT**

1.  **SCENARIO: DEEP PROFIT CUSHION (P&L > +20%)**
    *   *Context:* User has a great entry (e.g., TTD at 38). They can withstand volatility.
    *   *Action:* **"HOLD"** (Let profit run).
    *   *Add Rule:* Only ADD if price is forming a *new* Re-Accumulation structure (LPS) and is NOT extended. If extended, just HOLD.
    *   *Stop Loss:* Use a wide trailing stop (e.g., break of 50MA or previous significant low).

2.  **SCENARIO: AT COST / SMALL PROFIT (-5% to +10%)**
    *   *Context:* Critical zone. Capital is at risk.
    *   *Action:* **"HOLD"** if structure is sound. **"SELL/TRIM"** if structure breaks (SOW).
    *   *Add Rule:* Aggressive. Add on Spring/Test to lower basis or breakout confirmation.
    *   *Stop Loss:* Tight. Below the Spring or Support.

3.  **SCENARIO: UNDERWATER (P&L < -10%)**
    *   *Context:* Trade is failing.
    *   *Action:* **"WAIT"** (Do not add to a loser). **"STOP LOSS"** if structural support fails.
    *   *Exception:* Only "Repair" (Add) if a clear Phase C Spring occurs to average down responsibly.

**DECISION MATRIX (GENERAL STRUCTURE):**

*   **PHASE D (Trend):** 
    *   If Extended (far from MA50): **HOLD**. Do not Add.
    *   If Backup/Pullback (Low Vol): **ADD**.
*   **PHASE C (Setup):**
    *   Valid Spring: **BUY**.
    *   Volatile/Undefined: **WAIT**.
*   **PHASE E (Distribution):**
    *   **SELL / TRIM**.

**TARGET LOGIC: CONFLUENCE OF EVIDENCE**
Do not use a single method. Synthesize these three:
1.  **Wyckoff Count (Cause/Effect):** Range Depth projected upward.
2.  **Structural Resistance:** Previous Supply Zones (Left hand of chart).
3.  **Fibonacci/Psychology:** Extensions (1.618) if in Blue Sky (All Time High).
*   **OUTPUT:** Provide the consensus target in Bilingual Text. E.g., "150-155 (Confluence of Range Depth & Historical Supply)".

**MANDATORY RISK CALCULATION:**
Before recommending "ADD" or "BUY", you MUST mentally calculate:
1.  **Risk Distance:** % drop to the invalidation level.
2.  **Reward Potential:** % rise to the next structural target.
3.  **THE RULE:** If Risk > 7% OR Reward/Risk < 2.5, **DOWNGRADE** the recommendation to "HOLD" or "WAIT".

**SCORING RULES:**
1.  **Setup Quality (0-100):** Visual clarity of the Wyckoff Pattern.
2.  **Risk/Reward (0-100):**
    *   **< 40:** Stop is far away (Extended).
    *   **> 80:** Stop is tight (at Support/Spring).
3.  **Phase Maturity (0-100):**
    *   High = Phase D. Low = Phase A.

**OUTPUT FORMAT:**
Strict JSON only.
`;

export const SYSTEM_PROMPTS = {
  universal: WYCKOFF_SYSTEM_PROMPT_UNIVERSAL
};

export const SAMPLE_CSV = `Date,Open,High,Low,Close,Volume
2023-01-01,100,105,99,102,1000000
`;
