import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RawCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CacheEntry {
  timestamp: number;
  data: RawCandle[];
}

const klineCache = new Map<string, CacheEntry>();

function aggregateCandles(candles: RawCandle[], groupSize: number): RawCandle[] {
  if (groupSize <= 1 || candles.length === 0) return candles;
  const result: RawCandle[] = [];
  for (let i = 0; i < candles.length; i += groupSize) {
    const slice = candles.slice(i, i + groupSize);
    if (slice.length === 0) continue;
    const open = slice[0].open;
    const close = slice[slice.length - 1].close;
    let high = slice[0].high;
    let low = slice[0].low;
    let volume = 0;
    for (const c of slice) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      volume += c.volume;
    }
    result.push({
      time: slice[0].time,
      open,
      high,
      low,
      close,
      volume,
    });
  }
  return result;
}

async function fetchBinanceKlines(symbol: string, interval: string, limit: number): Promise<RawCandle[]> {
  const safeLimit = Math.min(Math.max(limit, 50), 600);
  const url = `https://data-api.binance.vision/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${safeLimit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Binance Vision hatası (${res.status})`);
  }
  const rows = (await res.json()) as Array<[number, string, string, string, string, string]>;
  return rows.map((r) => ({
    time: Math.floor(r[0] / 1000),
    open: parseFloat(r[1]),
    high: parseFloat(r[2]),
    low: parseFloat(r[3]),
    close: parseFloat(r[4]),
    volume: parseFloat(r[5]),
  }));
}

