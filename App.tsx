import React, { useState, useEffect, useRef } from 'react';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceArea, 
  ReferenceLine,
  ResponsiveContainer,
  Area
} from 'recharts';
import { Search, Loader2, LineChart, AlertTriangle, Languages, Target, TrendingUp, Globe, ChevronDown, Clock, ExternalLink, Key, Settings, Smartphone, Download, X, Share2, Maximize2, Zap, BarChart2, Layers, Crosshair, HelpCircle, BookOpen, Scale, Hourglass, CheckCircle2, Radar, Trash2 } from 'lucide-react';
import { StockDataPoint, AnalysisResult, ZoneType, Language, Market, Interval, StockMetadata, SearchResult, HistoryItem } from './types';
import { analyzeStockData } from './services/gemini';
import { fetchStockData, searchSymbols } from './services/stockData';
import { WYCKOFF_GLOSSARY } from './constants';
import html2canvas from 'html2canvas';

// --- Configuration ---
const SITE_URL = typeof window !== 'undefined' ? window.location.host : "wyckoff-analyst.ai";
const SYSTEM_API_KEY_PRESENT = !!process.env.API_KEY; 

// --- UI Translation Dictionary ---
const translations = {
  en: {
    title: "Wyckoff AI Analyst",
    subtitle: "Institutional Grade Market Structure Analysis",
    placeholderUS: "Search Company (e.g. Nvidia) or Ticker",
    placeholderCN: "Search Code (e.g. 600519) or Name",
    placeholderFR: "Search Company (e.g. LVMH) or Ticker",
    analyze: "Analyze",
    poweredBy: "Powered by Gemini 3 Pro & Yahoo Finance Data.",
    startOver: "Start Over",
    marketEventsLog: "Market Events Log",
    loadingAnalysis: "Consulting Richard Wyckoff (Gemini 3 Pro)... Calculating probabilities...",
    fetching: "Fetching data for",
    chart: "Chart",
    errorAnalysis: "Analysis Failed",
    tryAgain: "Try Again",
    vwap: "VWAP",
    accumulation: "Accumulation",
    distribution: "Distribution",
    conviction: "Trade Conviction",
    convictionDesc: "Multi-Factor Analysis",
    futureOutlook: "Future Outlook",
    currentAnalysis: "Executive Summary",
    marketSelect: "Market",
    quickPick: "Popular Picks...",
    phase: "Current Phase",
    volume: "Volume & Spread",
    trend: "Trend Structure",
    setup: "Trade Setup",
    keyLevels: "Key Levels",
    support: "Support",
    resistance: "Resistance",
    entry: "Entry",
    stop: "Stop",
    target: "Target",
    glossary: "Wyckoff Glossary",
    factors: {
        quality: "Setup Quality",
        risk: "Risk / Reward",
        maturity: "Phase Maturity"
    },
    markets: {
      US: "US Market",
      CN: "China A-Shares",
      FR: "France (Euronext)"
    },
    intervals: {
      daily: "Daily (1D)",
      weekly: "Weekly (1W)",
      monthly: "Monthly (1M)"
    },
    apiKeyRequired: "API Key Required",
    freeMode: "Free Mode",
    proMode: "Pro Mode (Custom Key)",
    enterKey: "Enter custom Google Gemini API Key (Optional)",
    enterKeyDesc: "Note: The Free Tier has low rate limits. To avoid '429 Quota Exceeded' errors, use a key from a Google Cloud Project with Billing enabled (Pay-as-you-go).",
    getKey: "Get Key (Google AI Studio)",
    saveKey: "Save Key",
    keySaved: "API Key Saved",
    settings: "Settings",
    socialCard: "Flash Card",
    generatingSocial: "Generating Card...",
    downloadCard: "Download Image",
    changeKey: "Change Key",
    quotaExceeded: "API Quota Exceeded (429). The model is busy or your key hit the limit. Please use a custom key from a Paid Project or try again later.",
    historyTitle: "High Score Radar",
    historyDesc: "Your top conviction setups (Saved locally)",
    clearHistory: "Clear",
    noHistory: "No analysis history yet."
  },
  cn: {
    title: "威科夫 AI 分析师",
    subtitle: "机构级市场结构分析工具",
    placeholderUS: "搜索公司 (如: Nvidia) 或代码",
    placeholderCN: "搜索代码 (如: 600519) 或名称",
    placeholderFR: "搜索公司 (如: LVMH) 或代码",
    analyze: "开始分析",
    poweredBy: "由 Gemini 3 Pro 和 Yahoo Finance 提供支持。",
    startOver: "重新开始",
    marketEventsLog: "市场事件日志",
    loadingAnalysis: "正在咨询理查德·威科夫 (Gemini 3 Pro)... 正在计算概率...",
    fetching: "正在获取数据：",
    chart: "图表",
    errorAnalysis: "分析失败",
    tryAgain: "重试",
    vwap: "成交量加权平均价",
    accumulation: "吸筹",
    distribution: "派发",
    conviction: "交易确信度",
    convictionDesc: "多因子综合评分",
    futureOutlook: "未来展望",
    currentAnalysis: "执行摘要",
    marketSelect: "市场选择",
    quickPick: "热门精选...",
    phase: "当前阶段",
    volume: "量价分析",
    trend: "趋势结构",
    setup: "交易计划",
    keyLevels: "关键点位",
    support: "支撑",
    resistance: "阻力",
    entry: "入场",
    stop: "止损",
    target: "目标",
    glossary: "威科夫术语表",
    factors: {
        quality: "形态质量 (胜率)",
        risk: "盈亏比 (赔率)",
        maturity: "阶段成熟度 (时机)"
    },
    markets: {
      US: "美股市场 (US)",
      CN: "中国 A 股 (CN)",
      FR: "法国股市 (France)"
    },
    intervals: {
      daily: "日线 (1D)",
      weekly: "周线 (1W)",
      monthly: "月线 (1M)"
    },
    apiKeyRequired: "需要 API Key",
    freeMode: "免费模式",
    proMode: "专业模式 (自定义 Key)",
    enterKey: "输入自定义 Google Gemini API Key (可选)",
    enterKeyDesc: "注意：免费层级配额很低。为了避免 '429 配额耗尽' 错误，请使用绑定了计费结算 (Pay-as-you-go) 的 Google Cloud 项目 Key。",
    getKey: "获取 Key (Google AI Studio)",
    saveKey: "保存 Key",
    keySaved: "API Key 已保存",
    settings: "设置",
    socialCard: "生成闪卡",
    generatingSocial: "正在生成卡片...",
    downloadCard: "下载图片",
    changeKey: "更换 Key",
    quotaExceeded: "API 配额已耗尽 (429)。模型繁忙或 Key 达到限制。请在设置中输入付费项目 Key 或稍后再试。",
    historyTitle: "高分机会雷达",
    historyDesc: "您的历史高确信度机会 (本地保存)",
    clearHistory: "清空",
    noHistory: "暂无分析记录。"
  }
};

