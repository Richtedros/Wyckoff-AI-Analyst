
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
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Search, Loader2, LineChart, AlertTriangle, Languages, Target, TrendingUp, Globe, ChevronDown, Clock, ExternalLink, Key, Settings, Smartphone, Download, X, Share2, Maximize2, Zap, BarChart2, Layers, Crosshair, HelpCircle, BookOpen, Scale, Hourglass, CheckCircle2, Radar, Trash2, List, PlusCircle, RefreshCw, Eye, Play, Cpu, Wallet, Binoculars, Pencil, Save, Plus, MessageSquare, Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { StockDataPoint, AnalysisResult, ZoneType, Language, Market, Interval, StockMetadata, SearchResult, HistoryItem, WatchlistItem, ChatMessage } from './types';
import { analyzeStockData } from './services/gemini';
import { fetchStockData, searchSymbols, fetchBatchQuotes } from './services/stockData';
import { WYCKOFF_GLOSSARY, MODELS, DEFAULT_MODEL } from './constants';
import html2canvas from 'html2canvas';

// --- Configuration ---
const SITE_URL = typeof window !== 'undefined' ? window.location.host : "wyckoff-analyst.ai";
// Safely check for process.env
const SYSTEM_API_KEY_PRESENT = typeof process !== 'undefined' && process.env && !!process.env.API_KEY; 

