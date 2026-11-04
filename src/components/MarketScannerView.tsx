import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MARKET_INSTRUMENTS, TIMEFRAMES } from '../data/instruments';
import { detectAllRawPatterns } from '../engine/candlestickEngine';
import {
  analyzeTechnicalStructure,
  evaluatePatternsConfluence,
} from '../engine/chartTechniquesEngine';
import type {
  Candle,
  DetectedPattern,
  MarketCategory,
  MarketInstrument,
  MarketRegimeInfo,
  PatternSettings,
  TechnicalStructureAnalysis,
  Timeframe,
} from '../types/market';

interface ScannerApiResponse {
  interval: string;
  items: Array<{
    instrument: {
      id: string;
      symbol: string;
      displaySymbol: string;
      name: string;
      category: MarketCategory;
      source: string;
    };
    candles: Candle[];
    error: string | null;
  }>;
}

interface MarketScannerViewProps {
  settings: PatternSettings;
  onOpenInstrument: (instrument: MarketInstrument, timeframe: Timeframe) => void;
}

interface ScannedRow {
  instrument: MarketInstrument;
  lastPrice: number;
  changePct: number;
  latestPattern: DetectedPattern | null;
  barsAgo: number | null;
  marketRegime: MarketRegimeInfo;
  macdStatus: TechnicalStructureAnalysis['macdStatus'];
  bollingerStrategy: TechnicalStructureAnalysis['bollingerStrategy'];
  bollingerOptimization: TechnicalStructureAnalysis['bollingerOptimization'];
  keltnerStrategy: TechnicalStructureAnalysis['keltnerStrategy'];
  cci50Strategy: TechnicalStructureAnalysis['cci50Strategy'];
  courtneyStrategy: TechnicalStructureAnalysis['courtneyStrategy'];
  structureSummary: string;
}