const POPULAR_STOCKS = {
  US: [
    { label: "NVIDIA (NVDA)", value: "NVDA" },
    { label: "Tesla (TSLA)", value: "TSLA" },
    { label: "Apple (AAPL)", value: "AAPL" },
    { label: "Bitcoin (BTC-USD)", value: "BTC-USD" },
    { label: "Gold (GC=F)", value: "GC=F" },
  ],
  CN: [
    { label: "贵州茅台 (600519)", value: "600519.SS" },
    { label: "宁德时代 (300750)", value: "300750.SZ" },
    { label: "招商银行 (600036)", value: "600036.SS" },
    { label: "比亚迪 (002594)", value: "002594.SZ" },
    { label: "上证指数 (000001.SS)", value: "000001.SS" },
  ],
  FR: [
    { label: "LVMH (MC.PA)", value: "MC.PA" },
    { label: "Soitec (SOI.PA)", value: "SOI.PA" },
    { label: "L'Oréal (OR.PA)", value: "OR.PA" },
    { label: "TotalEnergies (TTE.PA)", value: "TTE.PA" },
    { label: "Sanofi (SAN.PA)", value: "SAN.PA" },
    { label: "Airbus (AIR.PA)", value: "AIR.PA" },
  ]
};

// --- Helper Components ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-xl text-xs z-50">
        <p className="font-bold text-slate-200 mb-1">{label}</p>
        <p className="text-emerald-400">Open: {data.open.toFixed(2)}</p>
        <p className="text-emerald-400">High: {data.high.toFixed(2)}</p>
        <p className="text-rose-400">Low: {data.low.toFixed(2)}</p>
        <p className="text-slate-300">Close: {data.close.toFixed(2)}</p>
        <p className="text-violet-400">VWAP: {data.vwap?.toFixed(2)}</p>
        <p className="text-slate-500">Vol: {data.volume.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const GlossaryTooltip = ({ term, language }: { term: string, language: Language }) => {
    const definition = WYCKOFF_GLOSSARY[term.toUpperCase()];
    if (!definition) return <span className="font-bold text-indigo-400">{term}</span>;

    return (
        <div className="group relative inline-block">
             <span className="font-bold text-indigo-400 border-b border-dashed border-indigo-400/50 cursor-help">{term}</span>
             <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 border border-slate-600 p-3 rounded-lg shadow-2xl z-50 text-xs text-slate-200 pointer-events-none">
                 <div className="font-bold text-white mb-1">{term}</div>
                 {definition[language]}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
             </div>
        </div>
    );
};

const getCurrencySymbol = (currency: string) => {
    if (!currency) return '$';
    if (currency === 'EUR') return '€';
    if (currency === 'CNY') return '¥';
    if (currency === 'USD') return '$';
    return currency;
};

// --- Sub-components for Conviction Card ---
const ScoreBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200 font-mono">{value}/100</span>
        </div>
        <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
            <div 
                className={`h-full ${colorClass} transition-all duration-1000`} 
                style={{ width: `${value}%` }}
            ></div>
        </div>
    </div>
);

