import { X } from 'lucide-react';
import { PATTERNS_CATALOG } from '../data/patternsCatalog';
import { createDefaultPatternSettings } from '../engine/candlestickEngine';
import type { PatternSettings, PatternStatus } from '../types/market';

interface PatternSettingsModalProps {
  open: boolean;
  settings: PatternSettings;
  onChange: (next: PatternSettings) => void;
  onClose: () => void;
}

export function PatternSettingsModal({
  open,
  settings,
  onChange,
  onClose,
}: PatternSettingsModalProps) {
  if (!open) return null;

  const bullishPatterns = PATTERNS_CATALOG.filter((p) => p.direction === 'bullish');
  const bearishPatterns = PATTERNS_CATALOG.filter((p) => p.direction === 'bearish');

  const togglePattern = (id: string) => {
    onChange({
      ...settings,
      enabledPatterns: {
        ...settings.enabledPatterns,
        [id]: !settings.enabledPatterns[id],
      },
    });
  };

  const morrisPatternsCount = PATTERNS_CATALOG.filter((p) => p.sourceBook === 'Greg Morris').length;
  const topPerformerCount = PATTERNS_CATALOG.filter((p) => p.isTopPerformer).length;

  const setBulkSelection = (
    mode: 'all' | 'none' | 'bullish' | 'bearish' | 'bible' | 'morris' | 'top15'
  ) => {
    const next: Record<string, boolean> = {};
    for (const p of PATTERNS_CATALOG) {
      if (mode === 'all') next[p.id] = true;
      else if (mode === 'none') next[p.id] = false;
      else if (mode === 'bullish') next[p.id] = p.direction === 'bullish';
      else if (mode === 'bearish') next[p.id] = p.direction === 'bearish';
      else if (mode === 'bible') next[p.id] = p.sourceBook === 'Trading Bible';
      else if (mode === 'morris') next[p.id] = p.sourceBook === 'Greg Morris';
      else next[p.id] = Boolean(p.isTopPerformer);
    }
    onChange({ ...settings, enabledPatterns: next });
  };

  const toggleStatus = (status: PatternStatus) => {
    onChange({
      ...settings,
      showStatuses: {
        ...settings.showStatuses,
        [status]: !settings.showStatuses[status],
      },
    });
  };

  const enabledCount = Object.values(settings.enabledPatterns).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pattern-settings-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="pattern-settings-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Mum Formasyonları &amp; Price Action Ayarları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aktif seçili formasyon: {enabledCount} / {PATTERNS_CATALOG.length} · Teyit penceresi: {settings.confirmBarCount} bar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Bulk Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkSelection('all')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
              >
                Tümünü Seç ({PATTERNS_CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('none')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
              >
                Tüm Seçimleri İptal Et
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('bullish')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 whitespace-nowrap shrink-0 transition-colors"
              >
                Sadece Boğa ({bullishPatterns.length})
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('bearish')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-600/30 text-red-700 dark:text-red-400 hover:bg-red-500/10 whitespace-nowrap shrink-0 transition-colors"
              >
                Sadece Ayı ({bearishPatterns.length})
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('morris')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-violet-600/30 text-violet-700 dark:text-violet-400 hover:bg-violet-500/10 whitespace-nowrap shrink-0 transition-colors"
              >
                Greg Morris ({morrisPatternsCount})
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('top15')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-amber-600/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 whitespace-nowrap shrink-0 transition-colors"
              >
                Morris Top-15 İstikrarlı ({topPerformerCount})
              </button>
              <button
                type="button"
                onClick={() => setBulkSelection('bible')}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-600/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 whitespace-nowrap shrink-0 transition-colors"
              >
                Trading Bible (9)
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChange(createDefaultPatternSettings())}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
            >
              Varsayılan Ayarları Yükle
            </button>
          </div>

          {/* 21 Bullish & 13 Bearish Checklists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bullish List */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Boğa (Bullish) Formasyonları — {bullishPatterns.length} Adet
                </span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {bullishPatterns.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.enabledPatterns[p.id])}
                        onChange={() => togglePattern(p.id)}
                        className="rounded border-slate-300 dark:border-slate-600 accent-emerald-600"
                      />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {p.englishName}{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          ({p.turkishName})
                        </span>
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {p.barCount}M
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bearish List */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                  Ayı (Bearish) Formasyonları — {bearishPatterns.length} Adet
                </span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {bearishPatterns.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.enabledPatterns[p.id])}
                        onChange={() => togglePattern(p.id)}
                        className="rounded border-slate-300 dark:border-slate-600 accent-red-600"
                      />
                      <span className="text-slate-800 dark:text-slate-200 truncate">
                        {p.englishName}{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          ({p.turkishName})
                        </span>
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {p.barCount}M
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Lifecycle Status, Confirm Bar Count, Region & Colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Durum & Confirm Bar Count */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Formasyon Durumu & Teyit
              </h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.showStatuses.not_confirmed}
                    onChange={() => toggleStatus('not_confirmed')}
                    className="accent-amber-600"
                  />
                  <span>Not Confirmed (Onaylanmamış)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.showStatuses.confirmed}
                    onChange={() => toggleStatus('confirmed')}
                    className="accent-emerald-600"
                  />
                  <span>Confirmed (Onaylanmış)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.showStatuses.confirmed_fail}
                    onChange={() => toggleStatus('confirmed_fail')}
                    className="accent-red-600"
                  />
                  <span>Confirmed & Fail (Başarısız)</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <label
                  htmlFor="confirm-bar-input"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Bar Count
                </label>
                <input
                  id="confirm-bar-input"
                  type="number"
                  min={1}
                  max={12}
                  value={settings.confirmBarCount}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      confirmBarCount: Math.max(1, Math.min(12, Number(e.target.value) || 3)),
                    })
                  }
                  className="w-16 px-2 py-1 text-right text-xs font-mono tabular-nums rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Tarama Bölgesi & Morris Kuralları */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Formasyon Rolü &amp; Morris Filtresi
              </h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.showRoles.reversal}
                    onChange={() =>
                      onChange({
                        ...settings,
                        showRoles: {
                          ...settings.showRoles,
                          reversal: !settings.showRoles.reversal,
                        },
                      })
                    }
                    className="accent-blue-600"
                  />
                  <span>Dönüş (Reversal) Formasyonları</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.showRoles.continuation}
                    onChange={() =>
                      onChange({
                        ...settings,
                        showRoles: {
                          ...settings.showRoles,
                          continuation: !settings.showRoles.continuation,
                        },
                      })
                    }
                    className="accent-violet-600"
                  />
                  <span>Devam (Continuation — Dinlenme)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.onlyMorrisFiltered}
                    onChange={() =>
                      onChange({
                        ...settings,
                        onlyMorrisFiltered: !settings.onlyMorrisFiltered,
                      })
                    }
                    className="accent-emerald-600"
                  />
                  <span>Sadece Morris Ön-Sinyal Filtreli [F]</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <label className="flex items-center justify-between gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="barRegion"
                      checked={settings.barRegion === 'lastN'}
                      onChange={() => onChange({ ...settings, barRegion: 'lastN' })}
                      className="accent-blue-600"
                    />
                    <span>Son N Bar</span>
                  </span>
                  <input
                    type="number"
                    min={30}
                    max={600}
                    step={50}
                    value={settings.lastNCount}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        barRegion: 'lastN',
                        lastNCount: Math.max(30, Math.min(600, Number(e.target.value) || 500)),
                      })
                    }
                    className="w-20 px-2 py-1 text-right text-xs font-mono tabular-nums rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="barRegion"
                    checked={settings.barRegion === 'all'}
                    onChange={() => onChange({ ...settings, barRegion: 'all' })}
                    className="accent-blue-600"
                  />
                  <span>Tüm Barları Kullan</span>
                </label>
              </div>
            </div>

            {/* Renk ve Mum Görünümü */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Renkler ve Mum Stili
              </h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="colorMode"
                    checked={settings.colorMode === 'direction'}
                    onChange={() => onChange({ ...settings, colorMode: 'direction' })}
                    className="accent-blue-600"
                  />
                  <span>Boğa / Ayı Renk Seçimi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="colorMode"
                    checked={settings.colorMode === 'status'}
                    onChange={() => onChange({ ...settings, colorMode: 'status' })}
                    className="accent-blue-600"
                  />
                  <span>Durum Bazında Renk Seçimi</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="block font-medium text-slate-700 dark:text-slate-300">
                  Grafik Mum Paleti
                </span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-md">
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, candleStyle: 'modern' })}
                    className={`px-2 py-1 text-[11px] font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                      settings.candleStyle === 'modern'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Yeşil / Kırmızı
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, candleStyle: 'matriks' })}
                    className={`px-2 py-1 text-[11px] font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                      settings.candleStyle === 'matriks'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Matriks Klasik
                  </button>
                </div>

                <label className="flex items-center gap-2 pt-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.candlePower}
                    onChange={() => onChange({ ...settings, candlePower: !settings.candlePower })}
                    className="accent-violet-600"
                  />
                  <span>CandlePower (Hacim Oranlı Gövde Genişliği)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            Tamam ve Uygula
          </button>
        </div>
      </div>
    </div>
  );
}
