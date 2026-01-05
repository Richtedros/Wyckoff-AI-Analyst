import { StockDataPoint, Market, Interval, StockFetchResult, SearchResult } from '../types';

/**
 * Calculates Simple Moving Average (SMA) for a given window size.
 */
function calculateSMA(data: StockDataPoint[], window: number): void {
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < window; j++) {
      sum += data[i - j].close;
    }
    const avg = sum / window;
    
    if (window === 50) data[i].ma50 = avg;
    if (window === 200) data[i].ma200 = avg;
  }
}

/**
 * Calculates Anchored VWAP (Volume Weighted Average Price)
 * VWAP = Cumulative(Price * Volume) / Cumulative(Volume)
 */
function calculateVWAP(data: StockDataPoint[]): void {
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const volume = data[i].volume;

    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;

    if (cumulativeVolume > 0) {
      data[i].vwap = cumulativeTPV / cumulativeVolume;
    }
  }
}

function formatTickerForMarket(ticker: string, market: Market): string {
  const cleanTicker = ticker.trim().toUpperCase();
  
  // If it already has a dot, assume user selected a specific ticker (e.g. SOI.PA)
  if (cleanTicker.includes('.')) {
      return cleanTicker;
  }

  if (market === 'US') {
    return cleanTicker;
  }

  if (market === 'FR') {
    return `${cleanTicker}.PA`;
  }

  if (market === 'CN') {
    // Heuristic for A-Shares
    if (cleanTicker.startsWith('6')) return `${cleanTicker}.SS`;
    if (cleanTicker.startsWith('0') || cleanTicker.startsWith('3')) return `${cleanTicker}.SZ`;
    if (cleanTicker.startsWith('4') || cleanTicker.startsWith('8')) return `${cleanTicker}.BJ`;
    return `${cleanTicker}.SS`;
  }

  return cleanTicker;
}

function getRangeForInterval(interval: Interval): string {
    switch(interval) {
        case '1d': return '2y';
        case '1wk': return '5y';
        case '1mo': return '10y';
        default: return '2y';
    }
}

/**
 * Robust fetch function that tries multiple proxies if one fails.
 * This is crucial for frontend-only apps hitting Yahoo Finance.
 */
async function fetchWithFallback(targetUrl: string): Promise<any> {
  // Primary: corsproxy.io (fastest)
  // Secondary: allorigins.win (reliable fallback)
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
  ];

  let lastError;
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy);
      if (res.ok) {
        return await res.json();
      }
      // If 429 or 403, try next proxy
      console.warn(`Proxy ${proxy} returned status ${res.status}`);
      lastError = new Error(`Proxy status ${res.status}`);
    } catch (e) {
      console.warn(`Proxy ${proxy} failed connection`, e);
      lastError = e;
    }
  }
  throw lastError || new Error("All proxies failed to fetch data.");
}

export async function searchSymbols(query: string, market: Market): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];
    
    const targetUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;

    try {
        const json = await fetchWithFallback(targetUrl);
        const quotes = json.quotes || [];

        // Filter based on market to make results relevant
        return quotes.filter((q: any) => {
            if (!q.symbol) return false;
            
            // Basic filtering logic based on market preference
            if (market === 'FR') {
                return q.exchange === 'PAR' || q.symbol.endsWith('.PA') || q.symbol.endsWith('.NX');
            }
            if (market === 'CN') {
                return q.symbol.endsWith('.SS') || q.symbol.endsWith('.SZ') || q.exchange === 'SHH' || q.exchange === 'SHZ';
            }
            if (market === 'US') {
                 // Exclude obviously foreign exchanges if looking for US
                 const isForeign = q.symbol.includes('.') && !q.symbol.endsWith('.K'); 
                 return !isForeign;
            }
            return true;
        }).map((q: any) => ({
            symbol: q.symbol,
            shortname: q.shortname || q.longname || q.symbol,
            longname: q.longname || q.shortname || q.symbol,
            exchange: q.exchange,
            typeDisp: q.typeDisp
        }));

    } catch (e) {
        console.error("Search failed", e);
        return [];
    }
}

export async function fetchStockData(symbol: string, market: Market = 'US', interval: Interval = '1d'): Promise<StockFetchResult> {
  const formattedSymbol = formatTickerForMarket(symbol, market);
  const range = getRangeForInterval(interval);

  const targetUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${interval}&range=${range}`;
  
  try {
    const json = await fetchWithFallback(targetUrl);
    const result = json.chart?.result?.[0];
    
    if (!result) {
      let errorMsg = `Symbol '${formattedSymbol}' not found.`;
      if (market === 'CN') errorMsg += ` Try code (e.g. 600519).`;
      if (market === 'FR') errorMsg += ` Try name (e.g. LVMH).`;
      throw new Error(errorMsg);
    }

    const meta = result.meta;
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    if (!timestamps || !quote) {
       throw new Error(`Invalid data structure received for ${symbol}`);
    }
    
    const data: StockDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close[i];
      if (close === null || close === undefined) continue; 
      
      const dateObj = new Date(timestamps[i] * 1000);
      const dateStr = dateObj.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        open: quote.open[i] ?? 0,
        high: quote.high[i] ?? 0,
        low: quote.low[i] ?? 0,
        close: quote.close[i] ?? 0,
        volume: quote.volume[i] ?? 0,
        originalDateObj: dateObj
      });
    }

    calculateSMA(data, 50);
    calculateSMA(data, 200);
    calculateVWAP(data);
    
    // Construct simplified metadata object
    const stockMetadata = {
        symbol: meta.symbol,
        shortName: meta.shortName || meta.symbol,
        longName: meta.longName || meta.shortName || meta.symbol,
        currency: meta.currency,
        exchangeName: meta.fullExchangeName,
        price: meta.regularMarketPrice
    };

    return { data, meta: stockMetadata };
    
  } catch (error: any) {
    console.error("Stock Fetch Error:", error);
    throw new Error(error.message || "Failed to fetch stock data");
  }
}