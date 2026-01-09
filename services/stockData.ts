
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

  if (market === 'EU') {
    // For Europe, because suffixes vary widely (.DE, .PA, .AS, .L), 
    // we don't append a default suffix if the user manually types a code without one.
    // We rely on the search dropdown to provide the correct suffixed ticker.
    return cleanTicker;
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
        case '15m': return '60d';
        case '1h': return '730d'; // 2 years
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
  const encodedUrl = encodeURIComponent(targetUrl);

  // Primary: corsproxy.io (fastest)
  // Secondary: allorigins.win (reliable fallback)
  const proxies = [
    `https://corsproxy.io/?${encodedUrl}`,
    `https://api.allorigins.win/raw?url=${encodedUrl}`
  ];

  let lastError;
  for (const proxy of proxies) {
    try {
      // Use 'no-store' to ensure we get fresh data and avoid browser/proxy caching
      const res = await fetch(proxy, { 
        cache: 'no-store',
        headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
        }
      });
      
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
  throw lastError || new Error("All proxies failed to fetch data. Please try again later.");
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
            if (market === 'EU') {
                const euSuffixes = ['.PA', '.DE', '.L', '.AS', '.MI', '.MC', '.SW', '.ST', '.OL', '.CO', '.HE', '.LS', '.BR', '.VI', '.IR'];
                const euExchanges = ['PAR', 'GER', 'LSE', 'AMS', 'MIL', 'MAD', 'SWX', 'STO', 'OSL', 'CPH', 'HEL', 'VIE', 'LIS', 'BRU', 'ISE'];
                // Check exchange code OR suffix
                return (q.exchange && euExchanges.includes(q.exchange)) || euSuffixes.some(s => q.symbol.endsWith(s));
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

  // 1. Prepare requests: Quote (Real-time Price) and Chart (History)
  const quoteUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(formattedSymbol)}`;
  const chartUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${interval}&range=${range}&includePrePost=true`;
  
  // 2. Fetch in parallel
  const quotePromise = fetchWithFallback(quoteUrl).catch(e => {
      console.warn("Quote fetch failed", e);
      return null;
  });
  const chartPromise = fetchWithFallback(chartUrl);

  try {
    const [quoteJson, chartJson] = await Promise.all([quotePromise, chartPromise]);
    
    // 3. Handle Chart Data (Required)
    const result = chartJson.chart?.result?.[0];
    if (!result) {
      let errorMsg = `Symbol '${formattedSymbol}' not found.`;
      if (market === 'CN') errorMsg += ` Try code (e.g. 600519).`;
      if (market === 'EU') errorMsg += ` Try name (e.g. ASML, SAP).`;
      throw new Error(errorMsg);
    }

    const meta = result.meta;
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    
    if (!timestamps || !quote) {
       throw new Error(`Invalid data structure received for ${symbol}`);
    }
    
    const data: StockDataPoint[] = [];
    const isIntraday = interval.includes('m') || interval.includes('h');
    
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close[i];
      if (close === null || close === undefined) continue; 
      
      const dateObj = new Date(timestamps[i] * 1000);
      let dateStr;
      
      if (isIntraday) {
          dateStr = dateObj.toISOString().replace('T', ' ').substring(0, 16);
      } else {
          dateStr = dateObj.toISOString().split('T')[0];
      }
      
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
    
    // 4. Determine Best Available Current Price
    // Default to last candle close (which might be delayed 15-20mins for free API)
    let finalPrice = data.length > 0 ? data[data.length - 1].close : meta.regularMarketPrice;

    // Override with Quote data if available (Real-time / Extended Hours)
    if (quoteJson && quoteJson.quoteResponse?.result?.[0]) {
        const q = quoteJson.quoteResponse.result[0];
        // Logic: If Pre-Market or Post-Market active, use those prices. Else Regular.
        if (q.marketState === 'PRE' && q.preMarketPrice) {
            finalPrice = q.preMarketPrice;
        } else if (['POST', 'CLOSED', 'POSTPOST'].includes(q.marketState) && q.postMarketPrice) {
            finalPrice = q.postMarketPrice;
        } else {
            // During Regular session, regularMarketPrice is usually fresher than Chart candle
            finalPrice = q.regularMarketPrice || finalPrice;
        }
    }

    // Construct simplified metadata object
    const stockMetadata = {
        symbol: meta.symbol,
        shortName: meta.shortName || meta.symbol,
        longName: meta.longName || meta.shortName || meta.symbol,
        currency: meta.currency,
        exchangeName: meta.fullExchangeName,
        price: finalPrice // Best available price
    };

    return { data, meta: stockMetadata };
    
  } catch (error: any) {
    console.error("Stock Fetch Error:", error);
    throw new Error(error.message || "Failed to fetch stock data");
  }
}

/**
 * Fetches real-time quotes for multiple symbols in one request.
 * Extremely efficient for watchlists.
 */
export async function fetchBatchQuotes(symbols: string[], marketMap: Record<string, Market>): Promise<Record<string, number>> {
    if (symbols.length === 0) return {};

    // Format all tickers
    const formattedSymbols = symbols.map(s => formatTickerForMarket(s, marketMap[s]));
    const uniqueSymbols = Array.from(new Set(formattedSymbols));
    
    const targetUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(uniqueSymbols.join(','))}`;

    try {
        const json = await fetchWithFallback(targetUrl);
        const results = json.quoteResponse?.result || [];
        
        const priceMap: Record<string, number> = {};
        
        results.forEach((q: any) => {
            let price = q.regularMarketPrice;
            
            // Apply Extended Hours Logic
            if (q.marketState === 'PRE' && q.preMarketPrice) {
                price = q.preMarketPrice;
            } else if (['POST', 'CLOSED', 'POSTPOST'].includes(q.marketState) && q.postMarketPrice) {
                price = q.postMarketPrice;
            }
            
            // Map back to the input symbol (we need to match the original symbol stored in watchlist)
            // This is tricky because Yahoo returns "NVDA" but we might have stored "NVDA" or "NVDA.US"
            // We'll map by checking which input symbol generated this Yahoo symbol.
            
            // Simple reverse lookup strategy:
            // Find which original symbol formats to this yahoo symbol
            const originalSymbol = symbols.find(s => formatTickerForMarket(s, marketMap[s]) === q.symbol);
            if (originalSymbol) {
                priceMap[originalSymbol] = price;
            }
        });
        
        return priceMap;
    } catch (e) {
        console.error("Batch quote fetch failed", e);
        return {};
    }
}