// --- Main App Component ---
export default function App() {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<StockDataPoint[]>([]);
  const [meta, setMeta] = useState<StockMetadata | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(''); 
  const [language, setLanguage] = useState<Language>('en');
  const [market, setMarket] = useState<Market>('US');
  const [interval, setInterval] = useState<Interval>('1d');
  
  // Search Autocomplete State
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Social Card State
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  
  const flashCardRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const t = translations[language];

  useEffect(() => {
    const storedKey = localStorage.getItem('wyckoff_api_key');
    if (storedKey) {
        setApiKey(storedKey);
    } else {
        if (!SYSTEM_API_KEY_PRESENT) {
            setShowSettings(true);
        }
    }

    if (market === 'CN') setLanguage('cn');
    if (market === 'US' || market === 'FR') setLanguage('en');

    // Load History
    try {
        const savedHistory = localStorage.getItem('wyckoff_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    } catch (e) {
        console.error("Failed to load history", e);
    }
  }, [market]);

  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const saveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('wyckoff_api_key', key);
  };

  const updateHistory = (symbol: string, price: number, result: AnalysisResult) => {
      const newItem: HistoryItem = {
          symbol: symbol,
          price: price,
          score: result.tradeConviction.score,
          direction: result.tradeConviction.direction,
          timestamp: Date.now()
      };

      setHistory(prev => {
          // Remove existing entry for this symbol to avoid duplicates
          const filtered = prev.filter(item => item.symbol !== symbol);
          // Add new item to top
          const updated = [newItem, ...filtered].slice(0, 50); // Limit to 50 items
          localStorage.setItem('wyckoff_history', JSON.stringify(updated));
          return updated;
      });
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('wyckoff_history');
  };

  const processData = async (stockData: StockDataPoint[], currentMeta: StockMetadata) => {
    setAnalysis(null);
    setWarning(null);
    setGeneratedImage(null);
    
    const localT = translations[language];

    if (!apiKey && !SYSTEM_API_KEY_PRESENT) {
        setWarning(localT.apiKeyRequired);
        setShowSettings(true);
        setLoading(false);
        return;
    }

    try {
      setStatus(localT.loadingAnalysis);
      const result = await analyzeStockData(stockData, apiKey);
      setAnalysis(result);
      
      // Save to History
      if (currentMeta && currentMeta.price) {
          updateHistory(currentMeta.symbol, currentMeta.price, result);
      }
    } catch (aiError: any) {
      console.error(aiError);
      
      const errorMessage = aiError.message || JSON.stringify(aiError);
      
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
          setWarning(localT.quotaExceeded);
      } else {
          setWarning(`${localT.errorAnalysis}: ${errorMessage.substring(0, 150)}...`);
      }
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'cn' : 'en');
  };

  const executeFetch = async (symbolToFetch: string) => {
      setLoading(true);
      setError(null);
      setWarning(null);
      setData([]);
      setMeta(null);
      setShowDropdown(false);

      if (!apiKey && !SYSTEM_API_KEY_PRESENT) {
          setShowSettings(true);
          setLoading(false);
          return;
      }

      try {
        setStatus(`${t.fetching} ${symbolToFetch.toUpperCase()}...`);
        const { data: stockData, meta: stockMeta } = await fetchStockData(symbolToFetch, market, interval);
        setData(stockData);
        setMeta(stockMeta);
        setTicker(stockMeta.symbol);
        
        // Pass meta explicitly to ensure we have it for history
        await processData(stockData, stockMeta);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch stock data');
        setLoading(false);
      }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTicker(val);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (val.length >= 2) {
          searchTimeoutRef.current = setTimeout(async () => {
              const results = await searchSymbols(val, market);
              setSearchResults(results);
              setShowDropdown(true);
          }, 400);
      } else {
          setSearchResults([]);
          setShowDropdown(false);
      }
  };

  const handleSelectResult = (result: SearchResult) => {
      setTicker(result.symbol);
      setShowDropdown(false);
      executeFetch(result.symbol);
  };

  const handleManualSearch = () => {
      if (!ticker.trim()) return;
      executeFetch(ticker);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        setShowDropdown(false);
        handleManualSearch();
    }
  };

  const handleGenerateFlashCard = async () => {
    if (!analysis || !flashCardRef.current) return;
    setGeneratingSocial(true);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await html2canvas(flashCardRef.current, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#0f172a', 
            logging: false,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.9);
        setGeneratedImage(imgData);
        setShowSocialModal(true);
    } catch (e) {
        console.error("Card generation failed", e);
        setWarning("Failed to generate image.");
    } finally {
        setGeneratingSocial(false);
    }
  };

  const downloadImage = () => {
      if (!generatedImage) return;
      const link = document.createElement('a');
      link.download = `${meta?.symbol || ticker}_Wyckoff_Analysis.jpg`;
      link.href = generatedImage;
      link.click();
  };

  const getPlaceholder = () => {
      if (market === 'US') return t.placeholderUS;
      if (market === 'CN') return t.placeholderCN;
      if (market === 'FR') return t.placeholderFR;
      return t.placeholderUS;
  };

  const getKeyStatus = () => {
      if (apiKey) return { text: t.proMode, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/50' };
      if (SYSTEM_API_KEY_PRESENT) return { text: t.freeMode, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/50' };
      return { text: t.apiKeyRequired, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/50 animate-pulse' };
  };

  const getConvictionColor = (direction: string) => {
      if (direction === 'Long') return 'text-emerald-500';
      if (direction === 'Short') return 'text-rose-500';
      return 'text-slate-400';
  };
  
  const getScoreColor = (score: number) => {
      if (score >= 75) return 'text-emerald-400';
      if (score >= 50) return 'text-blue-400';
      if (score >= 30) return 'text-yellow-400';
      return 'text-rose-400';
  };

  const keyStatus = getKeyStatus();

  // Sort history by score descending for the "Radar"
  const sortedHistory = [...history].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-emerald-500/30">
        {/* Navigation / Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                    <Zap className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight text-white leading-none">{t.title}</h1>
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">{t.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowGlossary(true)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white" title={t.glossary}>
                        <BookOpen className="w-5 h-5" />
                    </button>

                    <button 
                        onClick={() => setShowSettings(true)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${keyStatus.bg} ${keyStatus.color}`}
                    >
                        {keyStatus.text === t.apiKeyRequired ? <AlertTriangle className="w-3 h-3" /> : <Key className="w-3 h-3" />}
                        <span className="hidden sm:inline">{keyStatus.text}</span>
                    </button>

                    <button 
                        onClick={toggleLanguage}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Switch Language"
                    >
                        <Languages className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Search Section */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Market Select */}
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <select 
                                value={market}
                                onChange={(e) => setMarket(e.target.value as Market)}
                                className="appearance-none bg-slate-800 border border-slate-700 text-white pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium w-full md:w-auto cursor-pointer hover:bg-slate-750 transition-colors"
                            >
                                <option value="US">{t.markets.US}</option>
                                <option value="CN">{t.markets.CN}</option>
                                <option value="FR">{t.markets.FR}</option>
                            </select>
                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="flex-grow relative z-30">
                        <div className="relative">
                            <input
                                type="text"
                                value={ticker}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                onClick={() => { if(ticker.length >= 2) setShowDropdown(true); }}
                                placeholder={getPlaceholder()}
                                className="w-full bg-slate-800 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-500 shadow-sm"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            {ticker && (
                                <button 
                                    onClick={() => { setTicker(''); setSearchResults([]); setShowDropdown(false); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full text-slate-500 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <div 
                                        key={result.symbol}
                                        onClick={(e) => { e.stopPropagation(); handleSelectResult(result); }}
                                        className="px-4 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">{result.symbol}</div>
                                                <div className="text-xs text-slate-400">{result.shortname}</div>
                                            </div>
                                            <div className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-500 group-hover:text-emerald-400 border border-slate-700 group-hover:border-emerald-500/30">
                                                {result.exchange}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleManualSearch}
                        disabled={loading || !ticker}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LineChart className="w-5 h-5" />}
                        {loading ? '...' : t.analyze}
                    </button>
                </div>

                {/* High Score Radar (History) */}
                {history.length > 0 && (
                     <div className="mt-6 animate-in fade-in slide-in-from-top-4">
                        <div className="flex justify-between items-center mb-3 px-1">
                             <div className="flex items-center gap-2">
                                <Radar className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <span className="text-sm font-bold text-white block leading-none">{t.historyTitle}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t.historyDesc}</span>
                                </div>
                             </div>
                             <button onClick={clearHistory} className="text-xs text-slate-600 hover:text-rose-400 flex items-center gap-1 transition-colors">
                                 <Trash2 className="w-3 h-3" /> {t.clearHistory}
                             </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {sortedHistory.map((item) => (
                                <div 
                                    key={item.symbol}
                                    onClick={() => executeFetch(item.symbol)}
                                    className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 p-4 rounded-xl cursor-pointer transition-all w-40 group shadow-lg relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <span className="font-bold text-white group-hover:text-indigo-300">{item.symbol}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.direction === 'Long' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : item.direction === 'Short' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-slate-400 border-slate-600 bg-slate-700/50'}`}>
                                            {item.direction}
                                        </span>
                                    </div>
                                    
                                    <div className={`text-3xl font-black mb-1 ${getScoreColor(item.score)}`}>
                                        {item.score}
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 font-mono">
                                        {getCurrencySymbol('USD')}{item.price.toFixed(2)}
                                    </div>
                                    
                                    {/* Score Bar Background */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                         <div 
                                            className={`h-full ${item.score >= 75 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-blue-500' : 'bg-rose-500'}`} 
                                            style={{ width: `${item.score}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Picks (Only show if history is empty to guide new users) */}
                {history.length === 0 && !data.length && (
                    <div className="flex flex-wrap gap-2 items-center text-sm text-slate-400 mt-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>{t.quickPick}</span>
                        {POPULAR_STOCKS[market].map((stock) => (
                            <button
                                key={stock.value}
                                onClick={() => { setTicker(stock.value); executeFetch(stock.value); }}
                                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 rounded-full border border-slate-700 transition-all"
                            >
                                {stock.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error & Warning Display */}
            {error && (
                <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-200 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    {error}
                </div>
            )}

             {warning && (
                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 flex items-center gap-3 justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm font-medium">{warning}</span>
                    </div>
                    {/* Show Quick Action Button if it's a Quota Error */}
                    {(warning.includes("429") || warning.includes("Quota") || warning.includes("配额")) && (
                         <button 
                            onClick={() => setShowSettings(true)}
                            className="flex-shrink-0 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded-lg text-xs font-bold transition-colors border border-yellow-500/30"
                        >
                            {t.changeKey}
                        </button>
                    )}
                </div>
            )}

            {/* Status Message */}
            {status && (
                <div className="mb-8 text-center py-12 animate-pulse">
                     <div className="inline-block p-4 rounded-full bg-slate-800 mb-4">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                     </div>
                     <p className="text-slate-400 font-medium">{status}</p>
                </div>
            )}

            {/* Main Content (Chart & Analysis) */}
            {data.length > 0 && !loading && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" ref={flashCardRef}>
                    
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-3xl font-bold text-white">{meta?.symbol}</h2>
                                <span className="text-xl text-emerald-400 font-mono">
                                    {getCurrencySymbol(meta?.currency || '')}{meta?.price?.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-slate-400 mt-1">{meta?.longName} • {meta?.exchangeName}</p>
                        </div>
                        <div className="flex gap-2">
                             <button 
                                onClick={handleGenerateFlashCard}
                                disabled={generatingSocial || !analysis}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                {generatingSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                {t.socialCard}
                            </button>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
                         <div className="absolute top-4 left-6 z-10 flex gap-4 text-xs font-mono hidden md:flex">
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <div className="w-3 h-0.5 bg-emerald-400"></div> Price
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <div className="w-3 h-0.5 bg-blue-400"></div> SMA 50
                            </div>
                             <div className="flex items-center gap-1.5 text-amber-400">
                                <div className="w-3 h-0.5 bg-amber-400"></div> SMA 200
                            </div>
                            <div className="flex items-center gap-1.5 text-violet-400">
                                <div className="w-3 h-0.5 bg-violet-400"></div> VWAP
                            </div>
                        </div>

                        <div className="h-[500px] w-full mt-6">
                             <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#94a3b8" 
                                        tick={{ fontSize: 11 }} 
                                        tickFormatter={(val) => val.slice(5)} 
                                        minTickGap={30}
                                    />
                                    <YAxis 
                                        stroke="#94a3b8" 
                                        tick={{ fontSize: 11 }} 
                                        domain={['auto', 'auto']}
                                        tickFormatter={(val) => val.toFixed(1)}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    
                                    <Area type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                                    <Line type="monotone" dataKey="ma50" stroke="#60a5fa" strokeWidth={1} dot={false} />
                                    <Line type="monotone" dataKey="ma200" stroke="#fbbf24" strokeWidth={1} dot={false} />
                                    <Line type="monotone" dataKey="vwap" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                                    
                                    {/* Wyckoff Events Overlays */}
                                    {analysis?.events.map((event, idx) => (
                                        <ReferenceLine 
                                            key={idx} 
                                            x={event.date} 
                                            stroke="#f472b6" 
                                            strokeDasharray="3 3"
                                            label={{ 
                                                value: event.label, 
                                                position: 'top', 
                                                fill: '#f472b6', 
                                                fontSize: 10,
                                                fontWeight: 'bold'
                                            }} 
                                        />
                                    ))}

                                    {/* Wyckoff Zones Overlays */}
                                    {analysis?.zones.map((zone, idx) => (
                                        <ReferenceArea 
                                            key={`zone-${idx}`} 
                                            x1={zone.startDate} 
                                            x2={zone.endDate} 
                                            y1={zone.bottomPrice} 
                                            y2={zone.topPrice}
                                            fill={zone.type === 'Accumulation' ? '#10b981' : '#f43f5e'} 
                                            fillOpacity={0.15}
                                            stroke={zone.type === 'Accumulation' ? '#10b981' : '#f43f5e'}
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                            label={{ 
                                                value: `${zone.type === 'Accumulation' ? (language === 'en' ? 'ACCUMULATION' : '吸筹区') : (language === 'en' ? 'DISTRIBUTION' : '派发区')}`, 
                                                position: 'insideTop', 
                                                fill: zone.type === 'Accumulation' ? '#10b981' : '#f43f5e', 
                                                fontSize: 11,
                                                fontWeight: '900',
                                                dy: 10
                                            }} 
                                        />
                                    ))}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {analysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {/* Full Width Summary */}
                             <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Target className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{t.currentAnalysis}</h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed text-lg">
                                    {analysis.summary[language]}
                                </p>
                             </div>

                             {/* Phase Card */}
                             <div className="col-span-1 lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col">
                                <h3 className="text-slate-400 font-medium mb-4 flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> {t.phase}
                                </h3>
                                <div className="flex-grow flex flex-col justify-center">
                                    <div className="text-4xl font-black text-white mb-2 tracking-tight">
                                        {analysis.detailedAnalysis.currentPhase}
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {analysis.detailedAnalysis.phaseExplanation[language]}
                                    </p>
                                </div>
                             </div>

                             {/* Trade Conviction Card (DASHBOARD UPGRADE) */}
                             <div className="col-span-1 lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-slate-400 font-medium flex items-center gap-2 relative z-10">
                                        <Target className="w-4 h-4" /> {t.conviction}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${analysis.tradeConviction.direction === 'Long' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : analysis.tradeConviction.direction === 'Short' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-700/50 border-slate-600 text-slate-300'}`}>
                                        {analysis.tradeConviction.direction === 'Neutral' ? (language === 'en' ? 'NEUTRAL' : '中立') : analysis.tradeConviction.direction}
                                    </span>
                                </div>
                                
                                <div className="flex-grow flex flex-col gap-4">
                                    {/* Main Score Large Display */}
                                    <div className="text-center pb-2 border-b border-slate-700/50">
                                         <div className={`text-6xl font-black ${getConvictionColor(analysis.tradeConviction.direction)}`}>
                                            {analysis.tradeConviction.score}
                                            <span className="text-xl text-slate-500 font-medium ml-1">/ 100</span>
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{t.convictionDesc}</div>
                                    </div>

                                    {/* Sub Scores Dashboard */}
                                    <div className="grid grid-cols-1 gap-1">
                                        {analysis.tradeConviction.subScores && (
                                            <>
                                                <ScoreBar 
                                                    label={t.factors.quality} 
                                                    value={analysis.tradeConviction.subScores.setupQuality} 
                                                    colorClass="bg-blue-500" 
                                                />
                                                <ScoreBar 
                                                    label={t.factors.risk} 
                                                    value={analysis.tradeConviction.subScores.riskReward} 
                                                    colorClass="bg-purple-500" 
                                                />
                                                <ScoreBar 
                                                    label={t.factors.maturity} 
                                                    value={analysis.tradeConviction.subScores.phaseMaturity} 
                                                    colorClass="bg-amber-500" 
                                                />
                                            </>
                                        )}
                                    </div>
                                    
                                    <p className="text-xs text-slate-400 italic mt-auto pt-2">
                                        "{analysis.tradeConviction.reasoning[language]}"
                                    </p>
                                </div>
                             </div>

                             {/* Volume & Trend */}
                             <div className="col-span-1 lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
                                <div>
                                    <h3 className="text-slate-400 font-medium mb-1 flex items-center gap-2 text-sm">
                                        <BarChart2 className="w-4 h-4" /> {t.volume}
                                    </h3>
                                    <p className="text-slate-300 text-sm">
                                        {analysis.detailedAnalysis.volumeBehavior[language]}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-700">
                                    <h3 className="text-slate-400 font-medium mb-1 flex items-center gap-2 text-sm">
                                        <TrendingUp className="w-4 h-4" /> {t.trend}
                                    </h3>
                                    <p className="text-slate-300 text-sm">
                                        {analysis.detailedAnalysis.trendStructure[language]}
                                    </p>
                                </div>
                             </div>

                             {/* Trade Setup */}
                             <div className="col-span-1 md:col-span-2 bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                                <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
                                    <Crosshair className="w-5 h-5" /> {t.setup}
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                        <span className="text-slate-400 text-sm">{t.entry}</span>
                                        <span className="text-white font-mono font-bold text-right">{analysis.tradeSetup.entryZone}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                        <span className="text-rose-400 text-sm">{t.stop}</span>
                                        <span className="text-rose-200 font-mono text-right">{analysis.tradeSetup.stopLoss}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-400 text-sm">{t.target}</span>
                                        <span className="text-emerald-200 font-mono text-right">{analysis.tradeSetup.priceTargets}</span>
                                    </div>
                                    <div className="pt-2 text-xs text-center text-slate-500 font-mono">
                                        {analysis.tradeSetup.recommendation[language]}
                                    </div>
                                </div>
                             </div>

                             {/* Key Levels */}
                             <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 gap-4">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 h-full">
                                    <h3 className="text-slate-400 text-xs font-bold uppercase mb-3">{t.keyLevels}</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-xs text-rose-400 block mb-1">{t.resistance}</span>
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.keyLevels.resistance.map((l, i) => (
                                                    <span key={i} className="bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded text-xs font-mono">{l.toFixed(2)}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <span className="text-xs text-emerald-400 block mb-1">{t.support}</span>
                                            <div className="flex flex-wrap gap-1">
                                                {analysis.keyLevels.support.map((l, i) => (
                                                    <span key={i} className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded text-xs font-mono">{l.toFixed(2)}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* Future Outlook */}
                             <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                 <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{t.futureOutlook}</h3>
                                </div>
                                <p className="text-slate-300 leading-relaxed">
                                    {analysis.futureOutlook[language]}
                                </p>
                             </div>

                             {/* Events List with Floating Box Tooltips */}
                             <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    {t.marketEventsLog}
                                </h3>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {analysis.events.map((event, idx) => (
                                        <div key={idx} className="relative pl-4 border-l-2 border-slate-700 pb-1">
                                            <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-mono text-slate-500">{event.date}</span>
                                                <div className="text-xs">
                                                    <GlossaryTooltip term={event.label} language={language} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-300">{event.description[language]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </main>

        {/* Glossary Modal */}
        {showGlossary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[80vh] flex flex-col">
                    <button onClick={() => setShowGlossary(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-400" /> {t.glossary}
                    </h2>
                    
                    <div className="overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(WYCKOFF_GLOSSARY).map(([term, def]) => (
                            <div key={term} className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="font-bold text-emerald-400 mb-1">{term}</div>
                                <div className="text-xs text-slate-300">{def[language]}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowSettings(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">{t.settings}</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700">{t.enterKeyDesc}</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Google Gemini API Key</label>
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500/50 focus:outline-none font-mono text-sm"
                            />
                        </div>

                         <div className="flex flex-col gap-3 mt-6">
                            <button 
                                onClick={() => { saveApiKey(apiKey); setShowSettings(false); }}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                {t.saveKey}
                            </button>
                            
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {t.getKey}
                            </a>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* Social Share Modal */}
        {showSocialModal && generatedImage && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                 <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative flex flex-col items-center">
                    <button onClick={() => setShowSocialModal(false)} className="absolute right-4 top-4 text-slate-500 hover:text-white z-10">
                        <X className="w-6 h-6" />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-white mb-4">{t.socialCard}</h2>
                    
                    <div className="w-full overflow-hidden rounded-xl border border-slate-700 mb-6 bg-slate-950">
                        <img src={generatedImage} alt="Analysis Card" className="w-full h-auto object-contain max-h-[70vh]" />
                    </div>

                     <button 
                        onClick={downloadImage}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        <Download className="w-5 h-5" />
                        {t.downloadCard}
                    </button>
                 </div>
             </div>
        )}
        
        {/* Footer Ad / Watermark */}
        <footer className="max-w-7xl mx-auto px-4 py-6 text-center border-t border-slate-800 mt-12">
            <div className="flex flex-col items-center gap-2">
                <p className="text-slate-500 text-sm">{t.poweredBy}</p>
                <div className="text-xs text-slate-600">
                    Warning: AI can hallucinate. Not financial advice.
                </div>
            </div>
        </footer>
    </div>
  );
}