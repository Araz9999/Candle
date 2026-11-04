import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Moon,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipForward,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { CandleAnatomyPanel } from './components/CandleAnatomyPanel';
import { CandlestickChart } from './components/CandlestickChart';
import { MarketScannerView } from './components/MarketScannerView';
import { PatternEncyclopediaView } from './components/PatternEncyclopediaView';
import { PatternSettingsModal } from './components/PatternSettingsModal';
import { PdfReferenceView } from './components/PdfReferenceView';
import { MARKET_INSTRUMENTS, TIMEFRAMES } from './data/instruments';
import { PATTERN_MAP, PATTERNS_CATALOG } from './data/patternsCatalog';
import {
  analyzeSingleCandle,
  createDefaultPatternSettings,
  detectPatterns,
} from './engine/candlestickEngine';
import {
  analyzeTechnicalStructure,
  evaluatePatternsConfluence,
  evaluateTopDownAlignment,
  getHigherTimeframeFor,
} from './engine/chartTechniquesEngine';
import type {
  Candle,
  ChartOverlayKey,
  DetectedPattern,
  MarketInstrument,
  PatternSettings,
  PatternStatus,
  Timeframe,
} from './types/market';

type ActiveView = 'chart' | 'scanner' | 'guide' | 'pdf';

