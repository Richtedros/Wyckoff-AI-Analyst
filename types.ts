export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma50?: number;
  ma200?: number;
  vwap?: number;
  originalDateObj?: Date; // For sorting
}

export interface StockMetadata {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  exchangeName: string;
  price?: number;
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  typeDisp: string;
}

export interface HistoryItem {
  symbol: string;
  price: number;
  score: number;
  direction: 'Long' | 'Short' | 'Neutral';
  timestamp: number;
}

export interface StockFetchResult {
  data: StockDataPoint[];
  meta: StockMetadata;
}

export enum ZoneType {
  ACCUMULATION = 'Accumulation',
  DISTRIBUTION = 'Distribution',
}

export interface BilingualText {
  en: string;
  cn: string;
}

export interface WyckoffEvent {
  date: string;
  price: number;
  label: string; // e.g., "SC", "ST" (Universal acronyms)
  description: BilingualText; // Bilingual description
}

export interface WyckoffZone {
  type: ZoneType;
  startDate: string;
  endDate: string;
  topPrice: number;
  bottomPrice: number;
  phaseLabel: BilingualText; // Bilingual phase label
}

export interface DetailedAnalysis {
  currentPhase: string; // e.g. "Phase C"
  phaseExplanation: BilingualText;
  volumeBehavior: BilingualText; // Analysis of effort vs result
  trendStructure: BilingualText; // Analysis of market structure (HH/HL)
}

export interface TradeSetup {
  recommendation: BilingualText; // "Long Bias", "Short Bias", "Wait"
  entryZone: string;
  stopLoss: string;
  priceTargets: string;
}

export interface KeyLevels {
  support: number[];
  resistance: number[];
}

export interface ConvictionSubScores {
  setupQuality: number; // 0-100: How textbook is the pattern?
  riskReward: number;   // 0-100: Is R:R favorable?
  phaseMaturity: number;// 0-100: Is it Phase C/D (High) or A/B (Low)?
}

export interface TradeConviction {
  direction: 'Long' | 'Short' | 'Neutral';
  score: number; // 0-100 Weighted Average
  subScores: ConvictionSubScores; // NEW: Granular breakdown
  reasoning: BilingualText;
}

export interface AnalysisResult {
  summary: BilingualText; 
  detailedAnalysis: DetailedAnalysis;
  keyLevels: KeyLevels;
  tradeSetup: TradeSetup;
  tradeConviction: TradeConviction;
  futureOutlook: BilingualText;
  events: WyckoffEvent[];
  zones: WyckoffZone[];
}

export interface CsvParseResult {
  data: StockDataPoint[];
  symbol?: string;
  error?: string;
}

export type Language = 'en' | 'cn';
export type Market = 'US' | 'CN' | 'FR';
export type Interval = '1d' | '1wk' | '1mo';