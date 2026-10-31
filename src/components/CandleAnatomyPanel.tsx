import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { PATTERN_MAP } from '../data/patternsCatalog';
import { PatternSchematic } from './PatternSchematic';
import type {
  CandleAnatomy,
  ChartOverlayKey,
  DetectedPattern,
  PatternBreakdownInfo,
  PatternSettings,
  PatternStatus,
  TechnicalStructureAnalysis,
  TopDownSummary,
} from '../types/market';

interface CandleAnatomyPanelProps {
  anatomy: CandleAnatomy | null;
  selectedPattern: DetectedPattern | null;
  techAnalysis: TechnicalStructureAnalysis;
  topDownSummary: TopDownSummary | null;
  activeTab: 'candle' | 'pattern' | 'structure';
  onTabChange: (tab: 'candle' | 'pattern' | 'structure') => void;
  totalCandles: number;
  decimals: number;
  currency: string;
  currentPrice: number;
  settings: PatternSettings;
  isDark: boolean;
  onStepCandle: (delta: number) => void;
  onToggleOverlay: (key: ChartOverlayKey) => void;
}

function renderStatusLabel(status: PatternStatus) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Onaylanmış (Confirmed)</span>
      </span>
    );
  }
  if (status === 'confirmed_fail') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Onaylanmış ve Başarısız</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Onaylanmamış (Bekliyor)</span>
    </span>
  );
}