async function fetchYahooKlines(symbol: string, interval: string, limit: number): Promise<RawCandle[]> {
  let yahooInterval = '1d';
  let yahooRange = '1y';
  let aggregateFactor = 1;

  switch (interval) {
    case '1m':
      yahooInterval = '1m';
      yahooRange = '5d';
      break;
    case '5m':
      yahooInterval = '5m';
      yahooRange = '1mo';
      break;
    case '15m':
      yahooInterval = '15m';
      yahooRange = '1mo';
      break;
    case '1h':
      yahooInterval = '60m';
      yahooRange = '3mo';
      break;
    case '4h':
      yahooInterval = '60m';
      yahooRange = '6mo';
      aggregateFactor = 4;
      break;
    case '1d':
    default:
      yahooInterval = '1d';
      yahooRange = '1y';
      break;
  }

  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${yahooInterval}&range=${yahooRange}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${yahooInterval}&range=${yahooRange}`,
  ];

  let res: globalThis.Response | null = null;
  for (const url of endpoints) {
    const attempt = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
    });
    if (attempt.ok) {
      res = attempt;
      break;
    }
    res = attempt;
  }

  if (!res || !res.ok) {
    throw new Error(`BIST / Yahoo veri servisi yoğun (${res?.status ?? 500})`);
  }

  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
            volume?: Array<number | null>;
          }>;
        };
      }>;
    };
  };

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0) {
    throw new Error(`${symbol} için mum verisi bulunamadı.`);
  }

  const raw: RawCandle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i] ?? 0;
    if (o != null && h != null && l != null && c != null && Number.isFinite(o) && Number.isFinite(c)) {
      raw.push({
        time: timestamps[i],
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v ?? 0,
      });
    }
  }

  const aggregated = aggregateFactor > 1 ? aggregateCandles(raw, aggregateFactor) : raw;
  return aggregated.slice(-Math.min(Math.max(limit, 50), 600));
}

async function getCandlesCached(source: string, symbol: string, interval: string, limit: number): Promise<RawCandle[]> {
  const key = `${source}:${symbol}:${interval}`;
  const ttlMs = source === 'binance' ? 3000 : 60000;
  const cached = klineCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data.slice(-limit);
  }

  try {
    const data =
      source === 'binance'
        ? await fetchBinanceKlines(symbol, interval, Math.max(limit, 300))
        : await fetchYahooKlines(symbol, interval, Math.max(limit, 300));

    klineCache.set(key, { timestamp: now, data });
    return data.slice(-limit);
  } catch (err) {
    // Serve stale cache if available on transient network hiccup
    if (cached) {
      return cached.data.slice(-limit);
    }
    throw err;
  }
}

const SCANNER_INSTRUMENTS = [
  { id: 'BTCUSDT', symbol: 'BTCUSDT', displaySymbol: 'BTC/USDT', name: 'Bitcoin / Tether', category: 'crypto', source: 'binance' },
  { id: 'ETHUSDT', symbol: 'ETHUSDT', displaySymbol: 'ETH/USDT', name: 'Ethereum / Tether', category: 'crypto', source: 'binance' },
  { id: 'SOLUSDT', symbol: 'SOLUSDT', displaySymbol: 'SOL/USDT', name: 'Solana / Tether', category: 'crypto', source: 'binance' },
  { id: 'BNBUSDT', symbol: 'BNBUSDT', displaySymbol: 'BNB/USDT', name: 'BNB / Tether', category: 'crypto', source: 'binance' },
  { id: 'XRPUSDT', symbol: 'XRPUSDT', displaySymbol: 'XRP/USDT', name: 'Ripple / Tether', category: 'crypto', source: 'binance' },
  { id: 'AVAXUSDT', symbol: 'AVAXUSDT', displaySymbol: 'AVAX/USDT', name: 'Avalanche / Tether', category: 'crypto', source: 'binance' },
  { id: 'BTCTRY', symbol: 'BTCTRY', displaySymbol: 'BTC/TRY', name: 'Bitcoin / Türk Lirası', category: 'crypto', source: 'binance' },
  { id: 'USDTTRY', symbol: 'USDTTRY', displaySymbol: 'USD/TRY (7/24)', name: 'Dolar / Türk Lirası Paritesi', category: 'forex', source: 'binance' },
  { id: 'EURUSDT', symbol: 'EURUSDT', displaySymbol: 'EUR/USD (7/24)', name: 'Euro / Dolar Paritesi', category: 'forex', source: 'binance' },
  { id: 'PAXGUSDT', symbol: 'PAXGUSDT', displaySymbol: 'ONS ALTIN (7/24)', name: 'Spot Altın Ons (PAXG)', category: 'forex', source: 'binance' },
  { id: 'GARAN.IS', symbol: 'GARAN.IS', displaySymbol: 'GARAN', name: 'Garanti BBVA (BIST)', category: 'bist', source: 'yahoo' },
  { id: 'THYAO.IS', symbol: 'THYAO.IS', displaySymbol: 'THYAO', name: 'Türk Hava Yolları (BIST)', category: 'bist', source: 'yahoo' },
  { id: 'ASELS.IS', symbol: 'ASELS.IS', displaySymbol: 'ASELS', name: 'Aselsan Elektronik (BIST)', category: 'bist', source: 'yahoo' },
  { id: 'AKBNK.IS', symbol: 'AKBNK.IS', displaySymbol: 'AKBNK', name: 'Akbank T.A.Ş. (BIST)', category: 'bist', source: 'yahoo' },
  { id: 'EREGL.IS', symbol: 'EREGL.IS', displaySymbol: 'EREGL', name: 'Ereğli Demir Çelik (BIST)', category: 'bist', source: 'yahoo' },
  { id: 'XU100.IS', symbol: 'XU100.IS', displaySymbol: 'XU100', name: 'BIST 100 Endeksi', category: 'bist', source: 'yahoo' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/market/klines', async (req: Request, res: Response) => {
    try {
      const symbol = String(req.query.symbol || 'BTCUSDT');
      const source = String(req.query.source || 'binance');
      const interval = String(req.query.interval || '15m');
      const limit = Number(req.query.limit || 300);

      let candles = await getCandlesCached(source, symbol, interval, limit);
      if (candles.length < 15 && source === 'yahoo' && interval !== '1d') {
        candles = await getCandlesCached(source, symbol, '1d', limit);
      }
      res.json({ symbol, source, interval, candles });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Veri alınırken beklenmeyen bir hata oluştu.';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/market/scanner', async (req: Request, res: Response) => {
    try {
      const interval = String(req.query.interval || '1h');
      const binanceList = SCANNER_INSTRUMENTS.filter((i) => i.source === 'binance');
      const yahooList = SCANNER_INSTRUMENTS.filter((i) => i.source === 'yahoo');

      // Fetch Binance instruments in parallel
      const binanceResults = await Promise.all(
        binanceList.map(async (inst) => {
          try {
            const candles = await getCandlesCached(inst.source, inst.symbol, interval, 120);
            return { instrument: inst, candles, error: null };
          } catch (err) {
            return { instrument: inst, candles: [], error: err instanceof Error ? err.message : 'Hata' };
          }
        })
      );

      // Fetch Yahoo BIST instruments sequentially with slight stagger to avoid 429 rate-limit bursts
      const yahooResults: Array<{
        instrument: (typeof SCANNER_INSTRUMENTS)[number];
        candles: RawCandle[];
        error: string | null;
      }> = [];

      for (const inst of yahooList) {
        try {
          let candles = await getCandlesCached(inst.source, inst.symbol, interval, 120);
          if (candles.length < 15) {
            candles = await getCandlesCached(inst.source, inst.symbol, '1d', 120);
          }
          yahooResults.push({ instrument: inst, candles, error: null });
        } catch (err) {
          yahooResults.push({
            instrument: inst,
            candles: [],
            error: err instanceof Error ? err.message : 'Hata',
          });
        }
      }

      res.json({ interval, items: [...binanceResults, ...yahooResults] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tarayıcı verisi alınamadı.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