export function MarketScannerView({ settings, onOpenInstrument }: MarketScannerViewProps) {
  const [scanTimeframe, setScanTimeframe] = useState<Timeframe>('1h');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MarketCategory>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [sniperOnly, setSniperOnly] = useState<boolean>(false);
  const [morrisOnly, setMorrisOnly] = useState<boolean>(false);
  const [bbStrategyOnly, setBbStrategyOnly] = useState<boolean>(false);
  const [keltnerOnly, setKeltnerOnly] = useState<boolean>(false);
  const [cciOnly, setCciOnly] = useState<boolean>(false);
  const [courtneyOnly, setCourtneyOnly] = useState<boolean>(false);
  const [hideChoppy, setHideChoppy] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawItems, setRawItems] = useState<ScannerApiResponse['items']>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runScan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market/scanner?interval=${encodeURIComponent(scanTimeframe)}`);
      if (!res.ok) {
        throw new Error(`Tarama servisi yanıt vermedi (${res.status})`);
      }
      const data = (await res.json()) as ScannerApiResponse;
      setRawItems(data.items || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Piyasa taraması sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [scanTimeframe]);

  useEffect(() => {
    runScan();
  }, [runScan]);

  const rows: ScannedRow[] = useMemo(() => {
    const instMap = new Map(MARKET_INSTRUMENTS.map((m) => [m.id, m]));
    return rawItems
      .map((item) => {
        const inst = instMap.get(item.instrument.id);
        if (!inst || item.candles.length < 5) return null;
        const candles = item.candles;
        const last = candles[candles.length - 1];
        const prev = candles[Math.max(0, candles.length - 2)];
        const changePct = prev.close !== 0 ? ((last.close - prev.close) / prev.close) * 100 : 0;

        const tech = analyzeTechnicalStructure(candles);
        const rawDetected = detectAllRawPatterns(
          candles,
          settings.confirmBarCount,
          Math.max(0, candles.length - 60)
        ).filter(
          (p) =>
            settings.enabledPatterns[p.patternId] &&
            settings.showStatuses[p.status] &&
            settings.showRoles[p.patternType]
        );

        const enriched = evaluatePatternsConfluence(rawDetected, candles, tech);
        const visibleEnriched = settings.onlyMorrisFiltered
          ? enriched.filter((p) => p.morrisFilter?.isFilteredSignal)
          : enriched;
        const latestPattern =
          visibleEnriched.length > 0 ? visibleEnriched[visibleEnriched.length - 1] : null;
        const barsAgo = latestPattern ? candles.length - 1 - latestPattern.endIndex : null;

        let structureSummary = tech.marketRegime.turkishTitle;
        if (tech.geometricStructure) {
          structureSummary = `${tech.marketRegime.turkishTitle.split('(')[0].trim()} · ${tech.geometricStructure.turkishName}`;
        }

        return {
          instrument: inst,
          lastPrice: last.close,
          changePct,
          latestPattern,
          barsAgo,
          marketRegime: tech.marketRegime,
          macdStatus: tech.macdStatus,
          bollingerStrategy: tech.bollingerStrategy,
          bollingerOptimization: tech.bollingerOptimization,
          keltnerStrategy: tech.keltnerStrategy,
          cci50Strategy: tech.cci50Strategy,
          courtneyStrategy: tech.courtneyStrategy,
          structureSummary,
        };
      })
      .filter((r): r is ScannedRow => r !== null);
  }, [rawItems, settings]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter !== 'all' && r.instrument.category !== categoryFilter) return false;
      if (hideChoppy && r.marketRegime.regime === 'choppy') return false;
      if (sniperOnly) {
        if (!r.latestPattern?.confluencePlan || r.latestPattern.confluencePlan.confluenceScore < 3) {
          return false;
        }
      }
      if (morrisOnly) {
        if (!r.latestPattern?.morrisFilter?.isFilteredSignal) return false;
      }
      if (bbStrategyOnly) {
        const bs = r.bollingerStrategy;
        const bo = r.bollingerOptimization;
        const hasActiveBbSetup =
          bs.bbmaSignal.state === 'bullish_cross' ||
          bs.bbmaSignal.state === 'bearish_cross' ||
          bs.rsiBbSetup.state !== 'none' ||
          bs.volatilityRegime === 'squeeze' ||
          bs.bandPattern !== null ||
          bo.eq5Eq6Signal.state !== 'none' ||
          bo.bandDivergence !== null;
        if (!hasActiveBbSetup) return false;
      }
      if (keltnerOnly) {
        const ks = r.keltnerStrategy;
        const hasKeltnerSetup =
          ks.breakoutSignal.state !== 'none' ||
          ks.rangeRsi2Signal.state !== 'none' ||
          ks.pullbackStochRsiSignal.state !== 'none' ||
          ks.ttmSqueezeActive;
        if (!hasKeltnerSetup) return false;
      }
      if (cciOnly) {
        const cs = r.cci50Strategy;
        const hasCciSetup =
          cs.setup5034.state !== 'none' ||
          cs.setup5034z.state !== 'none' ||
          cs.setup50140.state !== 'none' ||
          cs.isChopZone;
        if (!hasCciSetup) return false;
      }
      if (courtneyOnly) {
        const ct = r.courtneyStrategy;
        const hasCourtneySetup =
          ct.dualConfluenceSignal.state !== 'none' ||
          ct.divergence.kind !== 'none' ||
          ct.trendingIgnoreOscWarning !== null;
        if (!hasCourtneySetup) return false;
      }
      if (directionFilter !== 'all') {
        if (!r.latestPattern || r.latestPattern.direction !== directionFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = r.instrument.displaySymbol.toLowerCase().includes(q);
        const matchName = r.instrument.name.toLowerCase().includes(q);
        const matchPat =
          r.latestPattern?.turkishName.toLowerCase().includes(q) ||
          r.latestPattern?.englishName.toLowerCase().includes(q) ||
          r.structureSummary.toLowerCase().includes(q) ||
          r.bollingerStrategy.bbmaSignal.label.toLowerCase().includes(q) ||
          r.bollingerStrategy.volatilityLabel.toLowerCase().includes(q) ||
          r.keltnerStrategy.channelLabel.toLowerCase().includes(q) ||
          r.cci50Strategy.trendLabel.toLowerCase().includes(q);
        if (!matchSymbol && !matchName && !matchPat) return false;
      }
      return true;
    });
  }, [
    rows,
    categoryFilter,
    directionFilter,
    sniperOnly,
    morrisOnly,
    bbStrategyOnly,
    keltnerOnly,
    cciOnly,
    courtneyOnly,
    hideChoppy,
    searchQuery,
  ]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Çoklu Piyasa Price Action &amp; Mum Formasyon Tarayıcısı
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            73 mum formasyonu (Dönüş &amp; Devam), Greg Morris %D/RSI ön-sinyal filtresi, HH/HL &amp; Choppy filtresi ve 1:2 R:R uyumunu aynı anda tarar.
            {lastUpdated && (
              <span className="ml-2 font-mono text-xs text-slate-500">
                · Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setScanTimeframe(tf.id)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  scanTimeframe === tf.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={runScan}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yeniden Tara</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all', label: 'Tüm Piyasalar' },
              { id: 'crypto', label: 'Kripto (7/24)' },
              { id: 'bist', label: 'BIST Pay & Endeks' },
              { id: 'forex', label: 'Döviz & Emtia' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as 'all' | MarketCategory)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {[
              { id: 'all', label: 'Tüm Yönler' },
              { id: 'bullish', label: 'Boğa' },
              { id: 'bearish', label: 'Ayı' },
            ].map((dir) => (
              <button
                key={dir.id}
                type="button"
                onClick={() => setDirectionFilter(dir.id as 'all' | 'bullish' | 'bearish')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  directionFilter === dir.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {dir.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSniperOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              sniperOnly
                ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {sniperOnly ? '✓ ' : ''}Sniper Confluence (≥3/5)
          </button>

          <button
            type="button"
            onClick={() => setMorrisOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              morrisOnly
                ? 'bg-violet-600/10 border-violet-500/40 text-violet-700 dark:text-violet-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {morrisOnly ? '✓ ' : ''}Morris Ön-Sinyal [F]
          </button>

          <button
            type="button"
            onClick={() => setBbStrategyOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              bbStrategyOnly
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {bbStrategyOnly ? '✓ ' : ''}BBMA &amp; RSI+BB Kurulumu
          </button>

          <button
            type="button"
            onClick={() => setKeltnerOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              keltnerOnly
                ? 'bg-orange-600/10 border-orange-500/40 text-orange-700 dark:text-orange-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {keltnerOnly ? '✓ ' : ''}Keltner 3-Yöntem
          </button>

          <button
            type="button"
            onClick={() => setCciOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              cciOnly
                ? 'bg-cyan-600/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {cciOnly ? '✓ ' : ''}50 CCI (5034 / 50140)
          </button>

          <button
            type="button"
            onClick={() => setCourtneyOnly((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              courtneyOnly
                ? 'bg-teal-600/10 border-teal-500/40 text-teal-700 dark:text-teal-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {courtneyOnly ? '✓ ' : ''}Courtney (13,8,4 + CCI20)
          </button>

          <button
            type="button"
            onClick={() => setHideChoppy((v) => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              hideChoppy
                ? 'bg-amber-600/10 border-amber-500/40 text-amber-700 dark:text-amber-300 font-semibold'
                : 'bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {hideChoppy ? '✓ ' : ''}Choppy Gürültüyü Gizle
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sembol, Pin Bar, Fakey, HH/HL..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Enstrüman</th>
                <th className="py-3 px-4 text-right">Son Fiyat</th>
                <th className="py-3 px-4 text-right">Bar Değişim</th>
                <th className="py-3 px-4">Son Mum Formasyonu</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Confluence &amp; R:R</th>
                <th className="py-3 px-4">Piyasa Yapısı (Rejim)</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {loading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <tr key={idx} className="h-11 animate-pulse">
                      <td className="px-4 py-2.5" colSpan={8}>
                        <div className="h-4 bg-slate-100 dark:bg-slate-800/80 rounded w-full" />
                      </td>
                    </tr>
                  ))
                : filteredRows.length === 0
                  ? (
                    <tr>
                      <td colSpan={8} className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
                        Seçili filtrelere uygun enstrüman veya kurulum bulunamadı.
                      </td>
                    </tr>
                    )
                  : filteredRows.map((row) => {
                      const pat = row.latestPattern;
                      const plan = pat?.confluencePlan;
                      const dec = row.instrument.decimals;
                      return (
                        <tr
                          key={row.instrument.id}
                          className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {row.instrument.displaySymbol}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {row.instrument.name}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                            {row.lastPrice.toFixed(dec)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-mono tabular-nums font-medium ${
                              row.changePct >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {row.changePct >= 0 ? '+' : ''}
                            {row.changePct.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2.5">
                            {pat ? (
                              <div className="flex items-center gap-1.5">
                                {pat.direction === 'bullish' ? (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <div>
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {pat.turkishName}
                                  </span>
                                  {pat.morrisFilter?.isFilteredSignal && (
                                    <span className="ml-1 font-mono text-[10.5px] font-bold text-violet-600 dark:text-violet-400">
                                      [F]
                                    </span>
                                  )}
                                  {row.barsAgo != null && (
                                    <span className="text-slate-400 dark:text-slate-500 ml-1.5 font-mono text-[11px]">
                                      ({row.barsAgo === 0 ? 'Son bar' : `-${row.barsAgo}b`})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                Son 60 barda sinyal yok
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {pat ? (
                              pat.status === 'confirmed' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Onaylanmış</span>
                                </span>
                              ) : pat.status === 'confirmed_fail' ? (
                                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Başarısız</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span>Onaylanmamış</span>
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono tabular-nums whitespace-nowrap">
                            {plan ? (
                              <div>
                                <span
                                  className={`font-semibold ${
                                    plan.confluenceScore >= 3
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : plan.confluenceScore >= 2
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-slate-500'
                                  }`}
                                >
                                  {plan.confluenceScore}/5
                                </span>
                                <span className="mx-1.5 text-slate-400" aria-hidden="true">
                                  ·
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                  1:{plan.rrConservative}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`font-medium ${
                                row.marketRegime.regime === 'uptrend'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : row.marketRegime.regime === 'downtrend'
                                    ? 'text-red-600 dark:text-red-400'
                                    : row.marketRegime.regime === 'choppy'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-sky-600 dark:text-sky-400'
                              }`}
                            >
                              {row.marketRegime.turkishTitle}
                            </span>
                            <span className="block text-[10.5px] text-slate-500 dark:text-slate-400">
                              {row.marketRegime.waveLabel}
                              {(row.bollingerStrategy.bbmaSignal.state === 'bullish_cross' ||
                                row.bollingerStrategy.bbmaSignal.state === 'bearish_cross') && (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  {' · '}
                                  {row.bollingerStrategy.bbmaSignal.state === 'bullish_cross'
                                    ? 'BBMA AL Kesişimi'
                                    : 'BBMA SAT Kesişimi'}
                                </span>
                              )}
                              {row.bollingerStrategy.rsiBbSetup.state !== 'none' && (
                                <span className="text-violet-600 dark:text-violet-400 font-semibold">
                                  {' · '}
                                  {row.bollingerStrategy.rsiBbSetup.state === 'buy_triggered'
                                    ? 'RSI+BB AL Onaylı'
                                    : row.bollingerStrategy.rsiBbSetup.state === 'sell_triggered'
                                      ? 'RSI+BB SAT Onaylı'
                                      : 'RSI+BB Hazırlık'}
                                </span>
                              )}
                              {row.bollingerStrategy.volatilityRegime === 'squeeze' && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {' · '}BB Squeeze
                                </span>
                              )}
                              {row.bollingerOptimization.eq5Eq6Signal.state !== 'none' && (
                                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                  {' · '}
                                  {row.bollingerOptimization.eq5Eq6Signal.state === 'buy_reentry'
                                    ? 'Denklem 5 AL'
                                    : 'Denklem 6 SAT'}
                                </span>
                              )}
                              {row.keltnerStrategy.breakoutSignal.state !== 'none' && (
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                  {' · '}
                                  {row.keltnerStrategy.breakoutSignal.state === 'buy_breakout'
                                    ? 'KC+ADX AL'
                                    : 'KC+ADX SAT'}
                                </span>
                              )}
                              {row.keltnerStrategy.rangeRsi2Signal.state !== 'none' && (
                                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                  {' · '}
                                  {row.keltnerStrategy.rangeRsi2Signal.state === 'buy_range'
                                    ? 'KC+RSI(2) AL'
                                    : 'KC+RSI(2) SAT'}
                                </span>
                              )}
                              {row.keltnerStrategy.pullbackStochRsiSignal.state !== 'none' && (
                                <span className="text-sky-600 dark:text-sky-400 font-semibold">
                                  {' · '}
                                  {row.keltnerStrategy.pullbackStochRsiSignal.state ===
                                  'buy_pullback'
                                    ? 'KC Pullback AL'
                                    : 'KC Pullback SAT'}
                                </span>
                              )}
                              {row.keltnerStrategy.ttmSqueezeActive && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {' · '}TTM Squeeze
                                </span>
                              )}
                              {row.cci50Strategy.setup5034.state !== 'none' && (
                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                  {' · '}
                                  {row.cci50Strategy.setup5034.state === 'buy_5034'
                                    ? '5034 Dönüş AL'
                                    : '5034 Dönüş SAT'}
                                </span>
                              )}
                              {row.cci50Strategy.setup5034z.state !== 'none' && (
                                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                                  {' · '}
                                  {row.cci50Strategy.setup5034z.state === 'buy_5034z'
                                    ? '5034z ZLR AL'
                                    : '5034z ZLR SAT'}
                                </span>
                              )}
                              {row.cci50Strategy.setup50140.state !== 'none' && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {' · '}
                                  {row.cci50Strategy.setup50140.state === 'buy_50140'
                                    ? '50140 Devam AL'
                                    : '50140 Devam SAT'}
                                </span>
                              )}
                              {row.cci50Strategy.isChopZone && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  {' · '}Chop
                                </span>
                              )}
                              {row.courtneyStrategy.dualConfluenceSignal.state !== 'none' && (
                                <span className="text-teal-600 dark:text-teal-400 font-semibold">
                                  {' · '}
                                  {row.courtneyStrategy.dualConfluenceSignal.state ===
                                  'buy_confluence'
                                    ? 'Courtney AL'
                                    : 'Courtney SAT'}
                                </span>
                              )}
                              {row.courtneyStrategy.divergence.kind !== 'none' && (
                                <span className="text-teal-500 font-semibold">
                                  {' · '}
                                  {row.courtneyStrategy.divergence.kind === 'bullish_divergence'
                                    ? 'Courtney Boğa Div'
                                    : 'Courtney Ayı Div'}
                                </span>
                              )}
                              <span className="font-mono text-slate-400 dark:text-slate-500">
                                {' · '}N*={row.bollingerOptimization.optimalWindowN}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => onOpenInstrument(row.instrument, scanTimeframe)}
                              className="px-3 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                            >
                              Grafikte Aç
                            </button>
                          </td>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