export function CandleAnatomyPanel({
  anatomy,
  selectedPattern,
  techAnalysis,
  topDownSummary,
  activeTab,
  onTabChange,
  totalCandles,
  decimals,
  currency,
  currentPrice,
  settings,
  isDark,
  onStepCandle,
  onToggleOverlay,
}: CandleAnatomyPanelProps) {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<1 | 2>(1);
  const [entryMode, setEntryMode] = useState<'conservative' | 'aggressive'>('conservative');

  const patternDef = selectedPattern ? PATTERN_MAP[selectedPattern.patternId] : null;
  const plan = selectedPattern?.confluencePlan ?? null;

  const chosenEntry =
    plan == null
      ? 0
      : entryMode === 'conservative'
        ? plan.conservativeEntry
        : plan.aggressiveEntry;
  const unitStopDistance =
    plan == null ? 0 : Math.max(Math.abs(chosenEntry - plan.protectiveStop), 1e-9);
  const maxRiskAmount = (Math.max(0, accountBalance) * riskPercent) / 100;
  const positionUnits = plan && unitStopDistance > 0 ? maxRiskAmount / unitStopDistance : 0;

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800">
      {/* 3-Tab Segmented Control */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
          <button
            type="button"
            onClick={() => onTabChange('candle')}
            className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'candle'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Mum Okuma
          </button>
          <button
            type="button"
            onClick={() => onTabChange('pattern')}
            className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pattern'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Formasyon
          </button>
          <button
            type="button"
            onClick={() => onTabChange('structure')}
            className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'structure'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Teknik Yapı
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'candle' &&
          (anatomy ? (
            <>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>Bar #{anatomy.index + 1}</span>
                    <span className="mx-1.5" aria-hidden="true">
                      ·
                    </span>
                    <span>
                      {anatomy.index === totalCandles - 1 ? 'Canlı Son Mum' : 'Seçili Geçmiş Mum'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {anatomy.candleTypeLabel}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={anatomy.index <= 0}
                    onClick={() => onStepCandle(-1)}
                    title="Önceki Mum"
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={anatomy.index >= totalCandles - 1}
                    onClick={() => onStepCandle(1)}
                    title="Sonraki Mum"
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center py-2">
                <div className="col-span-5 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/70 rounded-lg border border-slate-200 dark:border-slate-800 py-3 px-2 h-44">
                  <AnatomyCandleDiagram
                    anatomy={anatomy}
                    candleStyle={settings.candleStyle}
                    isDark={isDark}
                  />
                </div>

                <div className="col-span-7 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Üst Gölge</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      %{anatomy.upperWickPct.toFixed(1)} ({anatomy.upperWick.toFixed(decimals)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Gövde Boyu</span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        anatomy.isBullish
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : anatomy.isBearish
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      %{anatomy.bodyPct.toFixed(1)} ({anatomy.bodySize.toFixed(decimals)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Alt Gölge</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      %{anatomy.lowerWickPct.toFixed(1)} ({anatomy.lowerWick.toFixed(decimals)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Toplam Aralık</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {anatomy.totalRange.toFixed(decimals)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Seans Baskısı</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {anatomy.pressureLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Piyasa Yapısı</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {techAnalysis.marketRegime.turkishTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Bağıl Hacim (14 Ort.)</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {anatomy.volumeRatio.toFixed(2)}x
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2.5">
                  Mum Psikolojisi ve Okuma Analizi
                </h4>
                <ul className="space-y-2.5">
                  {anatomy.readingNotes.map((note, idx) => (
                    <li
                      key={idx}
                      className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 flex gap-2"
                    >
                      <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0">
                        0{idx + 1}.
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              İncelemek istediğiniz muma grafik üzerinden tıklayın.
            </div>
          ))}

        {activeTab === 'pattern' &&
          (selectedPattern ? (
            <>
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    {selectedPattern.direction === 'bullish' ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Boğa</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        <span>Ayı</span>
                      </>
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {selectedPattern.patternType === 'continuation' ? 'Devam Yapısı' : 'Dönüş Yapısı'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPattern.barCount} Mum</span>
                  {patternDef && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        {patternDef.sourceBook || 'Matriks'} s.{patternDef.pdfPage}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedPattern.turkishName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedPattern.englishName}
                  {selectedPattern.japaneseName && (
                    <span className="italic ml-1.5 text-slate-400 dark:text-slate-500">
                      ({selectedPattern.japaneseName})
                    </span>
                  )}
                </p>
                {selectedPattern.isTopPerformer && (
                  <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    ★ Greg Morris Top-15 İstikrarlı Performans Formasyonu (3, 5 ve 7 Bar)
                  </p>
                )}

                <div className="pt-1">{renderStatusLabel(selectedPattern.status)}</div>
              </div>

              {/* Greg Morris Pattern Breakdown (Tek Muma İndirgeme — Bölüm 3 & 4) */}
              {selectedPattern.breakdown && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Tek Muma İndirgeme (Morris Breakdown)
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        selectedPattern.breakdown.alignment === 'supports'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : selectedPattern.breakdown.alignment === 'conflicts'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {selectedPattern.breakdown.alignment === 'supports'
                        ? '✓ Destekliyor'
                        : selectedPattern.breakdown.alignment === 'conflicts'
                          ? '! Teyit Zorunlu'
                          : 'Denge'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2.5 items-center">
                    <div className="col-span-4 flex items-center justify-center bg-white dark:bg-[#0B1120] rounded border border-slate-200 dark:border-slate-800 py-2 px-1 h-24">
                      <ReducedCandleDiagram
                        breakdown={selectedPattern.breakdown}
                        candleStyle={settings.candleStyle}
                        isDark={isDark}
                      />
                    </div>
                    <div className="col-span-8 space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedPattern.breakdown.reducedLabel}
                      </div>
                      <div className="font-mono tabular-nums text-[10.5px] text-slate-500 dark:text-slate-400">
                        A:{selectedPattern.breakdown.open.toFixed(decimals)} · Y:
                        {selectedPattern.breakdown.high.toFixed(decimals)} · D:
                        {selectedPattern.breakdown.low.toFixed(decimals)} · K:
                        {selectedPattern.breakdown.close.toFixed(decimals)}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {selectedPattern.breakdown.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Greg Morris Pre-Signal Filtering Status (Bölüm 8) */}
              {selectedPattern.morrisFilter && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Morris Ön-Sinyal Filtresi
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        selectedPattern.morrisFilter.isFilteredSignal
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {selectedPattern.morrisFilter.isFilteredSignal ? '✓ Filtre Onaylı [F]' : 'Standart'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {selectedPattern.morrisFilter.triggerSummary}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums text-[10.5px] text-slate-500 dark:text-slate-400">
                    <span>
                      %D:{' '}
                      {selectedPattern.morrisFilter.stochDAtSignal != null
                        ? selectedPattern.morrisFilter.stochDAtSignal.toFixed(1)
                        : '—'}
                    </span>
                    <span>
                      RSI:{' '}
                      {selectedPattern.morrisFilter.rsiAtSignal != null
                        ? selectedPattern.morrisFilter.rsiAtSignal.toFixed(1)
                        : '—'}
                    </span>
                    <span>
                      %B:{' '}
                      {selectedPattern.morrisFilter.bollingerPctBAtSignal != null
                        ? `${(selectedPattern.morrisFilter.bollingerPctBAtSignal * 100).toFixed(0)}%`
                        : '—'}
                    </span>
                    <span>
                      EMA10: {selectedPattern.morrisFilter.ema10Aligned ? 'Uyumlu' : 'Zayıf'}
                    </span>
                  </div>
                </div>
              )}

              {/* Sniper Confluence Score & Warnings (Trading Bible) */}
              {plan && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Sniper Confluence Puanı</span>
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        plan.confluenceScore >= 3
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : plan.confluenceScore >= 2
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.confluenceScore} / 5 Faktör
                    </span>
                  </div>

                  {plan.isChoppyMarketWarning && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex gap-2 leading-relaxed">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Choppy Piyasa Uyarısı:</strong> Fiyat şu an yönsüz/gürültülü
                        seyrediyor. Trading Bible kuralı gereği sinyal kalitesi düşüktür; uzak durun.
                      </span>
                    </div>
                  )}

                  {plan.isCounterTrendWarning && !plan.isChoppyMarketWarning && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 leading-relaxed">
                      <strong>Ana Trende Karşı Sinyal:</strong> Akıntıya karşı işlem açmayın; yalnızca
                      üst zaman dilimi ana S/R duvarında ise değerlendirin.
                    </div>
                  )}

                  {plan.confluenceFactors.length > 0 ? (
                    <ul className="space-y-1 pt-0.5">
                      {plan.confluenceFactors.map((fac, idx) => (
                        <li
                          key={idx}
                          className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5"
                        >
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                          <span>{fac}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sinyal boşlukta oluştu (S/R, MA21 veya Fib kesişimi zayıf). Tek başına mumla
                      işlem açılması önerilmez.
                    </p>
                  )}
                </div>
              )}

              {/* Teyit & Stoploss Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Teyit Seviyesi
                  </span>
                  <span className="block mt-1 text-sm font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedPattern.confirmationLevel.toFixed(decimals)}
                  </span>
                  {currentPrice > 0 && (
                    <span className="block mt-0.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      Fark:{' '}
                      {(
                        ((selectedPattern.confirmationLevel - currentPrice) / currentPrice) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    Stoploss Seviyesi
                  </span>
                  <span className="block mt-1 text-sm font-mono tabular-nums font-semibold text-red-600 dark:text-red-400">
                    {selectedPattern.stopLossLevel.toFixed(decimals)}
                  </span>
                  {currentPrice > 0 && (
                    <span className="block mt-0.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      Fark:{' '}
                      {(
                        ((selectedPattern.stopLossLevel - currentPrice) / currentPrice) *
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  )}
                </div>
              </div>

              {/* Trading Bible Entry Tactics (%50 Retracement vs Close) & 1:2 R:R */}
              {plan && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      Giriş Taktikleri &amp; R:R Planı
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        plan.meetsTwoToOneRule
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {plan.meetsTwoToOneRule ? '✓ Min 1:2 R:R Uygun' : '✕ Düşük R:R (<1:2)'}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono tabular-nums text-[11px]">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                      <span className="font-sans text-slate-600 dark:text-slate-400">
                        Agresif (Kapanış)
                      </span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {plan.aggressiveEntry.toFixed(decimals)} ·{' '}
                        <strong className="text-sky-600 dark:text-sky-400">
                          1:{plan.rrAggressive}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/70 dark:border-slate-800">
                      <span className="font-sans text-amber-700 dark:text-amber-400 font-medium">
                        %50 Geri Çekilme (Limit)
                      </span>
                      <span className="text-slate-900 dark:text-slate-100">
                        {plan.conservativeEntry.toFixed(decimals)} ·{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          1:{plan.rrConservative}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-sans text-slate-600 dark:text-slate-400">
                        Sonraki Karşıt Hedef (TP)
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold">
                        {plan.nextTargetPrice.toFixed(decimals)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Money Management %1 / %2 Position Sizing Calculator */}
              {plan && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Sermaye &amp; Pozisyon Hesaplayıcı (Max %2 Risk)
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="mm-balance"
                        className="block text-[10.5px] text-slate-500 dark:text-slate-400 mb-1"
                      >
                        Kasa Bakiyesi ({currency})
                      </label>
                      <input
                        id="mm-balance"
                        type="number"
                        min={100}
                        step={500}
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-2 py-1 text-xs font-mono tabular-nums rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="block text-[10.5px] text-slate-500 dark:text-slate-400 mb-1">
                        İşlem Riski &amp; Giriş
                      </span>
                      <div className="flex items-center gap-1">
                        {([1, 2] as const).map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setRiskPercent(pct)}
                            className={`flex-1 py-1 text-[11px] font-mono font-semibold rounded border transition-colors ${
                              riskPercent === pct
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            %{pct}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setEntryMode((m) =>
                              m === 'conservative' ? 'aggressive' : 'conservative'
                            )
                          }
                          title="Giriş yöntemini değiştir (%50 Limit / Kapanış)"
                          className="px-1.5 py-1 text-[10.5px] font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        >
                          {entryMode === 'conservative' ? '%50' : 'Kap.'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between font-mono tabular-nums text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      1R Risk:{' '}
                      <strong className="text-red-600 dark:text-red-400">
                        {maxRiskAmount.toFixed(2)} {currency}
                      </strong>
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">
                      Büyüklük:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {positionUnits >= 10
                          ? positionUnits.toFixed(1)
                          : positionUnits.toFixed(4)}{' '}
                        adet
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Formasyon Yaşam Döngüsü (Confirm Bar: {settings.confirmBarCount})
                </div>
                {selectedPattern.status === 'confirmed' && selectedPattern.confirmedAtIndex != null && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Formasyon tamamlandıktan sonraki{' '}
                    <span className="font-mono font-semibold">
                      {selectedPattern.confirmedAtIndex - selectedPattern.endIndex}.
                    </span>{' '}
                    barda kapanış fiyatı teyit seviyesini aşarak{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Onaylanmış
                    </span>{' '}
                    durumuna geçti.
                  </p>
                )}
                {selectedPattern.status === 'confirmed_fail' && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Önce{' '}
                    <span className="font-mono font-semibold">
                      {(selectedPattern.confirmedAtIndex ?? selectedPattern.endIndex) -
                        selectedPattern.endIndex}
                      .
                    </span>{' '}
                    barda teyit seviyesine ulaşıldı; ardından{' '}
                    <span className="font-mono font-semibold">
                      {(selectedPattern.failedAtIndex ?? selectedPattern.endIndex) -
                        selectedPattern.endIndex}
                      .
                    </span>{' '}
                    barda kapanış stoploss seviyesini kırarak{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Onaylanmış ve Başarısız
                    </span>{' '}
                    oldu.
                  </p>
                )}
                {selectedPattern.status === 'not_confirmed' && (
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Takip eden {settings.confirmBarCount} bar içerisinde kapanış fiyatı henüz teyit
                    seviyesini ({selectedPattern.confirmationLevel.toFixed(decimals)}) aşmadı.
                  </p>
                )}
              </div>

              {patternDef && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Referans Mum Şeması
                  </h4>
                  <PatternSchematic
                    pattern={patternDef}
                    candleStyle={settings.candleStyle}
                    isDark={isDark}
                    height={138}
                  />
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-1">
                    Formasyon Tanımı
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPattern.summary}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                    Teyit Kuralı
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPattern.confirmationRule}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">
                    Stoploss Kuralı
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedPattern.stopLossRule}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 px-2 text-center space-y-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Henüz bir mum formasyonu seçilmedi
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Grafik üzerindeki renkli formasyon kutularına veya alt listedeki sinyal satırlarına
                tıklayarak Confluence puanı, %50 giriş ve 1:2 R:R planını inceleyebilirsiniz.
              </p>
            </div>
          ))}

        {/* TAB 3: TEKNİK YAPI & PRICE ACTION ANALİZİ */}
        {activeTab === 'structure' && (
          <div className="space-y-5 text-xs">
            {/* Quick Layer Toggles */}
            <div className="pb-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Grafik Okuma &amp; Price Action Katmanları
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'showSRZones', label: 'Destek / Direnç' },
                    { key: 'showSupplyDemand', label: 'Arz/Talep & HH/HL' },
                    { key: 'showMA8_21', label: 'Dinamik MA 8 & 21' },
                    { key: 'showTrendChannel', label: 'Trend & Kanal' },
                    { key: 'showGeometric', label: 'Üçgen & Sıkışma' },
                    { key: 'showFibonacci', label: 'Fibonacci' },
                    { key: 'showBollinger', label: 'Bollinger & BBMA' },
                    { key: 'useAdaptiveBollinger', label: `Opt. BB (N*=${techAnalysis.bollingerOptimization.optimalWindowN})` },
                    { key: 'showKeltner', label: 'Keltner (20,2 ATR)' },
                    { key: 'showMACD', label: 'MACD (12,26,9)' },
                    { key: 'showMorrisFilter', label: 'Morris (%D & RSI)' },
                  ] as Array<{ key: ChartOverlayKey; label: string }>
                ).map((item) => {
                  const active = settings[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onToggleOverlay(item.key)}
                      className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md border text-left transition-colors whitespace-nowrap truncate ${
                        active
                          ? 'bg-blue-600/10 border-blue-500/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 00. Sakata 5 Yöntemi & Greg Morris Kantitatif Özeti */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Sakata &amp; Greg Morris Kantitatif Özeti
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-semibold ${
                      techAnalysis.sakataMorris.ema10Trend === 'uptrend'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.sakataMorris.ema10Trend === 'downtrend'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {techAnalysis.sakataMorris.ema10Label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300">
                  Ön-Sinyal:{' '}
                  <strong
                    className={
                      techAnalysis.sakataMorris.preSignalState === 'buy_zone'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.sakataMorris.preSignalState === 'sell_zone'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-400'
                    }
                  >
                    {techAnalysis.sakataMorris.preSignalLabel}
                  </strong>
                </div>
                <div className="flex items-center justify-between font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>
                    Shinne Hatte:{' '}
                    {techAnalysis.sakataMorris.newPriceRecordCount > 0
                      ? `${techAnalysis.sakataMorris.newPriceRecordCount} Yeni ${
                          techAnalysis.sakataMorris.newPriceRecordDirection === 'highs'
                            ? 'Zirve'
                            : 'Dip'
                        }`
                      : 'Dengeli'}
                  </span>
                  <span>
                    San-ku:{' '}
                    {techAnalysis.sakataMorris.threeGapsExhaustion ? '3 Boşluk Uyarısı!' : 'Normal'}
                  </span>
                </div>
                {techAnalysis.sakataMorris.shinneHatteWarning && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5 leading-relaxed">
                    {techAnalysis.sakataMorris.shinneHatteWarning}
                  </p>
                )}
              </div>
            </div>

            {/* 00B. Bollinger Strateji Sistemi (BBMA 50 EMA & Öncü RSI + Orta Bant) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Bollinger Strateji Sistemi (BBMA &amp; RSI)
                </span>
                {techAnalysis.bollingerStrategy.bandWidthPct != null && (
                  <span className="font-mono tabular-nums text-[11px] text-violet-600 dark:text-violet-400">
                    BW %{techAnalysis.bollingerStrategy.bandWidthPct.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                {/* Volatility / Squeeze / Walking the Band */}
                <div>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Volatilite Rejimi
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.bollingerStrategy.volatilityRegime === 'squeeze'
                        ? 'text-amber-600 dark:text-amber-400'
                        : techAnalysis.bollingerStrategy.volatilityRegime === 'walking_upper'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : techAnalysis.bollingerStrategy.volatilityRegime === 'walking_lower'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {techAnalysis.bollingerStrategy.volatilityLabel}
                  </span>
                </div>

                {techAnalysis.bollingerStrategy.bandPattern && (
                  <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                      Bant Üzeri Formasyon Onayı
                    </span>
                    <span
                      className={`font-semibold ${
                        techAnalysis.bollingerStrategy.bandPattern.kind === 'w_bottom'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {techAnalysis.bollingerStrategy.bandPattern.label}
                    </span>
                  </div>
                )}

                {/* Strategy 1: BBMA (50 EMA x Middle BB) */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Strateji 1 — BBMA (Orta Bant 20 SMA × 50 EMA)
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.bollingerStrategy.bbmaSignal.state.startsWith('bullish')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.bollingerStrategy.bbmaSignal.state.startsWith('bearish')
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {techAnalysis.bollingerStrategy.bbmaSignal.label}
                  </span>
                </div>

                {/* Strategy 2: Leading RSI (30/70) + Bollinger Outside + Middle Band Close */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Strateji 2 — Öncü RSI (30/70) + Orta Bant Kırılımı
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.bollingerStrategy.rsiBbSetup.state === 'buy_triggered'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.bollingerStrategy.rsiBbSetup.state === 'sell_triggered'
                          ? 'text-red-600 dark:text-red-400'
                          : techAnalysis.bollingerStrategy.rsiBbSetup.state !== 'none'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {techAnalysis.bollingerStrategy.rsiBbSetup.label}
                  </span>

                  {techAnalysis.bollingerStrategy.rsiBbSetup.state !== 'none' &&
                    techAnalysis.bollingerStrategy.rsiBbSetup.entryPrice != null &&
                    techAnalysis.bollingerStrategy.rsiBbSetup.stopLoss != null &&
                    techAnalysis.bollingerStrategy.rsiBbSetup.targetPrice != null && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1.5 font-mono tabular-nums text-[10.5px]">
                        <div>
                          <span className="text-slate-500 block">Orta Bant Giriş</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {techAnalysis.bollingerStrategy.rsiBbSetup.entryPrice.toFixed(decimals)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Swing Stop</span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {techAnalysis.bollingerStrategy.rsiBbSetup.stopLoss.toFixed(decimals)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Karşı Bant TP</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {techAnalysis.bollingerStrategy.rsiBbSetup.targetPrice.toFixed(decimals)}
                          </span>
                        </div>
                      </div>
                    )}
                </div>

                {techAnalysis.bollingerStrategy.walkingBandWarning && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed pt-1 border-t border-slate-200/70 dark:border-slate-800">
                    {techAnalysis.bollingerStrategy.walkingBandWarning}
                  </p>
                )}

                {techAnalysis.bollingerStrategy.oppositeBandExhaustionWarning && (
                  <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed pt-1 border-t border-slate-200/70 dark:border-slate-800">
                    {techAnalysis.bollingerStrategy.oppositeBandExhaustionWarning}
                  </p>
                )}
              </div>
            </div>

            {/* 00C. Ampirik Bollinger Optimizasyonu (Oliver D. Williams — SFU Tezi) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Ampirik BB Optimizasyonu (SFU)
                </span>
                <button
                  type="button"
                  onClick={() => onToggleOverlay('useAdaptiveBollinger')}
                  className={`px-2 py-0.5 text-[10.5px] font-mono font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
                    settings.useAdaptiveBollinger
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-700 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {settings.useAdaptiveBollinger
                    ? `✓ Aktif: N*=${techAnalysis.bollingerOptimization.optimalWindowN}`
                    : `Grafiğe Uygula (N*=${techAnalysis.bollingerOptimization.optimalWindowN})`}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                {/* Optimal Window vs Default 20 Comparison */}
                <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10.5px]">
                      Optimal Pencere (Kural #11)
                    </span>
                    <span className="font-bold text-teal-700 dark:text-teal-300">
                      N*={techAnalysis.bollingerOptimization.optimalWindowN} ·{' '}
                      {techAnalysis.bollingerOptimization.scaledStdDevD}σ (
                      {techAnalysis.bollingerOptimization.optimalWinReturnPct >= 0 ? '+' : ''}
                      {techAnalysis.bollingerOptimization.optimalWinReturnPct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10.5px]">
                      Sabit Standart (20, 2.0σ)
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {techAnalysis.bollingerOptimization.default20ReturnPct >= 0 ? '+' : ''}
                      {techAnalysis.bollingerOptimization.default20ReturnPct}% ·{' '}
                      {techAnalysis.bollingerOptimization.cycleTermLabel.split('(')[0].trim()}
                    </span>
                  </div>
                </div>

                {/* Cycle Length Formula Eq. 1 */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="text-slate-500 dark:text-slate-400">
                    Baskın Döngü: ~{techAnalysis.bollingerOptimization.dominantCycleBars} Bar
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Denklem 1 (L/2+1): MA {techAnalysis.bollingerOptimization.cycleSuggestedMa}
                  </span>
                </div>

                {/* Window Profitability Spectrum (Appendix A Live Mini Chart) */}
                {techAnalysis.bollingerOptimization.windowSpectrum.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                      Pencere Kârlılık Spektrumu (Denklem 5 &amp; 6 Testi)
                    </span>
                    <div className="grid grid-cols-4 gap-1 font-mono tabular-nums text-[10px]">
                      {techAnalysis.bollingerOptimization.windowSpectrum.slice(0, 8).map((item) => {
                        const isOpt = item.n === techAnalysis.bollingerOptimization.optimalWindowN;
                        return (
                          <div
                            key={item.n}
                            className={`px-1.5 py-1 rounded border text-center ${
                              isOpt
                                ? 'border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold'
                                : 'border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div>N={item.n}</div>
                            <div
                              className={
                                item.returnPct > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : item.returnPct < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : ''
                              }
                            >
                              {item.returnPct >= 0 ? '+' : ''}
                              {item.returnPct.toFixed(1)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3rd & 4th Moments: Skewness & Kurtosis (Table 3) */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center justify-between font-mono tabular-nums text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">
                      3.M (Çarpıklık): {techAnalysis.bollingerOptimization.skewness}
                    </span>
                    <span
                      className={`font-semibold ${
                        techAnalysis.bollingerOptimization.kurtosis > 3.5
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      4.M (Kurtosis): {techAnalysis.bollingerOptimization.kurtosis}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    {techAnalysis.bollingerOptimization.tailProfileLabel} · ±2σ Dışı Kapanış: %
                    {techAnalysis.bollingerOptimization.outside2SigmaPct}
                  </div>
                </div>

                {/* Live Equation 5 & 6 Re-Entry + Section 3.1 Divergence */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
                  <div
                    className={`font-semibold ${
                      techAnalysis.bollingerOptimization.eq5Eq6Signal.state === 'buy_reentry'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.bollingerOptimization.eq5Eq6Signal.state === 'sell_reentry'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-400 font-normal'
                    }`}
                  >
                    {techAnalysis.bollingerOptimization.eq5Eq6Signal.label}
                  </div>
                  {techAnalysis.bollingerOptimization.bandDivergence && (
                    <div
                      className={`text-[11px] font-semibold ${
                        techAnalysis.bollingerOptimization.bandDivergence.kind ===
                        'bullish_divergence'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {techAnalysis.bollingerOptimization.bandDivergence.label}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 00D. Keltner Kanalı 3-Yöntem Sistemi (Casey Stubbs — ADX, RSI-2 & StochRSI) */}
            <div className="space-y-1.5 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Keltner 3-Yöntem Sistemi (20 EMA ± 2 ATR)
                </span>
                <button
                  type="button"
                  onClick={() => onToggleOverlay('showKeltner')}
                  className={`px-2 py-0.5 text-[10.5px] font-mono font-semibold rounded border transition-colors whitespace-nowrap shrink-0 ${
                    settings.showKeltner
                      ? 'bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {settings.showKeltner ? '✓ Kanal Aktif' : 'Keltner Göster'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Keltner Zarf Rejimi
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.keltnerStrategy.channelState === 'bull_crawl' ||
                      techAnalysis.keltnerStrategy.channelState === 'uptrend'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.keltnerStrategy.channelState === 'bear_crawl' ||
                            techAnalysis.keltnerStrategy.channelState === 'downtrend'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {techAnalysis.keltnerStrategy.channelLabel}
                  </span>
                  {techAnalysis.keltnerStrategy.ttmSqueezeActive && (
                    <span className="block mt-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      TTM Volatilite Sıkışması Aktif (Bollinger Bantları Keltner İçinde!)
                    </span>
                  )}
                </div>

                {/* ADX(14), RSI(2), StochRSI Readout */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums text-[10.5px] text-slate-600 dark:text-slate-300">
                  <span>
                    ADX(14):{' '}
                    <strong
                      className={
                        (techAnalysis.keltnerStrategy.adx14 ?? 0) >= 20
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-500'
                      }
                    >
                      {techAnalysis.keltnerStrategy.adx14 ?? '—'}
                      {techAnalysis.keltnerStrategy.adxRising ? '↑' : ''}
                    </strong>
                  </span>
                  <span>
                    RSI(2):{' '}
                    <strong
                      className={
                        (techAnalysis.keltnerStrategy.rsi2 ?? 50) <= 10
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : (techAnalysis.keltnerStrategy.rsi2 ?? 50) >= 90
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-200'
                      }
                    >
                      {techAnalysis.keltnerStrategy.rsi2 ?? '—'}
                    </strong>
                  </span>
                  <span>
                    StochRSI:{' '}
                    <strong>
                      {techAnalysis.keltnerStrategy.stochRsiK ?? '—'}/
                      {techAnalysis.keltnerStrategy.stochRsiD ?? '—'}
                    </strong>
                  </span>
                </div>

                {/* Method 1: Breakout + ADX > 20 */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Yöntem #1 — Kırılım (Yatay KC + ADX &gt; 20)
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.keltnerStrategy.breakoutSignal.state === 'buy_breakout'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.keltnerStrategy.breakoutSignal.state === 'sell_breakout'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-400 font-normal'
                    }`}
                  >
                    {techAnalysis.keltnerStrategy.breakoutSignal.label}
                  </span>
                </div>

                {/* Method 2: Flat Range + 2-Period RSI (10 / 90) */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800 space-y-1">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Yöntem #2 — Yatay Bant (20 EMA Altı/Üstü + 2-Periyot RSI 10/90)
                  </span>
                  <span
                    className={`font-semibold block ${
                      techAnalysis.keltnerStrategy.rangeRsi2Signal.state === 'buy_range'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.keltnerStrategy.rangeRsi2Signal.state === 'sell_range'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-400 font-normal'
                    }`}
                  >
                    {techAnalysis.keltnerStrategy.rangeRsi2Signal.label}
                  </span>
                  {techAnalysis.keltnerStrategy.rangeRsi2Signal.state !== 'none' &&
                    techAnalysis.keltnerStrategy.rangeRsi2Signal.stopLoss != null && (
                      <div className="flex items-center justify-between font-mono tabular-nums text-[10.5px] pt-0.5">
                        <span className="text-red-600 dark:text-red-400">
                          Dış KC Stop:{' '}
                          {techAnalysis.keltnerStrategy.rangeRsi2Signal.stopLoss.toFixed(decimals)}
                        </span>
                        <span className="text-sky-600 dark:text-sky-400">
                          {techAnalysis.keltnerStrategy.rangeRsi2Signal.targetNote}
                        </span>
                      </div>
                    )}
                </div>

                {/* Method 3: Strong Trend 20 EMA Pullback + StochRSI */}
                <div className="pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">
                    Yöntem #3 — Trend Pullback (20 EMA + StochRSI Kesişimi)
                  </span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.keltnerStrategy.pullbackStochRsiSignal.state === 'buy_pullback'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.keltnerStrategy.pullbackStochRsiSignal.state ===
                            'sell_pullback'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-600 dark:text-slate-400 font-normal'
                    }`}
                  >
                    {techAnalysis.keltnerStrategy.pullbackStochRsiSignal.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 01. Piyasa Yapısı Rejimi & Choppy Filtresi (Trading Bible) */}
            <div className="space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                01. Piyasa Yapısı Rejimi (Market Structure)
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
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
                </div>
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Dalga Evresi: {techAnalysis.marketRegime.waveLabel}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {techAnalysis.marketRegime.actionAdvice}
                </p>
              </div>
            </div>

            {/* 02. Top-Down Çoklu Zaman Dilimi Perspektifi */}
            {topDownSummary && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  02. Top-Down Üst Zaman Dilimi ({topDownSummary.higherTimeframeLabel})
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {topDownSummary.htfRegimeLabel}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        topDownSummary.htfLastCandleBullish
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      Son Bar: {topDownSummary.htfLastCandleBullish ? 'Boğa' : 'Ayı'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {topDownSummary.alignmentNote}
                  </p>
                  <div className="pt-1 flex items-center justify-between font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Üst Destek:{' '}
                      {topDownSummary.htfKeySupport != null
                        ? topDownSummary.htfKeySupport.toFixed(decimals)
                        : '—'}
                    </span>
                    <span>
                      Üst Direnç:{' '}
                      {topDownSummary.htfKeyResistance != null
                        ? topDownSummary.htfKeyResistance.toFixed(decimals)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 03. Kurumsal Arz & Talep Bölgeleri */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                03. Kurumsal Arz &amp; Talep Bölgeleri
              </div>
              {techAnalysis.supplyDemandZones.length > 0 ? (
                <div className="space-y-1.5">
                  {techAnalysis.supplyDemandZones.map((sd) => (
                    <div
                      key={sd.id}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
                    >
                      <div>
                        <span
                          className={`font-semibold ${
                            sd.kind === 'demand'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {sd.turkishLabel}
                        </span>
                        <span className="block text-[10.5px] text-slate-500 dark:text-slate-400">
                          Kalkış Gücü: {sd.departureStrength}x Ortalama Bar
                        </span>
                      </div>
                      <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {sd.lowBound.toFixed(decimals)} – {sd.highBound.toFixed(decimals)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Yakın fiyatta kırılmamış patlayıcı Arz/Talep tabanı bulunmuyor.
                </p>
              )}
            </div>

            {/* 04. Trend & Kanal Analizi */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                04. Trend Çizgisi ve Kanal Durumu
              </div>
              {techAnalysis.trendChannel ? (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {techAnalysis.trendChannel.label}
                    </span>
                    <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400">
                      {techAnalysis.trendChannel.touchCount} Temas
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {techAnalysis.trendChannel.isValidatedByThreePoints
                      ? 'En az 3 temas noktasıyla doğrulanmış sağlam trend yapısı.'
                      : '2 pivot noktasıyla çizilmiş aday trend hattı; 3. temas onayı izlenmeli.'}
                    {techAnalysis.trendChannel.isSteepWarning &&
                      ' Dikkat: Çizgi eğimi oldukça dik, kırılma ihtimali artabilir.'}
                  </p>
                  <div className="pt-1 flex items-center justify-between font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Ana Hat: {techAnalysis.trendChannel.primaryEndPrice.toFixed(decimals)}</span>
                    <span>Kanal: {techAnalysis.trendChannel.channelEndPrice.toFixed(decimals)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Belirgin kanal yapısı oluşmadı.</p>
              )}
            </div>

            {/* 05. Üçgen & Sıkışma Formasyonu */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                05. Sıkışma ve Üçgen Formasyonu
              </div>
              {techAnalysis.geometricStructure ? (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-semibold text-amber-600 dark:text-amber-400">
                    {techAnalysis.geometricStructure.turkishName}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {techAnalysis.geometricStructure.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono tabular-nums text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Yukarı Hedef (+H)</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {techAnalysis.geometricStructure.projectedTargetUp.toFixed(decimals)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Aşağı Hedef (-H)</span>
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        {techAnalysis.geometricStructure.projectedTargetDown.toFixed(decimals)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  Son 65 barda aktif üçgen veya takoz sıkışması tespit edilmedi.
                </p>
              )}
            </div>

            {/* 06. Yatay Destek / Direnç Bölgeleri */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                06. Yatay Destek / Direnç Bölgeleri
              </div>
              {techAnalysis.zones.length > 0 ? (
                <div className="space-y-1.5">
                  {techAnalysis.zones.map((z) => (
                    <div
                      key={z.id}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
                    >
                      <div>
                        <span
                          className={`font-semibold ${
                            z.role === 'support'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {z.role === 'support' ? 'Destek Bölgesi' : 'Direnç Bölgesi'}
                        </span>
                        <span className="text-slate-400 mx-1" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{z.touches}x test</span>
                        {z.polarityFlipped && (
                          <span className="block text-[10.5px] text-sky-600 dark:text-sky-400">
                            Rol Değişimi (Eski {z.role === 'support' ? 'Direnç' : 'Destek'})
                          </span>
                        )}
                      </div>
                      <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {z.lowBound.toFixed(decimals)} – {z.highBound.toFixed(decimals)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Bölge hesaplanıyor.</p>
              )}
            </div>

            {/* 07. MACD (12,26,9), Bollinger & Fibonacci Özeti */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                07. İndikatör ve Fibonacci Özeti
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">MACD (12, 26, 9)</span>
                  <span
                    className={`font-semibold ${
                      techAnalysis.macdStatus.state.startsWith('bullish')
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : techAnalysis.macdStatus.state.startsWith('bearish')
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {techAnalysis.macdStatus.label}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/70 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block">Bollinger Bandı (20, 2)</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {techAnalysis.bollingerStatus}
                  </span>
                </div>
                {techAnalysis.fibonacci && (
                  <div className="pt-1 border-t border-slate-200/70 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 block">
                      Fibonacci ({techAnalysis.fibonacci.trendMode === 'uptrend' ? 'Dipten Tepeye' : 'Tepeden Dibe'})
                    </span>
                    <div className="flex items-center justify-between font-mono tabular-nums mt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Destek:{' '}
                        {techAnalysis.fibonacci.nearestSupport
                          ? `${techAnalysis.fibonacci.nearestSupport.price.toFixed(decimals)} (${techAnalysis.fibonacci.nearestSupport.label})`
                          : '—'}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        Direnç:{' '}
                        {techAnalysis.fibonacci.nearestResistance
                          ? `${techAnalysis.fibonacci.nearestResistance.price.toFixed(decimals)} (${techAnalysis.fibonacci.nearestResistance.label})`
                          : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 08. Tespit Edilen Boşluklar */}
            {techAnalysis.gaps.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  08. Fiyat Boşlukları (Gap &amp; Ada)
                </div>
                <div className="space-y-1.5">
                  {techAnalysis.gaps.slice(-3).reverse().map((g, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between font-medium text-slate-900 dark:text-slate-100">
                        <span>{g.turkishName}</span>
                        <span className="font-mono tabular-nums text-[11px] text-slate-500">
                          {g.gapLow.toFixed(decimals)} – {g.gapHigh.toFixed(decimals)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{g.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function AnatomyCandleDiagram({
  anatomy,
  candleStyle,
  isDark,
}: {
  anatomy: CandleAnatomy;
  candleStyle: 'modern' | 'matriks';
  isDark: boolean;
}) {
  const h = 148;
  const w = 96;
  const topY = 12;
  const botY = h - 12;
  const availH = botY - topY;

  const uH = (anatomy.upperWickPct / 100) * availH;
  const bH = Math.max(3, (anatomy.bodyPct / 100) * availH);
  const bodyY = topY + uH;

  let fill = anatomy.isBullish ? '#16A34A' : anatomy.isBearish ? '#DC2626' : '#94A3B8';
  let stroke = fill;
  const wickColor = candleStyle === 'matriks' ? (isDark ? '#CBD5E1' : '#0F172A') : stroke;

  if (candleStyle === 'matriks') {
    if (anatomy.isDoji) {
      fill = wickColor;
      stroke = wickColor;
    } else if (anatomy.isBullish) {
      fill = isDark ? '#F8FAFC' : '#FFFFFF';
      stroke = isDark ? '#E2E8F0' : '#0F172A';
    } else {
      fill = isDark ? '#1E293B' : '#0F172A';
      stroke = isDark ? '#94A3B8' : '#0F172A';
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <line x1={w / 2} y1={topY} x2={w / 2} y2={botY} stroke={wickColor} strokeWidth={2} />
      <line x1={w / 2 - 8} y1={topY} x2={w / 2 + 8} y2={topY} stroke={wickColor} strokeWidth={1.2} />
      <line x1={w / 2 - 8} y1={botY} x2={w / 2 + 8} y2={botY} stroke={wickColor} strokeWidth={1.2} />
      <rect
        x={w / 2 - 14}
        y={Math.min(botY - 3, bodyY)}
        width={28}
        height={Math.min(availH, bH)}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        rx={1.5}
      />
    </svg>
  );
}

function ReducedCandleDiagram({
  breakdown,
  candleStyle,
  isDark,
}: {
  breakdown: PatternBreakdownInfo;
  candleStyle: 'modern' | 'matriks';
  isDark: boolean;
}) {
  const h = 88;
  const w = 64;
  const topY = 8;
  const botY = h - 8;
  const availH = botY - topY;

  const uH = (breakdown.upperWickPct / 100) * availH;
  const bH = Math.max(2.5, (breakdown.bodyPct / 100) * availH);
  const bodyY = topY + uH;

  let fill = breakdown.isDoji ? '#94A3B8' : breakdown.isBullish ? '#16A34A' : '#DC2626';
  let stroke = fill;
  const wickColor = candleStyle === 'matriks' ? (isDark ? '#CBD5E1' : '#0F172A') : stroke;

  if (candleStyle === 'matriks') {
    if (breakdown.isDoji) {
      fill = wickColor;
      stroke = wickColor;
    } else if (breakdown.isBullish) {
      fill = isDark ? '#F8FAFC' : '#FFFFFF';
      stroke = isDark ? '#E2E8F0' : '#0F172A';
    } else {
      fill = isDark ? '#1E293B' : '#0F172A';
      stroke = isDark ? '#94A3B8' : '#0F172A';
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
      <line x1={w / 2} y1={topY} x2={w / 2} y2={botY} stroke={wickColor} strokeWidth={2} />
      <rect
        x={w / 2 - 11}
        y={Math.min(botY - 3, bodyY)}
        width={22}
        height={Math.min(availH, bH)}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        rx={1}
      />
    </svg>
  );
}