function formatSignalDate(unixSec: number, timeframe: Timeframe): string {
  const d = new Date(unixSec * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (timeframe === '1d') {
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('chart');
  const [isDark, setIsDark] = useState<boolean>(true);

  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument>(
    MARKET_INSTRUMENTS[0]
  );
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [settings, setSettings] = useState<PatternSettings>(() => createDefaultPatternSettings());
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const [fullCandles, setFullCandles] = useState<Candle[]>([]);
  const [htfCandles, setHtfCandles] = useState<Candle[]>([]);
  const [loadingCandles, setLoadingCandles] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<'live_ws' | 'polling' | 'replay'>('polling');

  const [replayCutoff, setReplayCutoff] = useState<number | null>(null);
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);

  const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(null);
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'candle' | 'pattern' | 'structure'>('candle');
  const [focusBarIndex, setFocusBarIndex] = useState<number | null>(null);

  const [tableDirectionFilter, setTableDirectionFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | PatternStatus>('all');
  const [singlePatternFilterId, setSinglePatternFilterId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const loadMarketCandles = useCallback(
    async (inst: MarketInstrument, tf: Timeframe, silent = false) => {
      if (!silent) {
        setLoadingCandles(true);
        setFetchError(null);
      }
      try {
        const res = await fetch(
          `/api/market/klines?symbol=${encodeURIComponent(inst.symbol)}&source=${encodeURIComponent(
            inst.source
          )}&interval=${encodeURIComponent(tf)}&limit=300`
        );
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(errBody.error || `Veri alınamadı (${res.status})`);
        }
        const payload = (await res.json()) as { candles: Candle[] };
        const loaded = payload.candles || [];
        setFullCandles(loaded);
        if (!silent && loaded.length > 0) {
          setSelectedCandleIndex(loaded.length - 1);
          setSelectedPatternId(null);
          setFocusBarIndex(null);
        }
      } catch (err) {
        if (!silent) {
          setFetchError(err instanceof Error ? err.message : 'Piyasa verisi yüklenemedi.');
        }
      } finally {
        if (!silent) {
          setLoadingCandles(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    setReplayCutoff(null);
    setReplayPlaying(false);
    loadMarketCandles(selectedInstrument, timeframe, false);
  }, [selectedInstrument, timeframe, loadMarketCandles]);

  // Fetch Higher Timeframe Candles for Top-Down Analysis (Trading Bible s.22-26)
  useEffect(() => {
    let cancelled = false;
    const htfMeta = getHigherTimeframeFor(timeframe);
    if (htfMeta.tf === timeframe) {
      setHtfCandles([]);
      return;
    }
    fetch(
      `/api/market/klines?symbol=${encodeURIComponent(
        selectedInstrument.symbol
      )}&source=${encodeURIComponent(selectedInstrument.source)}&interval=${encodeURIComponent(
        htfMeta.tf
      )}&limit=150`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { candles?: Candle[] } | null) => {
        if (!cancelled && data?.candles) {
          setHtfCandles(data.candles);
        }
      })
      .catch(() => {
        if (!cancelled) setHtfCandles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedInstrument, timeframe]);

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (replayCutoff !== null) {
      setStreamState('replay');
      return;
    }

    let pollTimer: ReturnType<typeof setInterval> | null = null;

    if (selectedInstrument.source === 'binance') {
      const wsUrl = `wss://data-stream.binance.vision/ws/${selectedInstrument.symbol.toLowerCase()}@kline_${timeframe}`;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setStreamState('live_ws');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as {
              k?: {
                t: number;
                o: string;
                h: string;
                l: string;
                c: string;
                v: string;
              };
            };
            if (!msg.k) return;
            const liveBar: Candle = {
              time: Math.floor(msg.k.t / 1000),
              open: parseFloat(msg.k.o),
              high: parseFloat(msg.k.h),
              low: parseFloat(msg.k.l),
              close: parseFloat(msg.k.c),
              volume: parseFloat(msg.k.v),
            };
            setFullCandles((prev) => {
              if (prev.length === 0) return [liveBar];
              const last = prev[prev.length - 1];
              if (last.time === liveBar.time) {
                const updated = prev.slice(0, -1);
                updated.push(liveBar);
                return updated;
              } else if (liveBar.time > last.time) {
                return [...prev.slice(-299), liveBar];
              }
              return prev;
            });
          } catch {
            // ignore frame
          }
        };

        ws.onerror = () => {
          setStreamState('polling');
        };

        ws.onclose = () => {
          if (replayCutoff === null) setStreamState('polling');
        };
      } catch {
        setStreamState('polling');
      }
    } else {
      setStreamState('polling');
    }

    pollTimer = setInterval(() => {
      if (replayCutoff === null) {
        loadMarketCandles(selectedInstrument, timeframe, true);
      }
    }, 12000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [selectedInstrument, timeframe, replayCutoff, loadMarketCandles]);

  useEffect(() => {
    if (!replayPlaying || replayCutoff === null) return;
    const timer = setInterval(() => {
      setReplayCutoff((prev) => {
        if (prev === null) return null;
        if (prev >= fullCandles.length) {
          setReplayPlaying(false);
          return null;
        }
        const next = prev + 1;
        setSelectedCandleIndex(next - 1);
        return next;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [replayPlaying, replayCutoff, fullCandles.length]);

  const activeCandles = useMemo(() => {
    if (replayCutoff !== null) {
      return fullCandles.slice(0, Math.max(10, Math.min(fullCandles.length, replayCutoff)));
    }
    return fullCandles;
  }, [fullCandles, replayCutoff]);

  const effectiveSettings: PatternSettings = useMemo(() => {
    if (!singlePatternFilterId) return settings;
    const onlyOne: Record<string, boolean> = {};
    for (const p of PATTERNS_CATALOG) {
      onlyOne[p.id] = p.id === singlePatternFilterId;
    }
    return {
      ...settings,
      enabledPatterns: onlyOne,
    };
  }, [settings, singlePatternFilterId]);

  const techAnalysis = useMemo(
    () => analyzeTechnicalStructure(activeCandles),
    [activeCandles]
  );

  const detectedPatterns = useMemo(() => {
    const raw = detectPatterns(activeCandles, effectiveSettings);
    const evaluated = evaluatePatternsConfluence(raw, activeCandles, techAnalysis);
    if (effectiveSettings.onlyMorrisFiltered) {
      return evaluated.filter((p) => p.morrisFilter?.isFilteredSignal);
    }
    return evaluated;
  }, [activeCandles, effectiveSettings, techAnalysis]);

  const topDownSummary = useMemo(() => {
    const htfMeta = getHigherTimeframeFor(timeframe);
    const refCandles = htfMeta.tf === timeframe ? activeCandles : htfCandles;
    return evaluateTopDownAlignment(
      activeCandles,
      techAnalysis.marketRegime,
      refCandles,
      htfMeta
    );
  }, [activeCandles, techAnalysis.marketRegime, htfCandles, timeframe]);

  const resolvedCandleIndex = useMemo(() => {
    if (activeCandles.length === 0) return null;
    if (selectedCandleIndex == null || selectedCandleIndex >= activeCandles.length) {
      return activeCandles.length - 1;
    }
    return Math.max(0, selectedCandleIndex);
  }, [activeCandles.length, selectedCandleIndex]);

  const candleAnatomy = useMemo(() => {
    if (resolvedCandleIndex == null) return null;
    return analyzeSingleCandle(activeCandles, resolvedCandleIndex, selectedInstrument.decimals);
  }, [activeCandles, resolvedCandleIndex, selectedInstrument.decimals]);

  const selectedPattern = useMemo(() => {
    if (selectedPatternId) {
      const found = detectedPatterns.find((p) => p.id === selectedPatternId);
      if (found) return found;
    }
    return detectedPatterns.length > 0 ? detectedPatterns[detectedPatterns.length - 1] : null;
  }, [detectedPatterns, selectedPatternId]);

  const filteredTablePatterns = useMemo(() => {
    return [...detectedPatterns]
      .reverse()
      .filter((p) => {
        if (tableDirectionFilter !== 'all' && p.direction !== tableDirectionFilter) return false;
        if (tableStatusFilter !== 'all' && p.status !== tableStatusFilter) return false;
        return true;
      });
  }, [detectedPatterns, tableDirectionFilter, tableStatusFilter]);

  const lastCandle = activeCandles.length > 0 ? activeCandles[activeCandles.length - 1] : null;
  const firstSessionCandle =
    activeCandles.length > 24 ? activeCandles[activeCandles.length - 25] : activeCandles[0];
  const sessionChangePct =
    lastCandle && firstSessionCandle && firstSessionCandle.open !== 0
      ? ((lastCandle.close - firstSessionCandle.open) / firstSessionCandle.open) * 100
      : 0;

  const confirmedCount = useMemo(
    () => detectedPatterns.filter((p) => p.status === 'confirmed').length,
    [detectedPatterns]
  );
  const waitingCount = useMemo(
    () => detectedPatterns.filter((p) => p.status === 'not_confirmed').length,
    [detectedPatterns]
  );

  const handleStartReplay = () => {
    if (fullCandles.length < 30) return;
    const startCut = Math.max(25, fullCandles.length - 35);
    setReplayCutoff(startCut);
    setSelectedCandleIndex(startCut - 1);
    setReplayPlaying(false);
  };

  const handleStepReplay = () => {
    if (replayCutoff === null) return;
    if (replayCutoff >= fullCandles.length) {
      setReplayCutoff(null);
      setReplayPlaying(false);
      return;
    }
    const next = replayCutoff + 1;
    setReplayCutoff(next);
    setSelectedCandleIndex(next - 1);
  };

  const handleExitReplay = () => {
    setReplayPlaying(false);
    setReplayCutoff(null);
    if (fullCandles.length > 0) {
      setSelectedCandleIndex(fullCandles.length - 1);
    }
  };

  const handleSelectPatternRow = (pat: DetectedPattern) => {
    setSelectedPatternId(pat.id);
    setSelectedCandleIndex(pat.endIndex);
    setInspectorTab('pattern');
    setFocusBarIndex(pat.endIndex);
  };

  const handleToggleOverlay = (key: ChartOverlayKey) => {
    setSettings((prev) => {
      const nextVal = !prev[key];
      if (key === 'useAdaptiveBollinger' && nextVal) {
        return { ...prev, useAdaptiveBollinger: true, showBollinger: true };
      }
      return {
        ...prev,
        [key]: nextVal,
      };
    });
  };

  const handleActivateOverlayFromGuide = (overlayKey?: ChartOverlayKey) => {
    if (overlayKey) {
      setSettings((prev) => ({
        ...prev,
        [overlayKey]: true,
        ...(overlayKey === 'useAdaptiveBollinger' ? { showBollinger: true } : {}),
      }));
    }
    setInspectorTab('structure');
    setActiveView('chart');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 h-16 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('chart');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          Matriks Mum Analiz
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium overflow-x-auto">
          {[
            { id: 'chart', label: 'Canlı Grafik' },
            { id: 'scanner', label: 'Piyasa Tarayıcı' },
            { id: 'guide', label: 'Bilgi Bazası' },
            { id: 'pdf', label: 'Kaynaklar' },
          ].map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id as ActiveView)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-blue-600 dark:border-blue-400 text-slate-900 dark:text-white font-semibold'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Formasyon Ayarları</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      {activeView === 'chart' && (
        <main className="flex-1 flex flex-col">
          {/* Primary Instrument & Timeframe Toolbar */}
          <div className="px-6 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="instrument-select" className="sr-only">
                  Piyasa Enstrümanı Seçin
                </label>
                <select
                  id="instrument-select"
                  value={selectedInstrument.id}
                  onChange={(e) => {
                    const next = MARKET_INSTRUMENTS.find((m) => m.id === e.target.value);
                    if (next) setSelectedInstrument(next);
                  }}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                >
                  <optgroup label="Kripto — 7/24 Anlık Akış">
                    {MARKET_INSTRUMENTS.filter((i) => i.category === 'crypto').map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.displaySymbol} — {i.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Döviz ve Emtia — 7/24 Anlık">
                    {MARKET_INSTRUMENTS.filter((i) => i.category === 'forex').map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.displaySymbol} — {i.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Borsa İstanbul (BIST)">
                    {MARKET_INSTRUMENTS.filter((i) => i.category === 'bist').map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.displaySymbol} — {i.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {lastCandle && (
                <div className="flex items-baseline gap-3 font-mono tabular-nums">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {lastCandle.close.toFixed(selectedInstrument.decimals)}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {selectedInstrument.currency}
                    </span>
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      sessionChangePct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {sessionChangePct >= 0 ? '+' : ''}
                    {sessionChangePct.toFixed(2)}%
                  </span>
                </div>
              )}

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {streamState === 'live_ws'
                    ? 'Canlı WebSocket Akışı'
                    : streamState === 'replay'
                      ? `Bar Okuma Simülasyonu (${replayCutoff}/${fullCandles.length})`
                      : 'Otomatik Veri Senkronu'}
                </span>
                <span aria-hidden="true">·</span>
                <span>Onaylı: {confirmedCount}</span>
                <span aria-hidden="true">·</span>
                <span>Bekleyen: {waitingCount}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Timeframe Selector */}
              <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setTimeframe(tf.id)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      timeframe === tf.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Replay Controls */}
              {replayCutoff === null ? (
                <button
                  type="button"
                  onClick={handleStartReplay}
                  disabled={fullCandles.length < 30}
                  title="Geçmişten bar bar ilerleyerek mum formasyonlarının teyit/stop sürecini canlı izleyin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Adım Adım Simülasyon</span>
                </button>
              ) : (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <button
                    type="button"
                    onClick={() => setReplayPlaying((p) => !p)}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    {replayPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{replayPlaying ? 'Duraklat' : 'Oynat'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleStepReplay}
                    title="1 Mum İlerlet"
                    className="px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>+1 Bar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExitReplay}
                    title="Canlı Akışa Dön"
                    className="px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Canlı</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => loadMarketCandles(selectedInstrument, timeframe, false)}
                title="Verileri Yenile"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingCandles ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Chart Reading Techniques Overlay Bar */}
          <div className="px-6 py-2 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 mr-1">
              Grafik Katmanları:
            </span>

            {(
              [
                { key: 'showSRZones', label: 'Destek / Direnç' },
                { key: 'showSupplyDemand', label: 'Arz/Talep & HH/HL' },
                { key: 'showMA8_21', label: 'MA 8 & 21' },
                { key: 'showTrendChannel', label: 'Trend & Kanal' },
                { key: 'showGeometric', label: 'Üçgen & Sıkışma' },
                { key: 'showFibonacci', label: 'Fibonacci' },
                { key: 'showBollinger', label: 'Bollinger & BBMA' },
                {
                  key: 'useAdaptiveBollinger',
                  label: `Opt. BB (N*=${techAnalysis.bollingerOptimization.optimalWindowN})`,
                },
                { key: 'showKeltner', label: 'Keltner (20,2 ATR)' },
                { key: 'showCCI50', label: '34 EMA & 50 CCI' },
                { key: 'showCourtney', label: 'Courtney (13,8,4 + CCI)' },
                { key: 'showMACD', label: 'MACD (12,26,9)' },
                { key: 'showMorrisFilter', label: 'Morris (%D/RSI)' },
              ] as Array<{ key: ChartOverlayKey; label: string }>
            ).map((item) => {
              const active = settings[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleToggleOverlay(item.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <span className="text-slate-300 dark:text-slate-700 mx-1" aria-hidden="true">
              |
            </span>

            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, showEMA10: !s.showEMA10 }))}
              title="Greg Morris Kısa Vadeli Mum Trend Referansı: EMA(10)"
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                settings.showEMA10
                  ? 'bg-pink-500/10 border-pink-500/40 text-pink-700 dark:text-pink-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              EMA 10
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, showEMA20: !s.showEMA20 }))}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                settings.showEMA20
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              EMA 20
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, showEMA50: !s.showEMA50 }))}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                settings.showEMA50
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              EMA 50
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, candlePower: !s.candlePower }))}
              title="Greg Morris CandlePower: İşlem hacmine göre genişleyen/incelen mum gövdeleri"
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                settings.candlePower
                  ? 'bg-violet-500/10 border-violet-500/40 text-violet-700 dark:text-violet-300 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              CandlePower
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, showVolume: !s.showVolume }))}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                settings.showVolume
                  ? 'bg-slate-900/10 dark:bg-slate-100/10 border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Hacim
            </button>
          </div>

          {/* Live Price Action Market Regime & Top-Down Bar (Trading Bible) */}
          {activeCandles.length > 20 && (
            <div className="px-6 py-2 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-slate-500 dark:text-slate-400">Piyasa Yapısı:</span>
                <span
                  className={`font-semibold ${
                    techAnalysis.marketRegime.regime === 'uptrend'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : techAnalysis.marketRegime.regime === 'downtrend'
                        ? 'text-red-600 dark:text-red-400'
                        : techAnalysis.marketRegime.regime === 'choppy'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {techAnalysis.marketRegime.turkishTitle}
                </span>
                <span className="text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {techAnalysis.marketRegime.waveLabel}
                </span>
                {topDownSummary && (
                  <>
                    <span className="text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Top-Down ({topDownSummary.higherTimeframe.toUpperCase()}):{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">
                        {topDownSummary.htfRegimeLabel}
                      </strong>
                    </span>
                  </>
                )}
              </div>

              <span
                className={`text-[11.5px] ${
                  techAnalysis.marketRegime.regime === 'choppy' ||
                  topDownSummary?.nearHtfResistance
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {topDownSummary?.nearHtfResistance
                  ? 'Üst zaman dilimi ana direnç duvarına yakın!'
                  : topDownSummary?.nearHtfSupport
                    ? 'Üst zaman dilimi ana destek bölgesinde (Boğa teyidi arayın)'
                    : techAnalysis.marketRegime.regime === 'choppy'
                      ? 'Choppy gürültülü piyasa — işlem açmaktan kaçının'
                      : 'Sniper kuralı: En az 3 Confluence faktörü + min 1:2 R:R arayın'}
              </span>
            </div>
          )}

          {singlePatternFilterId && (
            <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between gap-4 text-xs">
              <span className="text-blue-900 dark:text-blue-200">
                Yalnızca{' '}
                <strong className="font-semibold">
                  {PATTERN_MAP[singlePatternFilterId]?.turkishName} (
                  {PATTERN_MAP[singlePatternFilterId]?.englishName})
                </strong>{' '}
                formasyonu filtreleniyor.
              </span>
              <button
                type="button"
                onClick={() => setSinglePatternFilterId(null)}
                className="font-semibold text-blue-700 dark:text-blue-300 hover:underline whitespace-nowrap shrink-0"
              >
                Tüm {PATTERNS_CATALOG.length} Formasyonu Göster
              </button>
            </div>
          )}

          {/* Main Workspace Grid */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
            <div className="xl:col-span-9 flex flex-col min-w-0">
              <div
                className={`relative border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] ${
                  settings.showMACD && settings.showMorrisFilter
                    ? 'h-[600px]'
                    : settings.showMACD || settings.showMorrisFilter
                      ? 'h-[540px]'
                      : 'h-[470px]'
                }`}
              >
                {loadingCandles && activeCandles.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                    Canlı mum verileri yükleniyor...
                  </div>
                ) : fetchError && activeCandles.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      {fetchError}
                    </p>
                    <button
                      type="button"
                      onClick={() => loadMarketCandles(selectedInstrument, timeframe, false)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                    >
                      Tekrar Dene
                    </button>
                  </div>
                ) : (
                  <CandlestickChart
                    candles={activeCandles}
                    patterns={detectedPatterns}
                    techAnalysis={techAnalysis}
                    settings={effectiveSettings}
                    decimals={selectedInstrument.decimals}
                    timeframe={timeframe}
                    isDark={isDark}
                    selectedCandleIndex={resolvedCandleIndex}
                    selectedPatternId={selectedPattern?.id ?? null}
                    focusBarIndex={focusBarIndex}
                    onSelectCandle={(idx) => {
                      setSelectedCandleIndex(idx);
                      if (inspectorTab === 'pattern') setInspectorTab('candle');
                    }}
                    onSelectPattern={(pat) => {
                      setSelectedPatternId(pat.id);
                      setInspectorTab('pattern');
                    }}
                  />
                )}
              </div>

              {/* Bottom Detected Patterns Live Stream Table */}
              <div className="flex-1 bg-white dark:bg-[#0F172A] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Grafikte Tespit Edilen Mum Formasyonları ({filteredTablePatterns.length})
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Satıra tıklayarak ilgili formasyona odaklanabilir, teyit ve stoploss seviyelerini inceleyebilirsiniz.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      {[
                        { id: 'all', label: 'Tümü' },
                        { id: 'bullish', label: 'Boğa' },
                        { id: 'bearish', label: 'Ayı' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setTableDirectionFilter(d.id as 'all' | 'bullish' | 'bearish')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            tableDirectionFilter === d.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({ ...s, onlyMorrisFiltered: !s.onlyMorrisFiltered }))
                      }
                      title="Sadece Greg Morris Stokastik %D / RSI / %B ön-sinyal eşiğinde oluşan formasyonları göster"
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        settings.onlyMorrisFiltered
                          ? 'bg-violet-600/10 border-violet-500/40 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {settings.onlyMorrisFiltered ? '✓ ' : ''}Morris Filtreli [F]
                    </button>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      {[
                        { id: 'all', label: 'Tüm Durumlar' },
                        { id: 'confirmed', label: 'Onaylanmış' },
                        { id: 'not_confirmed', label: 'Onaylanmamış' },
                        { id: 'confirmed_fail', label: 'Başarısız' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setTableStatusFilter(st.id as 'all' | PatternStatus)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            tableStatusFilter === st.id
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3.5">Tarih / Saat</th>
                          <th className="py-2.5 px-3.5">Formasyon Adı</th>
                          <th className="py-2.5 px-3.5">Yön &amp; Yapı</th>
                          <th className="py-2.5 px-3.5">Durum</th>
                          <th className="py-2.5 px-3.5">Confluence &amp; R:R</th>
                          <th className="py-2.5 px-3.5 text-right">Teyit / %50 Giriş</th>
                          <th className="py-2.5 px-3.5 text-right">Stoploss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
                        {filteredTablePatterns.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-10 px-4 text-center text-slate-500 dark:text-slate-400"
                            >
                              Bu zaman dilimi ve filtrede tespit edilen mum formasyonu bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          filteredTablePatterns.map((pat) => {
                            const isSelected = selectedPattern?.id === pat.id;
                            const plan = pat.confluencePlan;
                            return (
                              <tr
                                key={pat.id}
                                onClick={() => handleSelectPatternRow(pat)}
                                className={`h-10 cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50/80 dark:bg-blue-950/35'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/45'
                                }`}
                              >
                                <td className="px-3.5 py-2 font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                  {formatSignalDate(pat.time, timeframe)}
                                </td>
                                <td className="px-3.5 py-2">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {pat.turkishName}
                                  </span>
                                  {pat.morrisFilter?.isFilteredSignal && (
                                    <span className="ml-1 font-mono text-[10.5px] font-bold text-violet-600 dark:text-violet-400">
                                      [F]
                                    </span>
                                  )}
                                  <span className="text-slate-400 dark:text-slate-500 ml-1.5 text-[11px]">
                                    ({pat.englishName})
                                  </span>
                                </td>
                                <td className="px-3.5 py-2 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${
                                      pat.direction === 'bullish'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}
                                  >
                                    {pat.direction === 'bullish' ? (
                                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span>{pat.direction === 'bullish' ? 'Boğa' : 'Ayı'}</span>
                                  </span>
                                  <span className="mx-1.5 text-slate-400" aria-hidden="true">
                                    ·
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400">
                                    {pat.patternType === 'continuation' ? 'Devam' : 'Dönüş'} · {pat.barCount}M
                                  </span>
                                </td>
                                <td className="px-3.5 py-2 whitespace-nowrap">
                                  {pat.status === 'confirmed' ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>Onaylanmış</span>
                                    </span>
                                  ) : pat.status === 'confirmed_fail' ? (
                                    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      <span>Onaylanmış &amp; Başarısız</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                      <Clock className="w-3.5 h-3.5 shrink-0" />
                                      <span>Onaylanmamış</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2 font-mono tabular-nums whitespace-nowrap">
                                  {plan ? (
                                    <span>
                                      <strong
                                        className={
                                          plan.confluenceScore >= 3
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : plan.confluenceScore >= 2
                                              ? 'text-amber-600 dark:text-amber-400'
                                              : 'text-slate-500'
                                        }
                                      >
                                        {plan.confluenceScore}/5
                                      </strong>
                                      <span className="mx-1.5 text-slate-400" aria-hidden="true">
                                        ·
                                      </span>
                                      <span className="text-slate-600 dark:text-slate-300">
                                        1:{plan.rrConservative}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2 text-right font-mono tabular-nums whitespace-nowrap">
                                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {pat.confirmationLevel.toFixed(selectedInstrument.decimals)}
                                  </span>
                                  {plan && (
                                    <span className="text-amber-600 dark:text-amber-400 ml-1.5 text-[11px]">
                                      / {plan.conservativeEntry.toFixed(selectedInstrument.decimals)}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2 text-right font-mono tabular-nums font-medium text-red-600 dark:text-red-400">
                                  {pat.stopLossLevel.toFixed(selectedInstrument.decimals)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Inspector Column */}
            <div className="xl:col-span-3 min-w-0">
              <CandleAnatomyPanel
                anatomy={candleAnatomy}
                selectedPattern={selectedPattern}
                techAnalysis={techAnalysis}
                topDownSummary={topDownSummary}
                activeTab={inspectorTab}
                onTabChange={setInspectorTab}
                totalCandles={activeCandles.length}
                decimals={selectedInstrument.decimals}
                currency={selectedInstrument.currency}
                currentPrice={lastCandle?.close ?? 0}
                settings={effectiveSettings}
                isDark={isDark}
                onStepCandle={(delta) => {
                  if (resolvedCandleIndex == null) return;
                  const next = Math.max(
                    0,
                    Math.min(activeCandles.length - 1, resolvedCandleIndex + delta)
                  );
                  setSelectedCandleIndex(next);
                  setFocusBarIndex(next);
                }}
                onToggleOverlay={handleToggleOverlay}
              />
            </div>
          </div>
        </main>
      )}

      {activeView === 'scanner' && (
        <main className="flex-1">
          <MarketScannerView
            settings={settings}
            onOpenInstrument={(inst, tf) => {
              setSelectedInstrument(inst);
              setTimeframe(tf);
              setSinglePatternFilterId(null);
              setActiveView('chart');
            }}
          />
        </main>
      )}

      {activeView === 'guide' && (
        <main className="flex-1">
          <PatternEncyclopediaView
            settings={settings}
            isDark={isDark}
            onFilterSinglePatternOnChart={(patternId) => {
              setSinglePatternFilterId(patternId);
              setActiveView('chart');
            }}
            onActivateOverlayOnChart={handleActivateOverlayFromGuide}
            onOpenPdfViewer={() => setActiveView('pdf')}
          />
        </main>
      )}

      {activeView === 'pdf' && (
        <main className="flex-1">
          <PdfReferenceView />
        </main>
      )}

      <PatternSettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={(next) => {
          setSinglePatternFilterId(null);
          setSettings(next);
        }}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