// --- Initial Portfolio Data ---
// Seed data with Portfolio items (Cost > 0) and Momentum Watchlist items (Cost = 0)
const INITIAL_WATCHLIST: WatchlistItem[] = [
  // Portfolio (Holdings)
  { id: 'nvo', symbol: 'NVO', market: 'US', costBasis: 49.06, currency: 'USD', addedAt: Date.now() },
  { id: 'ttd', symbol: 'TTD', market: 'US', costBasis: 38.52, currency: 'USD', addedAt: Date.now() },
  { id: 'omda', symbol: 'OMDA', market: 'US', costBasis: 15.54, currency: 'USD', addedAt: Date.now() },
  { id: 'smci', symbol: 'SMCI', market: 'US', costBasis: 30.18, currency: 'USD', addedAt: Date.now() },
  { id: 'mstr', symbol: 'MSTR', market: 'US', costBasis: 156.69, currency: 'USD', addedAt: Date.now() },
  { id: 'onwd', symbol: 'ONWD.BR', market: 'EU', costBasis: 4.42, currency: 'EUR', addedAt: Date.now() },
  { id: 'soi', symbol: 'SOI.PA', market: 'EU', costBasis: 25.61, currency: 'EUR', addedAt: Date.now() },
  
  // Watchlist (Momentum / Observation) - Cost Basis 0
  { id: 'abcl', symbol: 'ABCL', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'clpt', symbol: 'CLPT', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'axti', symbol: 'AXTI', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'ses', symbol: 'SES', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'root', symbol: 'ROOT', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'spir', symbol: 'SPIR', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'onds', symbol: 'ONDS', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'oust', symbol: 'OUST', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'dlo', symbol: 'DLO', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
  { id: 'sei', symbol: 'SEI', market: 'US', costBasis: 0, currency: 'USD', addedAt: Date.now() },
];

// --- UI Translation Dictionary ---
const translations = {
  en: {
    title: "Wyckoff AI Analyst",
    subtitle: "Institutional Grade Market Structure Analysis",
    placeholderUS: "Search Company (e.g. Nvidia) or Ticker",
    placeholderCN: "Search Code (e.g. 600519) or Name",
    placeholderEU: "Search Company (e.g. ASML, SAP) or Ticker",
    analyze: "Deep Analysis (Pro)",
    poweredBy: "Powered by Gemini 3 Pro & Yahoo Finance Data.",
    startOver: "Start Over",
    marketEventsLog: "Market Events Log",
    loadingAnalysis: "Consulting Richard Wyckoff (Pro Model)... Calculating probabilities...",
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
    duration: "Est. Duration",
    glossary: "Wyckoff Glossary",
    factors: {
        quality: "Setup Quality",
        risk: "Risk / Reward",
        maturity: "Phase Maturity"
    },
    markets: {
      US: "US Market",
      CN: "China A-Shares",
      EU: "Europe Market"
    },
    intervals: {
      min15: "15 Min (Intraday)",
      hour1: "1 Hour (Swing)",
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
    modelSelection: "Analysis Model (Single Search)",
    socialCard: "Flash Card",
    generatingSocial: "Generating Card...",
    downloadCard: "Download Image",
    changeKey: "Change Key",
    quotaExceeded: "API Quota Exceeded (429). The model is busy or your key hit the limit. Please use a custom key from a Paid Project or try again later.",
    historyTitle: "High Score Radar",
    historyDesc: "Your top conviction setups (Saved locally)",
    clearHistory: "Clear",
    noHistory: "No analysis history yet.",
    tabSearch: "New Analysis",
    tabPortfolio: "Portfolio",
    tabWatchlist: "Watchlist",
    addToWatchlist: "Add to Watchlist",
    removeFromWatchlist: "Remove",
    costBasis: "Cost Basis",
    currentPrice: "Price",
    pnl: "P&L",
    status: "Pattern Status",
    action: "Action",
    lastUpdated: "Last Updated",
    emptyWatchlist: "Your list is empty.",
    addCost: "Set Cost",
    updateAnalysis: "Update",
    updateAll: "Flash Scan All",
    portfolio: "Portfolio (Holdings)",
    watching: "Watchlist (Momentum)",
    addAsset: "Add Asset",
    addSymbol: "Add Symbol",
    editCost: "Edit Cost Basis",
    save: "Save",
    cancel: "Cancel",
    symbol: "Symbol",
    market: "Market",
    actionAdvice: {
        buy: "BUY / ADD",
        sell: "SELL / EXIT",
        hold: "HOLD",
        trim: "TRIM / TAKE PROFIT",
        stop: "STOP LOSS ALERT",
        wait: "WAIT"
    },
    chat: {
      title: "与威科夫对话",
      placeholder: "提问或粘贴截图 (Ctrl+V)...",
      send: "发送",
      welcome: "我已经阅读了盘口。关于这个结构，你有什么想问的？"
    }
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
  EU: [
    { label: "ASML (ASML.AS)", value: "ASML.AS" },
    { label: "SAP (SAP.DE)", value: "SAP.DE" },
    { label: "LVMH (MC.PA)", value: "MC.PA" },
    { label: "Novo Nordisk (NOVO-B.CO)", value: "NOVO-B.CO" },
    { label: "Ferrari (RACE.MI)", value: "RACE.MI" },
    { label: "AstraZeneca (AZN.L)", value: "AZN.L" },
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
    if (currency === 'GBP') return '£';
    if (currency === 'CHF') return '₣';
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

// --- Chat Component ---
const ChatComponent = ({ 
  apiKey, 
  analysisContext, 
  language 
}: { 
  apiKey: string, 
  analysisContext: AnalysisResult | null, 
  language: Language 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachment, setAttachment] = useState<{ mimeType: string; data: string } | null>(null);
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const t = translations[language];

    // Initialize Chat Session when context changes
    useEffect(() => {
        if (!apiKey || !analysisContext) return;
        
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            const systemPrompt = `
            You are Richard D. Wyckoff, the legendary stock market analyst from the 1930s.
            
            CONTEXT:
            You have just performed a deep technical analysis on a stock. The JSON summary is provided below.
            
            ANALYSIS_JSON:
            ${JSON.stringify(analysisContext)}

            YOUR TASK:
            Answer the user's follow-up questions about this specific stock.
            - Maintain the persona of a wise, disciplined tape reader.
            - Use Wyckoff terminology (Spring, Creek, Ice, Cause/Effect) correctly.
            - Be concise. Do not write long paragraphs.
            - If the user asks in Chinese, reply in Chinese. If English, reply in English.
            - The user might send images (charts). Analyze them if provided.
            `;

            const chat = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction: systemPrompt,
                }
            });

            setChatSession(chat);
            setMessages([{
                role: 'model',
                text: t.chat.welcome,
                timestamp: Date.now()
            }]);
        } catch (e) {
            console.error("Failed to init chat", e);
        }
    }, [analysisContext, apiKey, language]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, attachment]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Extract base64 data part
            const base64Data = base64String.split(',')[1];
            setAttachment({
                mimeType: file.type,
                data: base64Data
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) processFile(blob);
                e.preventDefault(); // Prevent pasting the image file name into text input
                break;
            }
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !attachment) || !chatSession) return;
        
        const userMsgText = input.trim();
        const currentAttachment = attachment;
        
        // Reset Inputs
        setInput('');
        setAttachment(null);
        
        // Add User Message
        const newMessages = [...messages, { 
            role: 'user', 
            text: userMsgText, 
            image: currentAttachment ? `data:${currentAttachment.mimeType};base64,${currentAttachment.data}` : undefined,
            timestamp: Date.now() 
        } as ChatMessage];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            // Construct Payload
            const parts: any[] = [];
            if (userMsgText) {
                parts.push({ text: userMsgText });
            }
            if (currentAttachment) {
                parts.push({ inlineData: { mimeType: currentAttachment.mimeType, data: currentAttachment.data } });
            }

            // Stream response
            let fullResponse = "";
            const result = await chatSession.sendMessageStream({ message: parts });
            
            // Temporary placeholder for streaming
            setMessages(prev => [...prev, { role: 'model', text: "", timestamp: Date.now() }]);

            for await (const chunk of result) {
                const c = chunk as GenerateContentResponse;
                const textChunk = c.text;
                if (textChunk) {
                    fullResponse += textChunk;
                    // Update last message with accumulating text
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { 
                            ...updated[updated.length - 1], 
                            text: fullResponse 
                        };
                        return updated;
                    });
                }
            }
        } catch (e) {
            console.error("Chat error", e);
            setMessages(prev => [...prev, { role: 'model', text: "Error: Could not read the tape. Please try again.", timestamp: Date.now() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!analysisContext) return null;

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl mt-8">
            <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white">{t.chat.title}</h3>
            </div>
            
            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-slate-900/30">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.image && (
                            <div className="mb-2 max-w-[80%] rounded-xl overflow-hidden border border-slate-600">
                                <img src={msg.image} alt="User Upload" className="max-h-60 w-auto object-contain bg-slate-950" />
                            </div>
                        )}
                        {msg.text && (
                            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                            }`}>
                                {msg.text}
                            </div>
                        )}
                        {!msg.text && msg.role === 'model' && (
                             <span className="animate-pulse text-indigo-400 text-xs mt-1">Reading tape...</span>
                        )}
                    </div>
                ))}
                {isTyping && messages[messages.length-1].role === 'user' && (
                     <div className="flex justify-start">
                        <div className="bg-slate-700 text-slate-200 rounded-xl rounded-bl-none px-4 py-3 text-sm border border-slate-600 flex gap-1 items-center">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-800 border-t border-slate-700">
                {attachment && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-slate-900 rounded-lg w-fit border border-slate-600 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                            <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-slate-300">Image attached</span>
                        <button onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white ml-1">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
                
                <div className="relative flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-colors"
                        title="Attach Image"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={t.chat.placeholder}
                        className="flex-grow bg-slate-900 border border-slate-700 text-white pl-4 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isTyping}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !attachment) || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'portfolio' | 'watchlist'>('search');
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
  
  // API Key & Model State
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Watchlist State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [refreshingWatchlist, setRefreshingWatchlist] = useState(false);

  // Add Asset / Edit Cost State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);
  const [editCostValue, setEditCostValue] = useState('');
  
  const [addSymbol, setAddSymbol] = useState('');
  const [addMarket, setAddMarket] = useState<Market>('US');
  const [addCost, setAddCost] = useState('');
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  
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
    
    // Load Model Preference
    const storedModel = localStorage.getItem('wyckoff_model');
    if (storedModel) {
        setSelectedModel(storedModel);
    }

    if (market === 'CN') setLanguage('cn');
    if (market === 'US' || market === 'EU') setLanguage('en');

    // Load History
    try {
        const savedHistory = localStorage.getItem('wyckoff_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    } catch (e) {
        console.error("Failed to load history", e);
    }
    
    // Load Watchlist
    try {
        const savedWatchlist = localStorage.getItem('wyckoff_watchlist');
        if (savedWatchlist) {
            setWatchlist(JSON.parse(savedWatchlist));
        } else {
            // Seed initial portfolio
            setWatchlist(INITIAL_WATCHLIST);
            localStorage.setItem('wyckoff_watchlist', JSON.stringify(INITIAL_WATCHLIST));
        }
    } catch (e) {
        console.error("Failed to load watchlist", e);
    }
  }, [market]);

  // --- Auto-Refresh Prices Effect ---
  useEffect(() => {
    const refreshPrices = async () => {
        if (watchlist.length === 0) return;
        
        // Extract symbols and markets for batch fetch
        const symbols = watchlist.map(w => w.symbol);
        const marketMap = watchlist.reduce((acc, curr) => {
            acc[curr.symbol] = curr.market;
            return acc;
        }, {} as Record<string, Market>);

        try {
            // Fetch batch quotes (fast)
            const prices = await fetchBatchQuotes(symbols, marketMap);
            
            // Update state with fresh prices
            setWatchlist(prev => {
                const updated = prev.map(item => {
                    const freshPrice = prices[item.symbol];
                    if (freshPrice !== undefined) {
                        return { ...item, currentPrice: freshPrice };
                    }
                    return item;
                });
                
                // Only save to local storage if prices actually changed to avoid thrashing,
                // but for simplicity/reliability we save here to ensure next reload is closer to truth.
                localStorage.setItem('wyckoff_watchlist', JSON.stringify(updated));
                return updated;
            });
        } catch (e) {
            console.error("Auto-refresh prices failed", e);
        }
    };

    // Run on mount and when watchlist structure changes (length)
    refreshPrices();

    // Optional: Set up interval for every 60 seconds
    const intervalId = setInterval(refreshPrices, 60000);
    return () => clearInterval(intervalId);
  }, [watchlist.length]); // Dependency on length ensures we re-subscribe if user adds item

  useEffect(() => {
    const handleClick = () => setShowDropdown(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const saveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('wyckoff_api_key', key);
  };
  
  const saveModelPreference = (model: string) => {
      setSelectedModel(model);
      localStorage.setItem('wyckoff_model', model);
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

  const updateWatchlistAnalysis = (symbol: string, result: AnalysisResult, currentPrice: number, currency: string) => {
      setWatchlist(prev => {
          const updated = prev.map(item => {
              if (item.symbol === symbol) {
                  return {
                      ...item,
                      currentPrice: currentPrice,
                      currency: currency,
                      isLoading: false,
                      lastAnalysis: {
                          score: result.tradeConviction.score,
                          direction: result.tradeConviction.direction,
                          recommendation: result.tradeSetup.recommendation,
                          target: result.tradeSetup.priceTargets, // Changed to BilingualText
                          stopLoss: result.tradeSetup.stopLoss,
                          entryZone: result.tradeSetup.entryZone, // Store Entry Zone
                          timestamp: Date.now(),
                          phase: result.detailedAnalysis.currentPhase,
                          // Store Action and Reasoning
                          action: result.tradeSetup.positionManagement?.action,
                          managementAdvice: result.tradeSetup.positionManagement?.reasoning
                      }
                  };
              }
              return item;
          });
          localStorage.setItem('wyckoff_watchlist', JSON.stringify(updated));
          return updated;
      });
  };
  
  const addToWatchlist = (symbol: string, market: Market, costBasis: number, currency: string) => {
      const exists = watchlist.find(item => item.symbol === symbol);
      if (exists) {
        setWarning(`${symbol} is already in your watchlist.`);
        return;
      }
      
      const newItem: WatchlistItem = {
          id: Date.now().toString(),
          symbol: symbol,
          market: market,
          costBasis: costBasis, 
          addedAt: Date.now(),
          currentPrice: costBasis, // Initialize with cost basis as current price (usually current price is passed)
          currency: currency
      };
      
      // If we have analysis currently loaded, add it too
      if (analysis && meta?.symbol === symbol) {
          newItem.lastAnalysis = {
              score: analysis.tradeConviction.score,
              direction: analysis.tradeConviction.direction,
              recommendation: analysis.tradeSetup.recommendation,
              target: analysis.tradeSetup.priceTargets, // Changed to BilingualText
              stopLoss: analysis.tradeSetup.stopLoss,
              entryZone: analysis.tradeSetup.entryZone, // Store Entry Zone
              timestamp: Date.now(),
              phase: analysis.detailedAnalysis.currentPhase,
              action: analysis.tradeSetup.positionManagement?.action,
              managementAdvice: analysis.tradeSetup.positionManagement?.reasoning
          };
      }
      
      const updated = [...watchlist, newItem];
      setWatchlist(updated);
      localStorage.setItem('wyckoff_watchlist', JSON.stringify(updated));
  };
  
  const removeFromWatchlist = (id: string) => {
      const updated = watchlist.filter(item => item.id !== id);
      setWatchlist(updated);
      localStorage.setItem('wyckoff_watchlist', JSON.stringify(updated));
  };

  const handleAddAsset = async () => {
    if(!addSymbol) return;
    setIsAddingAsset(true);
    setWarning(null);
    try {
        // Fetch basic data to validate and get meta
        const { meta: stockMeta } = await fetchStockData(addSymbol, addMarket, '1d');
        
        const costNum = parseFloat(addCost);
        // If user didn't enter cost, use current price
        const finalCost = isNaN(costNum) ? (stockMeta.price || 0) : costNum;
        // Logic check: If active tab is Portfolio, user likely meant to add cost basis even if they left it 0,
        // but for now, we rely on the input value.
        // If active tab is Watchlist, force cost to 0 if empty.
        
        addToWatchlist(stockMeta.symbol, addMarket, finalCost, stockMeta.currency);
        
        // Reset and close
        setAddSymbol('');
        setAddCost('');
        setShowAddModal(false);
    } catch(e) {
        setWarning("Could not validate symbol. Please check spelling or market.");
    } finally {
        setIsAddingAsset(false);
    }
  };

  const handleUpdateCost = () => {
    if(!editItem) return;
    const newCost = parseFloat(editCostValue);
    if(isNaN(newCost)) return;

    setWatchlist(prev => {
        const updated = prev.map(item => 
            item.id === editItem.id ? { ...item, costBasis: newCost } : item
        );
        localStorage.setItem('wyckoff_watchlist', JSON.stringify(updated));
        return updated;
    });
    setShowEditModal(false);
    setEditItem(null);
  };

  const openEditModal = (item: WatchlistItem) => {
      setEditItem(item);
      setEditCostValue(item.costBasis.toString());
      setShowEditModal(true);
  };

  const processData = async (stockData: StockDataPoint[], currentMeta: StockMetadata, isWatchlistUpdate = false, customCostBasis?: number, modelOverride?: string) => {
    // Only clear analysis if this is a main dashboard search
    if (!isWatchlistUpdate) {
        setAnalysis(null);
        setWarning(null);
        setGeneratedImage(null);
    }
    
    const localT = translations[language];

    if (!apiKey && !SYSTEM_API_KEY_PRESENT) {
        setWarning(localT.apiKeyRequired);
        setShowSettings(true);
        setLoading(false);
        return;
    }

    try {
      if (!isWatchlistUpdate) setStatus(localT.loadingAnalysis);
      
      // Pass cost basis context if available, and use Override or Selected Model
      const context = customCostBasis ? { costBasis: customCostBasis } : undefined;
      const modelToUse = modelOverride || selectedModel;
      
      const result = await analyzeStockData(stockData, apiKey, context, modelToUse);
      
      if (!isWatchlistUpdate) {
          setAnalysis(result);
          // Save to History
          if (currentMeta && currentMeta.price) {
              updateHistory(currentMeta.symbol, currentMeta.price, result);
          }
      }
      
      // If this symbol is in watchlist, update it
      const watchlistMatch = watchlist.find(w => w.symbol === currentMeta.symbol);
      if (watchlistMatch || isWatchlistUpdate) {
          updateWatchlistAnalysis(currentMeta.symbol, result, currentMeta.price || 0, currentMeta.currency);
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
      if (!isWatchlistUpdate) {
        setLoading(false);
        setStatus('');
      }
    }
  };
  
  const refreshWatchlistItem = async (item: WatchlistItem) => {
      // Set single item loading state
      setWatchlist(prev => prev.map(w => w.id === item.id ? { ...w, isLoading: true } : w));
      
      try {
          const { data: stockData, meta: stockMeta } = await fetchStockData(item.symbol, item.market, '1d');
          // Use FLASH for quick refresh in watchlist, or use currently selected? 
          // Let's use FLASH for speed in watchlist context unless specified otherwise
          await processData(stockData, stockMeta, true, item.costBasis, MODELS.FLASH.id);
      } catch (e) {
          console.error(`Failed to refresh ${item.symbol}`, e);
          // Reset loading state if error
          setWatchlist(prev => prev.map(w => w.id === item.id ? { ...w, isLoading: false } : w));
      }
  };

  const handleUpdateAll = async () => {
    // Determine which items to update based on active tab
    // If user is on 'portfolio' tab, update portfolio items. 
    // If on 'watchlist' tab, update watchlist items.
    
    let itemsToUpdate: WatchlistItem[] = [];
    if (activeTab === 'portfolio') {
        itemsToUpdate = watchlist.filter(w => w.costBasis > 0);
    } else if (activeTab === 'watchlist') {
        itemsToUpdate = watchlist.filter(w => !w.costBasis || w.costBasis === 0);
    }

    if (refreshingWatchlist || itemsToUpdate.length === 0) return;
    setRefreshingWatchlist(true);
    setWarning(null); // Clear previous warnings

    const FLASH_MODEL = MODELS.FLASH.id;

    // Sequential update to avoid rate limits
    for (const item of itemsToUpdate) {
        try {
            // Update UI to show this item is loading
            setWatchlist(prev => prev.map(w => w.id === item.id ? { ...w, isLoading: true } : w));
            
            const { data: stockData, meta: stockMeta } = await fetchStockData(item.symbol, item.market, '1d');
            
            // Explicitly pass FLASH model ID for batch updates
            await processData(stockData, stockMeta, true, item.costBasis, FLASH_MODEL);
            
            // Small delay to be gentle on rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
            console.error(`Batch update failed for ${item.symbol}`, e);
             setWatchlist(prev => prev.map(w => w.id === item.id ? { ...w, isLoading: false } : w));
        }
    }
    setRefreshingWatchlist(false);
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
      setActiveTab('search');

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
        
        // If in watchlist, grab cost basis. 
        // NOTE: For Main Analysis, we use the User Selected Model (Default: Pro)
        const watchlistItem = watchlist.find(w => w.symbol === stockMeta.symbol);
        await processData(stockData, stockMeta, false, watchlistItem?.costBasis, selectedModel);
        
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
      if (market === 'EU') return t.placeholderEU;
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

  const getActionColor = (action?: string) => {
      if (!action) return 'bg-slate-700 text-slate-300';
      const a = action.toLowerCase();
      if (a.includes('buy') || a.includes('add')) return 'bg-emerald-500 text-white animate-pulse';
      if (a.includes('sell') || a.includes('stop')) return 'bg-rose-500 text-white animate-pulse';
      if (a.includes('trim')) return 'bg-amber-500 text-white';
      return 'bg-blue-500 text-white';
  };

  const keyStatus = getKeyStatus();

  // Sort history by score descending for the "Radar"
  const sortedHistory = [...history].sort((a, b) => b.score - a.score);

  // Group Watchlist
  const portfolioItems = watchlist.filter(w => w.costBasis > 0);
  const watchOnlyItems = watchlist.filter(w => !w.costBasis || w.costBasis === 0);

  const WatchlistSection = ({ items, title, icon: Icon }: { items: WatchlistItem[], title: string, icon: any }) => (
      <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">{title}</h3>
              <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {items.map(item => {
                  const pnlPercent = item.currentPrice && item.costBasis 
                      ? ((item.currentPrice - item.costBasis) / item.costBasis) * 100 
                      : 0;
                  
                  return (
                      <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-indigo-500/10 transition-shadow relative overflow-hidden group">
                          {item.isLoading && (
                              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                    <span className="text-xs text-indigo-200 font-mono animate-pulse">Scanning...</span>
                                  </div>
                              </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
                                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{item.market}</span>
                                  </div>
                                  {item.lastAnalysis && (
                                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                          <span>{item.lastAnalysis.phase}</span>
                                          <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                          <span>{new Date(item.lastAnalysis.timestamp).toLocaleDateString()}</span>
                                      </div>
                                  )}
                              </div>
                              <div className="text-right">
                                    <div className="text-2xl font-mono font-bold text-white">
                                        {item.currentPrice ? item.currentPrice.toFixed(2) : '-.--'}
                                    </div>
                                    {item.costBasis > 0 && (
                                        <div className={`text-sm font-bold ${pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                        </div>
                                    )}
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-slate-900/50 p-3 rounded-lg">
                              {/* Left Column: Cost Basis OR Suggested Entry */}
                              <div>
                                  {item.costBasis > 0 ? (
                                    <>
                                        <span className="text-slate-500 block text-xs mb-1">{t.costBasis}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-200">{item.costBasis.toFixed(2)}</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                                className="text-slate-500 hover:text-white transition-colors p-1"
                                                title={t.editCost}
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </>
                                  ) : (
                                    <>
                                        <span className="text-emerald-500/80 block text-xs mb-1 font-bold flex items-center gap-1">
                                            <Crosshair className="w-3 h-3" /> {t.entry}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-emerald-300 font-medium">
                                                {item.lastAnalysis?.entryZone || '-'}
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                                className="text-slate-500 hover:text-white transition-colors p-1"
                                                title="Set Cost Basis (Move to Portfolio)"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </>
                                  )}
                              </div>

                              {/* Right Column: Target OR Stop Loss (for Watchlist) */}
                              <div>
                                  {item.costBasis > 0 ? (
                                    <>
                                        <span className="text-slate-500 block text-xs mb-1">{t.target}</span>
                                        <span className="font-mono text-emerald-300">
                                            {item.lastAnalysis?.target 
                                                ? (typeof item.lastAnalysis.target === 'string' ? item.lastAnalysis.target : item.lastAnalysis.target[language]) 
                                                : '-'}
                                        </span>
                                    </>
                                  ) : (
                                    <>
                                        <span className="text-rose-500/80 block text-xs mb-1 font-bold">
                                            {t.stop}
                                        </span>
                                        <span className="font-mono text-rose-300 font-medium">
                                            {item.lastAnalysis?.stopLoss || '-'}
                                        </span>
                                    </>
                                  )}
                              </div>
                              
                              {/* New Action / Advice Section */}
                              <div className="col-span-2 border-t border-slate-700/50 pt-3 mt-2">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="text-slate-500 text-xs">{t.status}</span>
                                      {item.lastAnalysis ? (
                                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.lastAnalysis.score >= 70 ? 'bg-emerald-500/10 text-emerald-400' : item.lastAnalysis.score >= 50 ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                              {item.lastAnalysis.score}/100 {item.lastAnalysis.direction}
                                          </span>
                                      ) : (
                                          <span className="text-xs text-slate-600">Pending Scan</span>
                                      )}
                                  </div>
                                  
                                  {/* Personalized Action Display - Enhanced Layout */}
                                  {item.lastAnalysis?.action && (
                                      <div className="flex flex-col gap-2 mt-2 bg-slate-900/60 p-4 rounded-lg border border-slate-700 shadow-inner">
                                          <div className={`self-start px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getActionColor(item.lastAnalysis.action)}`}>
                                              {item.lastAnalysis.action}
                                          </div>
                                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line break-words">
                                              {item.lastAnalysis.managementAdvice ? item.lastAnalysis.managementAdvice[language] : ""}
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4 opacity-100 lg:opacity-50 lg:group-hover:opacity-100 transition-opacity">
                              <button 
                                  onClick={() => refreshWatchlistItem(item)}
                                  disabled={refreshingWatchlist || item.isLoading}
                                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  <RefreshCw className="w-4 h-4" />
                                  {t.updateAnalysis}
                              </button>
                              <button 
                                  onClick={() => {
                                      setTicker(item.symbol);
                                      setMarket(item.market);
                                      setActiveTab('search');
                                      executeFetch(item.symbol); // Switches to Pro tab
                                  }}
                                  className="px-3 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                                  title="Deep Analysis (Pro)"
                              >
                                  <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={() => removeFromWatchlist(item.id)}
                                  className="px-3 py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"
                                  title={t.removeFromWatchlist}
                              >
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
  );

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

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 mt-6">
            <div className="flex border-b border-slate-700 gap-1 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'search' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <Search className="w-4 h-4" /> {t.tabSearch}
                </button>
                <button 
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'portfolio' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <Wallet className="w-4 h-4" /> {t.tabPortfolio}
                    {portfolioItems.length > 0 && <span className="ml-1 bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-emerald-400">{portfolioItems.length}</span>}
                </button>
                <button 
                    onClick={() => setActiveTab('watchlist')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'watchlist' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    <Binoculars className="w-4 h-4" /> {t.tabWatchlist}
                    {watchOnlyItems.length > 0 && <span className="ml-1 bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-emerald-400">{watchOnlyItems.length}</span>}
                </button>
            </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
            
            {activeTab === 'search' && (
                <>
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
                                    <option value="EU">{t.markets.EU}</option>
                                </select>
                                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Interval Select - NEW */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <select 
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value as Interval)}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-white pl-4 pr-10 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium w-full md:w-auto cursor-pointer hover:bg-slate-750 transition-colors"
                                >
                                    <option value="15m">{t.intervals.min15}</option>
                                    <option value="1h">{t.intervals.hour1}</option>
                                    <option value="1d">{t.intervals.daily}</option>
                                    <option value="1wk">{t.intervals.weekly}</option>
                                    <option value="1mo">{t.intervals.monthly}</option>
                                </select>
                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                </div>

                {/* ERROR BANNER ADDED HERE */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                )}
                {/* WARNING BANNER */}
                {warning && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{warning}</p>
                        <button onClick={() => setWarning(null)} className="ml-auto hover:text-white transition-colors"><X className="w-4 h-4" /></button>
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
                                    <span className="text-xs bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-mono border border-indigo-700/50">
                                        {interval.toUpperCase()}
                                    </span>
                                </div>
                                <p className="text-slate-400 mt-1">{meta?.longName} • {meta?.exchangeName}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => addToWatchlist(meta?.symbol || '', market, meta?.price || 0, meta?.currency || 'USD')}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium border border-slate-600"
                                >
                                    {watchlist.some(w => w.symbol === meta?.symbol) ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <PlusCircle className="w-4 h-4" />}
                                    {watchlist.some(w => w.symbol === meta?.symbol) ? "Saved" : t.addToWatchlist}
                                </button>
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
                            {/* ... (Existing chart logic remains the same) ... */}
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
                                            tickFormatter={(val) => {
                                                // Shorten date for chart based on format
                                                if (val.includes(' ')) return val.split(' ')[1]; // Return time for intraday
                                                return val.slice(5); // Return MM-DD for daily
                                            }} 
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

                        {/* AI Analysis Section - Restored full content */}
                        {analysis && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Conviction Card */}
                                <div className="col-span-1 bg-slate-800 border border-slate-700 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-10 -mt-10 group-hover:bg-indigo-500/20 transition-colors"></div>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Radar className="w-5 h-5 text-indigo-400" />
                                        <h3 className="font-bold text-white">{t.conviction}</h3>
                                        <span title={t.convictionDesc} className="cursor-help flex items-center">
                                            <HelpCircle className="w-3 h-3 text-slate-500" />
                                        </span>
                                    </div>
                                    <div className="text-center mb-6">
                                        <div className="text-5xl font-black mb-2 tracking-tighter text-white">
                                            {analysis.tradeConviction.score}
                                            <span className="text-base text-slate-500 font-medium ml-1">/100</span>
                                        </div>
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getConvictionColor(analysis.tradeConviction.direction)} bg-slate-900`}>
                                            {analysis.tradeConviction.direction}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <ScoreBar label={t.factors.quality} value={analysis.tradeConviction.subScores.setupQuality} colorClass="bg-emerald-500" />
                                        <ScoreBar label={t.factors.risk} value={analysis.tradeConviction.subScores.riskReward} colorClass="bg-blue-500" />
                                        <ScoreBar label={t.factors.maturity} value={analysis.tradeConviction.subScores.phaseMaturity} colorClass="bg-purple-500" />
                                    </div>
                                </div>

                                {/* Full Width Summary */}
                                <div className="col-span-1 md:col-span-1 lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col justify-center">
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

                                {/* Detailed Phase Analysis */}
                                <div className="col-span-1 md:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> {t.phase}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border-l-4 border-emerald-500">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-emerald-400 font-bold">{analysis.detailedAnalysis.currentPhase}</span>
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                {analysis.detailedAnalysis.phaseExplanation[language]}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-slate-900/30 p-4 rounded-xl">
                                                <h4 className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                                                    <BarChart2 className="w-3 h-3" /> {t.volume}
                                                </h4>
                                                <p className="text-sm text-slate-300">{analysis.detailedAnalysis.volumeBehavior[language]}</p>
                                            </div>
                                            <div className="bg-slate-900/30 p-4 rounded-xl">
                                                <h4 className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" /> {t.trend}
                                                </h4>
                                                <p className="text-sm text-slate-300">{analysis.detailedAnalysis.trendStructure[language]}</p>
                                            </div>
                                        </div>
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
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                            <span className="text-emerald-400 text-sm">{t.target}</span>
                                            <span className="text-emerald-200 font-mono text-right">{analysis.tradeSetup.priceTargets[language]}</span>
                                        </div>
                                        
                                        {/* If we have specific Action Advice for this symbol in watchlist */}
                                        {analysis.tradeSetup.positionManagement && (
                                            <div className="mt-4 p-3 bg-slate-900/80 rounded-lg border border-indigo-500/30">
                                                <div className="flex justify-between items-center mb-2">
                                                     <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">{t.action}</span>
                                                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${getActionColor(analysis.tradeSetup.positionManagement.action)}`}>
                                                         {analysis.tradeSetup.positionManagement.action.toUpperCase()}
                                                     </span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    {analysis.tradeSetup.positionManagement.reasoning[language]}
                                                </p>
                                            </div>
                                        )}
                                        
                                        {!analysis.tradeSetup.positionManagement && (
                                            <div className="pt-2 text-xs text-center text-slate-500 font-mono">
                                                {analysis.tradeSetup.recommendation[language]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Key Levels & Outlook */}
                                <div className="col-span-1 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {/* Key Levels */}
                                     <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                              <Scale className="w-5 h-5 text-indigo-400" /> {t.keyLevels}
                                          </h3>
                                          <div className="space-y-4">
                                              <div>
                                                  <span className="text-xs text-emerald-500 font-bold uppercase mb-1 block">{t.resistance}</span>
                                                  <div className="flex flex-wrap gap-2">
                                                      {analysis.keyLevels.resistance.map((level, i) => (
                                                          <span key={i} className="bg-slate-900 text-slate-200 px-3 py-1 rounded font-mono text-sm border border-slate-700">
                                                              {level.toFixed(2)}
                                                          </span>
                                                      ))}
                                                  </div>
                                              </div>
                                              <div>
                                                  <span className="text-xs text-rose-500 font-bold uppercase mb-1 block">{t.support}</span>
                                                  <div className="flex flex-wrap gap-2">
                                                      {analysis.keyLevels.support.map((level, i) => (
                                                          <span key={i} className="bg-slate-900 text-slate-200 px-3 py-1 rounded font-mono text-sm border border-slate-700">
                                                              {level.toFixed(2)}
                                                          </span>
                                                      ))}
                                                  </div>
                                              </div>
                                          </div>
                                     </div>

                                     {/* Future Outlook */}
                                     <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                                          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                              <Hourglass className="w-5 h-5 text-indigo-400" /> {t.futureOutlook}
                                          </h3>
                                          <div className="bg-slate-900/50 p-4 rounded-xl h-full">
                                              <p className="text-slate-300 leading-relaxed text-sm">
                                                  {analysis.futureOutlook[language]}
                                              </p>
                                              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.duration}:</span>
                                                  <span className="text-indigo-400 font-mono">{analysis.tradeSetup.expectedDuration[language]}</span>
                                              </div>
                                          </div>
                                     </div>
                                </div>

                                {/* CHAT COMPONENT ADDED HERE */}
                                <div className="col-span-1 lg:col-span-4">
                                    <ChatComponent 
                                      apiKey={apiKey || (typeof process !== 'undefined' && process.env ? process.env.API_KEY : '') || ''}
                                      analysisContext={analysis} 
                                      language={language} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </>
            )}
            
            {/* Split rendering for Portfolio and Watchlist */}
            {(activeTab === 'portfolio' || activeTab === 'watchlist') && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                     <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                {activeTab === 'portfolio' ? <Wallet className="w-6 h-6 text-indigo-400" /> : <Binoculars className="w-6 h-6 text-indigo-400" />}
                                {activeTab === 'portfolio' ? t.portfolio : t.watching}
                            </h2>
                         </div>
                         <div className="flex gap-2">
                             <button 
                                 onClick={() => {
                                     setAddSymbol('');
                                     setAddCost('');
                                     setAddMarket('US');
                                     setShowAddModal(true);
                                 }}
                                 className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all border border-slate-600"
                             >
                                 <Plus className="w-4 h-4" />
                                 {t.addAsset}
                             </button>
                             <button 
                                 onClick={handleUpdateAll}
                                 disabled={refreshingWatchlist}
                                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
                             >
                                 {refreshingWatchlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current text-yellow-300" />}
                                 {t.updateAll}
                             </button>
                         </div>
                     </div>
                     
                     {watchlist.filter(w => activeTab === 'portfolio' ? w.costBasis > 0 : (!w.costBasis || w.costBasis === 0)).length === 0 ? (
                         <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                             <List className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                             <p className="text-slate-400">{t.emptyWatchlist}</p>
                         </div>
                     ) : (
                         <div className="space-y-12">
                             {activeTab === 'portfolio' && (
                                <WatchlistSection 
                                    items={portfolioItems} 
                                    title={t.portfolio} 
                                    icon={Wallet} 
                                />
                             )}
                             
                             {activeTab === 'watchlist' && (
                                <WatchlistSection 
                                    items={watchOnlyItems} 
                                    title={t.watching} 
                                    icon={Binoculars} 
                                />
                             )}
                         </div>
                     )}
                </div>
            )}
        </main>
        
        {/* ADD ASSET MODAL */}
        {showAddModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-emerald-400" />
                            {t.addAsset}
                        </h3>
                        <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t.market}</label>
                            <div className="flex gap-2">
                                <button onClick={() => setAddMarket('US')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${addMarket === 'US' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>US</button>
                                <button onClick={() => setAddMarket('CN')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${addMarket === 'CN' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>CN</button>
                                <button onClick={() => setAddMarket('EU')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${addMarket === 'EU' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>EU</button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t.symbol}</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={addSymbol}
                                    onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                                    placeholder={addMarket === 'CN' ? "600519" : "NVDA"}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                {t.costBasis} {activeTab === 'watchlist' ? '(Leave 0 for Watchlist)' : '(Optional)'}
                            </label>
                            <input 
                                type="number" 
                                value={addCost}
                                onChange={(e) => setAddCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                             <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-colors">
                                 {t.cancel}
                             </button>
                             <button 
                                 onClick={handleAddAsset}
                                 disabled={!addSymbol || isAddingAsset}
                                 className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                             >
                                 {isAddingAsset ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                 {t.save}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* EDIT COST MODAL */}
        {showEditModal && editItem && (
             <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-indigo-400" />
                            {t.editCost}
                        </h3>
                        <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="mb-4 text-center">
                        <h4 className="text-2xl font-bold text-white">{editItem.symbol}</h4>
                        <span className="text-xs font-mono text-slate-500">{editItem.market}</span>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t.costBasis}</label>
                        <input 
                            type="number" 
                            value={editCostValue}
                            onChange={(e) => setEditCostValue(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-lg"
                        />
                    </div>

                    <div className="flex gap-3">
                         <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold transition-colors">
                             {t.cancel}
                         </button>
                         <button 
                             onClick={handleUpdateCost}
                             className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors"
                         >
                             {t.save}
                         </button>
                    </div>
                </div>
             </div>
        )}

        {/* ... (Existing Modals: Glossary, Settings, Social Share remain the same) ... */}
    </div>
  );
}
