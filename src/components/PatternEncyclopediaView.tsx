import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, FileText, Layers, Search } from 'lucide-react';
import { PATTERNS_CATALOG } from '../data/patternsCatalog';
import { TECHNIQUES_CATALOG } from '../data/techniquesCatalog';
import { PatternSchematic } from './PatternSchematic';
import { TechniqueSchematic } from './TechniqueSchematic';
import type {
  ChartOverlayKey,
  PatternDefinition,
  PatternSettings,
  TechniqueGuideItem,
} from '../types/market';

interface PatternEncyclopediaViewProps {
  settings: PatternSettings;
  isDark: boolean;
  onFilterSinglePatternOnChart: (patternId: string) => void;
  onActivateOverlayOnChart: (overlayKey?: ChartOverlayKey) => void;
  onOpenPdfViewer: () => void;
}

export function PatternEncyclopediaView({
  settings,
  isDark,
  onFilterSinglePatternOnChart,
  onActivateOverlayOnChart,
  onOpenPdfViewer,
}: PatternEncyclopediaViewProps) {
  const [section, setSection] = useState<'techniques' | 'candles'>('techniques');
  const [techSourceFilter, setTechSourceFilter] = useState<
    'all' | TechniqueGuideItem['sourceBook']
  >('all');
  const [techCategoryFilter, setTechCategoryFilter] = useState<
    'all' | TechniqueGuideItem['category']
  >('all');

  const [candleSourceFilter, setCandleSourceFilter] = useState<
    'all' | 'Greg Morris' | 'Trading Bible' | 'Matriks'
  >('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'reversal' | 'continuation' | 'top15'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [barCountFilter, setBarCountFilter] = useState<'all' | 1 | 2 | 3 | '4plus'>('all');
  const [query, setQuery] = useState('');

  const filteredPatterns = useMemo(() => {
    return PATTERNS_CATALOG.filter((p) => {
      const src = p.sourceBook || 'Matriks';
      const role = p.patternType || 'reversal';
      if (candleSourceFilter !== 'all' && src !== candleSourceFilter) return false;
      if (roleFilter === 'reversal' && role !== 'reversal') return false;
      if (roleFilter === 'continuation' && role !== 'continuation') return false;
      if (roleFilter === 'top15' && !p.isTopPerformer) return false;
      if (directionFilter !== 'all' && p.direction !== directionFilter) return false;
      if (barCountFilter === '4plus') {
        if (p.barCount < 4) return false;
      } else if (barCountFilter !== 'all' && p.barCount !== barCountFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          p.turkishName.toLowerCase().includes(q) ||
          p.englishName.toLowerCase().includes(q) ||
          (p.japaneseName?.toLowerCase().includes(q) ?? false) ||
          p.summary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [candleSourceFilter, roleFilter, directionFilter, barCountFilter, query]);

  const filteredTechniques = useMemo(() => {
    return TECHNIQUES_CATALOG.filter((t) => {
      if (techSourceFilter !== 'all' && t.sourceBook !== techSourceFilter) return false;
      if (techCategoryFilter !== 'all' && t.category !== techCategoryFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.rules.some((r) => r.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [techSourceFilter, techCategoryFilter, query]);

  const totalModules = TECHNIQUES_CATALOG.length + PATTERNS_CATALOG.length;
  const bullCount = PATTERNS_CATALOG.filter((p) => p.direction === 'bullish').length;
  const bearCount = PATTERNS_CATALOG.filter((p) => p.direction === 'bearish').length;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-7">
      {/* Header & Knowledge Base Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Price Action &amp; Teknik Analiz Bilgi Bazası ({totalModules} Modül)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Courtney Capital Dual Osilatör Sistemi (Slow Stoch 13,8,4 &amp; CCI 20), 50 CCI &amp; 34 EMA
            Sistemi (5034, 5034z, 50140 &amp; 204 EMA), Keltner Kanalı 3-Yöntem (20 EMA ± 2 ATR),
            Ampirik Bollinger Optimizasyonu (SFU), Bollinger Stratejisi (BBMA &amp; RSI+BB), Greg Morris,
            Trading Bible, Grafik Okuma ve {PATTERNS_CATALOG.length} Mum Formasyonu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSection('techniques')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                section === 'techniques'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Strateji &amp; Grafik Okuma ({TECHNIQUES_CATALOG.length})
            </button>
            <button
              type="button"
              onClick={() => setSection('candles')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                section === 'candles'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Mum Formasyonları ({PATTERNS_CATALOG.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenPdfViewer}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-4 h-4" />
            <span>Kaynak Dokümanlar (9)</span>
          </button>
        </div>
      </div>

      {/* SECTION A: STRATEJİ & GRAFİK OKUMA MODÜLLERİ (45 MODÜL) */}
      {section === 'techniques' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Book Source Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: `Tümü (${TECHNIQUES_CATALOG.length})` },
                    { id: 'Courtney Capital', label: 'Courtney Capital (4)' },
                    { id: '50 CCI Stratejisi', label: '50 CCI Sistemi (4)' },
                    { id: 'Keltner Stratejisi', label: 'Keltner Stratejisi (4)' },
                    { id: 'Ampirik Optimizasyon (SFU)', label: 'Ampirik BB — SFU (5)' },
                    { id: 'Bollinger Stratejisi', label: 'Bollinger Stratejisi (4)' },
                    { id: 'Greg Morris', label: 'Greg Morris (7)' },
                    { id: 'Trading Bible', label: 'Trading Bible (8)' },
                    { id: 'Grafik Okuma', label: 'Grafik Okuma (9)' },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTechSourceFilter(s.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      techSourceFilter === s.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'Tüm Kategoriler' },
                    { id: 'Sakata Yöntemi & Kantitatif Filtreleme', label: 'Sakata & Morris' },
                    { id: 'Price Action & Piyasa Yapısı', label: 'Piyasa Yapısı & Arz/Talep' },
                    { id: 'Giriş Taktikleri & Risk Yönetimi', label: 'Confluence, %50 & R:R' },
                    { id: 'Seviye & Trend', label: 'S/R & Trend' },
                    { id: 'Formasyon & Boşluk', label: 'Üçgen & Gap' },
                    { id: 'İndikatör & Fibonacci', label: 'Bollinger, MACD & Fib' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTechCategoryFilter(c.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      techCategoryFilter === c.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Sakata, Shinne Hatte, CandlePower, Pin Bar..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTechniques.map((tech) => (
              <TechniqueCard
                key={tech.id}
                item={tech}
                isDark={isDark}
                onActivate={() => onActivateOverlayOnChart(tech.overlayKey)}
              />
            ))}
          </div>
        </>
      )}

      {/* SECTION B: 43 MUM FORMASYONU (34 MATRİKS + 9 TRADING BIBLE) */}
      {section === 'candles' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                01. Not Confirmed (Onaylanmamış)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Formasyon oluştuktan sonraki <span className="font-mono">Confirm Bar Count</span>{' '}
                süresi içerisinde kapanış fiyatı henüz teyit seviyesini aşmamış olan formasyonlardır.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                02. Confirmed (Onaylanmış)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Belirlenen bar sayısı içerisinde kapanış değeriyle teyit seviyesini aşan ve stop
                seviyesini ihlal etmeyen aktif onaylı formasyonlardır.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
              <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                03. Confirmed &amp; Fail (Onaylanmış ve Başarısız)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                Önce kapanışla teyit seviyesini aşan, ancak takip eden kontrol barları içinde
                kapanış değeri stoploss seviyesinin ötesine geçerek geçersiz kalan formasyonlardır.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: `Tümü (${PATTERNS_CATALOG.length})` },
                    { id: 'Greg Morris', label: 'Greg Morris (30)' },
                    { id: 'Trading Bible', label: 'Trading Bible (9)' },
                    { id: 'Matriks', label: 'Matriks (34)' },
                  ] as const
                ).map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setCandleSourceFilter(src.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      candleSourceFilter === src.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'Tüm Roller' },
                    { id: 'reversal', label: 'Dönüş (61)' },
                    { id: 'continuation', label: 'Devam (12)' },
                    { id: 'top15', label: '★ Top-15 (6)' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleFilter(r.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      roleFilter === r.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'all', label: 'Tüm Yönler' },
                  { id: 'bullish', label: `Boğa (${bullCount})` },
                  { id: 'bearish', label: `Ayı (${bearCount})` },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDirectionFilter(d.id as 'all' | 'bullish' | 'bearish')}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      directionFilter === d.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                {(
                  [
                    { id: 'all', label: 'Tüm Barlar' },
                    { id: 1, label: '1M' },
                    { id: 2, label: '2M' },
                    { id: 3, label: '3M' },
                    { id: '4plus', label: '4–5M' },
                  ] as const
                ).map((b) => (
                  <button
                    key={String(b.id)}
                    type="button"
                    onClick={() => setBarCountFilter(b.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      barCountFilter === b.id
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Takuri, Tasuki, Sanba, Üç Yöntem..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPatterns.map((pat) => (
              <EncyclopediaCard
                key={pat.id}
                pattern={pat}
                candleStyle={settings.candleStyle}
                isDark={isDark}
                onSelectForChart={() => onFilterSinglePatternOnChart(pat.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TechniqueCard({
  item,
  isDark,
  onActivate,
}: {
  item: TechniqueGuideItem;
  isDark: boolean;
  onActivate: () => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{item.sourceBook}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">{item.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {item.sourceBook === 'Keltner Stratejisi' ? item.pdfPage : `PDF ${item.pdfPage}`}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
        </div>

        <TechniqueSchematic diagramType={item.diagramType} isDark={isDark} />

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.summary}</p>

        <ul className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          {item.rules.map((r, idx) => (
            <li
              key={idx}
              className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex gap-2"
            >
              <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0">
                0{idx + 1}.
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onActivate}
          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Canlı Grafikte Bu Tekniği İncele</span>
        </button>
      </div>
    </article>
  );
}

function EncyclopediaCard({
  pattern,
  candleStyle,
  isDark,
  onSelectForChart,
}: {
  pattern: PatternDefinition;
  candleStyle: 'modern' | 'matriks';
  isDark: boolean;
  onSelectForChart: () => void;
}) {
  const isBull = pattern.direction === 'bullish';
  const sourceBook = pattern.sourceBook || 'Matriks';
  const roleLabel = pattern.patternType === 'continuation' ? 'Devam' : 'Dönüş';
  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              isBull
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isBull ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{isBull ? 'Boğa' : 'Ayı'}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>{roleLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{pattern.barCount} Mum</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{sourceBook}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">s.{pattern.pdfPage}</span>
          {pattern.isTopPerformer && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">★ Top-15</span>
            </>
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {pattern.turkishName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pattern.englishName}
            {pattern.japaneseName && (
              <span className="italic ml-1.5 text-slate-400 dark:text-slate-500">
                ({pattern.japaneseName})
              </span>
            )}
          </p>
        </div>

        <PatternSchematic pattern={pattern} candleStyle={candleStyle} isDark={isDark} height={148} />

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {pattern.summary}
        </p>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
          <div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Teyit: </span>
            <span className="text-slate-600 dark:text-slate-300">{pattern.confirmationRule}</span>
          </div>
          <div>
            <span className="font-semibold text-red-700 dark:text-red-400">Stoploss: </span>
            <span className="text-slate-600 dark:text-slate-300">{pattern.stopLossRule}</span>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onSelectForChart}
          className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          Grafikte Bu Formasyonu Ara
        </button>
      </div>
    </article>
  );
}
