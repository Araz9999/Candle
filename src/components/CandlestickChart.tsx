import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { computeEMA } from '../engine/candlestickEngine';
import type {
  Candle,
  DetectedPattern,
  PatternSettings,
  TechnicalStructureAnalysis,
  Timeframe,
} from '../types/market';

interface CandlestickChartProps {
  candles: Candle[];
  patterns: DetectedPattern[];
  techAnalysis: TechnicalStructureAnalysis;
  settings: PatternSettings;
  decimals: number;
  timeframe: Timeframe;
  isDark: boolean;
  selectedCandleIndex: number | null;
  selectedPatternId: string | null;
  focusBarIndex: number | null;
  onSelectCandle: (index: number) => void;
  onSelectPattern: (pattern: DetectedPattern) => void;
}

interface HitBox {
  pattern: DetectedPattern;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function formatChartTime(unixSec: number, timeframe: Timeframe, showDate = false): string {
  const d = new Date(unixSec * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  if (timeframe === '1d') {
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
  }
  if (showDate) {
    return `${pad(d.getDate())} ${months[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCompactVolume(v: number): string {
  if (!Number.isFinite(v) || v <= 0) return '0';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

export function CandlestickChart({
  candles,
  patterns,
  techAnalysis,
  settings,
  decimals,
  timeframe,
  isDark,
  selectedCandleIndex,
  selectedPatternId,
  focusBarIndex,
  onSelectCandle,
  onSelectPattern,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitBoxesRef = useRef<HitBox[]>([]);

  const [size, setSize] = useState<{ width: number; height: number }>({ width: 920, height: 520 });
  const [visibleCount, setVisibleCount] = useState<number>(85);
  const [rightOffset, setRightOffset] = useState<number>(0);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startOffset: number;
    moved: boolean;
  }>({ dragging: false, startX: 0, startOffset: 0, moved: false });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(320, Math.floor(entry.contentRect.width));
        const h = Math.max(360, Math.floor(entry.contentRect.height));
        setSize({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (focusBarIndex == null || candles.length === 0) return;
    const desiredRightIndex = Math.min(
      candles.length - 1,
      focusBarIndex + Math.floor(visibleCount * 0.35)
    );
    const newOffset = Math.max(0, candles.length - 1 - desiredRightIndex);
    setRightOffset(newOffset);
  }, [focusBarIndex, candles.length, visibleCount]);

  const ema20 = useMemo(
    () => (settings.showEMA20 ? computeEMA(candles, 20) : []),
    [candles, settings.showEMA20]
  );
  const ema50 = useMemo(
    () => (settings.showEMA50 ? computeEMA(candles, 50) : []),
    [candles, settings.showEMA50]
  );

  const rightAxisWidth = 80;
  const bottomAxisHeight = 28;
  const topPad = 38;
  const rightMarginBars = 6;

  const plotWidth = Math.max(100, size.width - rightAxisWidth);
  const totalPlotHeight = Math.max(180, size.height - bottomAxisHeight);

  // Split totalPlotHeight into Main Price Pane + Optional MACD & Morris Filter Lower Panes
  const lowerPaneCount = (settings.showMACD ? 1 : 0) + (settings.showMorrisFilter ? 1 : 0);
  const singleSubPaneH =
    lowerPaneCount === 2
      ? Math.max(84, Math.floor(totalPlotHeight * 0.18))
      : lowerPaneCount === 1
        ? Math.max(96, Math.floor(totalPlotHeight * 0.22))
        : 0;
  const macdPaneHeight = settings.showMACD ? singleSubPaneH : 0;
  const morrisPaneHeight = settings.showMorrisFilter ? singleSubPaneH : 0;
  const lowerPanesHeight = macdPaneHeight + morrisPaneHeight;
  const mainPaneHeight = totalPlotHeight - lowerPanesHeight;

  const endBarFloat = candles.length - 1 - rightOffset + rightMarginBars;
  const startBarFloat = endBarFloat - visibleCount;

  const startIdx = Math.max(0, Math.floor(startBarFloat));
  const endIdx = Math.min(candles.length - 1, Math.ceil(endBarFloat));

  const barStep = plotWidth / Math.max(visibleCount, 10);
  const candleBodyWidth = Math.max(2, Math.min(22, barStep * 0.66));

  const xForIndex = useCallback(
    (idx: number) => (idx - startBarFloat + 0.5) * barStep,
    [startBarFloat, barStep]
  );

  const indexForX = useCallback(
    (x: number) => Math.round(x / barStep + startBarFloat - 0.5),
    [startBarFloat, barStep]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bgCanvas = isDark ? '#0B1120' : '#FFFFFF';
    const gridStroke = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.06)';
    const axisBorder = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.12)';
    const axisText = isDark ? '#94A3B8' : '#475569';

    ctx.fillStyle = bgCanvas;
    ctx.fillRect(0, 0, size.width, size.height);

    if (candles.length === 0) {
      hitBoxesRef.current = [];
      return;
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (let i = startIdx; i <= endIdx; i++) {
      const c = candles[i];
      if (!c) continue;
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;

      if (settings.showBollinger || settings.useAdaptiveBollinger) {
        const b = settings.useAdaptiveBollinger
          ? techAnalysis.adaptiveBollinger[i]
          : techAnalysis.bollinger[i];
        if (b) {
          if (b.upper != null && b.upper > maxPrice) maxPrice = b.upper;
          if (b.lower != null && b.lower < minPrice) minPrice = b.lower;
        }
      }

      if (settings.showKeltner) {
        const kc = techAnalysis.keltner[i];
        if (kc) {
          if (kc.upper != null && kc.upper > maxPrice) maxPrice = kc.upper;
          if (kc.lower != null && kc.lower < minPrice) minPrice = kc.lower;
        }
      }
    }

    const visiblePatterns = patterns.filter(
      (p) => p.endIndex + settings.confirmBarCount >= startIdx && p.startIndex <= endIdx
    );

    for (const p of visiblePatterns) {
      if (p.stopLossLevel < minPrice) minPrice = p.stopLossLevel;
      if (p.stopLossLevel > maxPrice) maxPrice = p.stopLossLevel;
      if (p.confirmationLevel < minPrice) minPrice = p.confirmationLevel;
      if (p.confirmationLevel > maxPrice) maxPrice = p.confirmationLevel;
    }

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      minPrice = 0;
      maxPrice = 100;
    }
    if (maxPrice === minPrice) {
      maxPrice += 1;
      minPrice -= 1;
    }

    const pricePadding = (maxPrice - minPrice) * 0.11;
    const pMax = maxPrice + pricePadding;
    const pMin = minPrice - pricePadding;

    const volZoneHeight = settings.showVolume ? Math.floor(mainPaneHeight * 0.15) : 0;
    const priceAreaBottom = mainPaneHeight - volZoneHeight - 6;
    const priceAreaHeight = Math.max(80, priceAreaBottom - topPad);

    const yForPrice = (price: number) =>
      topPad + ((pMax - price) / (pMax - pMin)) * priceAreaHeight;
    const priceForY = (y: number) =>
      pMax - ((y - topPad) / priceAreaHeight) * (pMax - pMin);

    // =========================================================================
    // MAIN PRICE PANE CLIP
    // =========================================================================
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, plotWidth, mainPaneHeight);
    ctx.clip();

    // Grid lines
    const priceSteps = 5;
    ctx.strokeStyle = gridStroke;
    ctx.lineWidth = 1;
    for (let s = 0; s <= priceSteps; s++) {
      const y = Math.round(topPad + (priceAreaHeight / priceSteps) * s) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();
    }

    const approxGridSpacingPx = 110;
    const barGridInterval = Math.max(1, Math.round(approxGridSpacingPx / barStep));
    for (let i = startIdx; i <= endIdx; i++) {
      if (i % barGridInterval !== 0) continue;
      const x = Math.round(xForIndex(i)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mainPaneHeight);
      ctx.stroke();
    }

    // 1. LAYER: Destek / Direnç Bölgeleri & Rol Değişimi (S/R Zones)
    if (settings.showSRZones && techAnalysis.zones.length > 0) {
      for (const z of techAnalysis.zones) {
        const yTop = yForPrice(z.highBound);
        const yBot = yForPrice(z.lowBound);
        const yMid = yForPrice(z.centerPrice);
        if (yBot < topPad - 10 || yTop > priceAreaBottom + 10) continue;

        const isSup = z.role === 'support';
        ctx.fillStyle = isSup
          ? isDark
            ? 'rgba(22, 163, 74, 0.09)'
            : 'rgba(22, 163, 74, 0.08)'
          : isDark
            ? 'rgba(220, 38, 38, 0.09)'
            : 'rgba(220, 38, 38, 0.08)';
        ctx.fillRect(0, yTop, plotWidth, Math.max(4, yBot - yTop));

        ctx.strokeStyle = isSup ? 'rgba(22, 163, 74, 0.45)' : 'rgba(220, 38, 38, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, yMid);
        ctx.lineTo(plotWidth, yMid);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = isSup ? '#16A34A' : '#DC2626';
        const roleTag = isSup ? 'DESTEK BÖLGESİ' : 'DİRENÇ BÖLGESİ';
        const flipTag = z.polarityFlipped ? ' · ROL DEĞİŞİMİ' : '';
        ctx.fillText(`${roleTag}${flipTag} (${z.touches}x)`, plotWidth - 8, yTop - 3);
      }
    }

    // 1B. LAYER: Kurumsal Arz & Talep Bölgeleri (Supply & Demand) + HH/HL Swing Yapısı
    if (settings.showSupplyDemand) {
      for (const sd of techAnalysis.supplyDemandZones) {
        const xOrigin = Math.max(0, xForIndex(sd.originIndex));
        const yTop = yForPrice(sd.highBound);
        const yBot = yForPrice(sd.lowBound);
        if (yBot < topPad - 10 || yTop > priceAreaBottom + 10) continue;

        const isDemand = sd.kind === 'demand';
        ctx.fillStyle = isDemand
          ? isDark
            ? 'rgba(16, 185, 129, 0.13)'
            : 'rgba(16, 185, 129, 0.11)'
          : isDark
            ? 'rgba(244, 63, 94, 0.13)'
            : 'rgba(244, 63, 94, 0.11)';
        const boxW = Math.max(24, plotWidth - xOrigin);
        const boxH = Math.max(5, yBot - yTop);
        ctx.fillRect(xOrigin, yTop, boxW, boxH);

        ctx.strokeStyle = isDemand ? 'rgba(16, 185, 129, 0.65)' : 'rgba(244, 63, 94, 0.65)';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(xOrigin, yTop, boxW, boxH);

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isDemand ? '#10B981' : '#F43F5E';
        const tagText = `${isDemand ? 'TALEP (DEMAND)' : 'ARZ (SUPPLY)'}${sd.fresh ? ' · TAZE' : ''} (${sd.departureStrength}x)`;
        ctx.fillText(tagText, Math.min(plotWidth - 165, xOrigin + 5), isDemand ? yBot + 10 : yTop - 4);
      }

      // HH / HL / LH / LL Swing Structure Tags
      for (const sw of techAnalysis.marketRegime.swingTags) {
        if (sw.index < startIdx || sw.index > endIdx) continue;
        const sx = xForIndex(sw.index);
        const sy = yForPrice(sw.price);
        const isBullTag = sw.tag === 'HH' || sw.tag === 'HL';
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isBullTag ? '#10B981' : '#F43F5E';
        ctx.fillText(sw.tag, sx, sw.kind === 'high' ? Math.max(topPad + 10, sy - 7) : Math.min(priceAreaBottom - 3, sy + 13));
      }
    }

    // 2. LAYER: Otomatik Fibonacci Düzeltme Izgarası
    if (settings.showFibonacci && techAnalysis.fibonacci) {
      const fib = techAnalysis.fibonacci;
      const xStart = Math.max(0, xForIndex(fib.swingStartIndex));
      for (const lv of fib.levels) {
        const y = yForPrice(lv.price);
        if (y < topPad - 5 || y > priceAreaBottom + 5) continue;
        const isGolden = Math.abs(lv.ratio - 0.618) < 0.005;
        ctx.strokeStyle = isGolden
          ? 'rgba(245, 158, 11, 0.78)'
          : isDark
            ? 'rgba(56, 189, 248, 0.38)'
            : 'rgba(2, 132, 199, 0.38)';
        ctx.lineWidth = isGolden ? 1.5 : 1;
        ctx.setLineDash(lv.ratio === 0 || lv.ratio === 1 ? [] : [3, 3]);
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(plotWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '500 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = isGolden ? '#F59E0B' : '#38BDF8';
        ctx.fillText(
          `Fib ${lv.label} (${lv.price.toFixed(decimals)})`,
          Math.min(plotWidth - 135, xStart + 6),
          y - 3
        );
      }
    }

    // 3. LAYER: Bollinger Bantları — Standart (20, 2.0) veya Williams Ampirik Optimal (N*, D*)
    if (
      (settings.showBollinger || settings.useAdaptiveBollinger) &&
      techAnalysis.bollinger.length > 0
    ) {
      const isAdaptive = settings.useAdaptiveBollinger;
      const bSeries = isAdaptive ? techAnalysis.adaptiveBollinger : techAnalysis.bollinger;
      const sStart = Math.max(0, startIdx - 1);
      const sEnd = Math.min(candles.length - 1, endIdx + 1);

      // Shaded fill between Upper & Lower band
      ctx.fillStyle = isAdaptive
        ? isDark
          ? 'rgba(20, 184, 166, 0.08)'
          : 'rgba(13, 148, 136, 0.06)'
        : isDark
          ? 'rgba(139, 92, 246, 0.07)'
          : 'rgba(139, 92, 246, 0.06)';
      ctx.beginPath();
      let started = false;
      const lowerPts: Array<{ x: number; y: number }> = [];
      for (let i = sStart; i <= sEnd; i++) {
        const b = bSeries[i];
        if (!b || b.upper == null || b.lower == null) continue;
        const x = xForIndex(i);
        const yU = yForPrice(b.upper);
        const yL = yForPrice(b.lower);
        if (!started) {
          ctx.moveTo(x, yU);
          started = true;
        } else {
          ctx.lineTo(x, yU);
        }
        lowerPts.push({ x, y: yL });
      }
      for (let k = lowerPts.length - 1; k >= 0; k--) {
        ctx.lineTo(lowerPts[k].x, lowerPts[k].y);
      }
      if (started) {
        ctx.closePath();
        ctx.fill();
      }

      const drawBBLine = (getter: (b: (typeof bSeries)[number]) => number | null, dashed: boolean) => {
        ctx.strokeStyle = isAdaptive
          ? dashed
            ? 'rgba(20, 184, 166, 0.55)'
            : 'rgba(20, 184, 166, 0.85)'
          : dashed
            ? 'rgba(139, 92, 246, 0.5)'
            : 'rgba(139, 92, 246, 0.75)';
        ctx.lineWidth = 1.3;
        ctx.setLineDash(dashed ? [3, 3] : []);
        ctx.beginPath();
        let st = false;
        for (let i = sStart; i <= sEnd; i++) {
          const val = bSeries[i] ? getter(bSeries[i]) : null;
          if (val == null) continue;
          const x = xForIndex(i);
          const y = yForPrice(val);
          if (!st) {
            ctx.moveTo(x, y);
            st = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawBBLine((b) => b.upper, false);
      drawBBLine((b) => b.middle, true);
      drawBBLine((b) => b.lower, false);

      const bbOpt = techAnalysis.bollingerOptimization;
      if (isAdaptive) {
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#14B8A6';
        ctx.textAlign = 'left';
        ctx.fillText(
          `Opt. BB(${bbOpt.optimalWindowN}, ${bbOpt.scaledStdDevD}σ)`,
          10,
          topPad + 12
        );
      }

      // Williams Eq. 5 & Eq. 6 Re-Entry Marker
      if (
        bbOpt.eq5Eq6Signal.state !== 'none' &&
        bbOpt.eq5Eq6Signal.barIndex != null &&
        bbOpt.eq5Eq6Signal.price != null &&
        bbOpt.eq5Eq6Signal.barIndex >= startIdx &&
        bbOpt.eq5Eq6Signal.barIndex <= endIdx
      ) {
        const rx = xForIndex(bbOpt.eq5Eq6Signal.barIndex);
        const ry = yForPrice(bbOpt.eq5Eq6Signal.price);
        const isBuyEq5 = bbOpt.eq5Eq6Signal.state === 'buy_reentry';
        const eqCol = isBuyEq5 ? '#14B8A6' : '#F43F5E';

        ctx.fillStyle = eqCol;
        ctx.beginPath();
        ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          isBuyEq5 ? 'EQ5 AL' : 'EQ6 SAT',
          rx,
          isBuyEq5 ? Math.min(mainPaneHeight - 8, ry + 15) : Math.max(topPad + 12, ry - 9)
        );
      }

      // Williams Section 3.1 Outside-Then-Inside %B Divergence Callout
      if (
        bbOpt.bandDivergence &&
        bbOpt.bandDivergence.barIndex >= startIdx &&
        bbOpt.bandDivergence.barIndex <= endIdx
      ) {
        const dIdx = bbOpt.bandDivergence.barIndex;
        const dCandle = candles[dIdx];
        const isBullDiv = bbOpt.bandDivergence.kind === 'bullish_divergence';
        const dx = xForIndex(dIdx);
        const dy = isBullDiv ? yForPrice(dCandle.low) + 15 : yForPrice(dCandle.high) - 10;
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillStyle = isBullDiv ? '#10B981' : '#EF4444';
        ctx.textAlign = 'center';
        ctx.fillText(
          isBullDiv ? '%B Pozitif Uyum.' : '%B Negatif Uyum.',
          dx,
          Math.max(topPad + 12, Math.min(mainPaneHeight - 8, dy))
        );
      }

      // BBMA Strategy Companion: Render 50 EMA alongside Bollinger Bands if not already drawn by showEMA50
      if (!settings.showEMA50 && techAnalysis.ema50.length === candles.length) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let st50 = false;
        for (let i = sStart; i <= sEnd; i++) {
          const v50 = techAnalysis.ema50[i];
          if (v50 == null) continue;
          const x = xForIndex(i);
          const y = yForPrice(v50);
          if (!st50) {
            ctx.moveTo(x, y);
            st50 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      const bbStrat = techAnalysis.bollingerStrategy;

      // BBMA Crossover Marker (Middle BB 20 SMA x 50 EMA)
      if (
        bbStrat.bbmaSignal.crossIndex != null &&
        bbStrat.bbmaSignal.crossPrice != null &&
        bbStrat.bbmaSignal.crossIndex >= startIdx &&
        bbStrat.bbmaSignal.crossIndex <= endIdx
      ) {
        const cx = xForIndex(bbStrat.bbmaSignal.crossIndex);
        const cy = yForPrice(bbStrat.bbmaSignal.crossPrice);
        const isBullCross = bbStrat.bbmaSignal.state.startsWith('bullish');
        const markerCol = isBullCross ? '#16A34A' : '#DC2626';

        ctx.fillStyle = markerCol;
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isDark ? '#0B1120' : '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = markerCol;
        ctx.textAlign = 'center';
        ctx.fillText(
          isBullCross ? 'BBMA AL' : 'BBMA SAT',
          cx,
          isBullCross ? Math.min(mainPaneHeight - 8, cy + 14) : Math.max(topPad + 12, cy - 8)
        );
      }

      // RSI(30/70) + Bollinger Middle Band Trigger & Swing Stop / Target Rays
      if (
        (bbStrat.rsiBbSetup.state === 'buy_triggered' ||
          bbStrat.rsiBbSetup.state === 'sell_triggered') &&
        bbStrat.rsiBbSetup.triggerIndex != null &&
        bbStrat.rsiBbSetup.entryPrice != null &&
        bbStrat.rsiBbSetup.triggerIndex >= startIdx &&
        bbStrat.rsiBbSetup.triggerIndex <= endIdx
      ) {
        const tx = xForIndex(bbStrat.rsiBbSetup.triggerIndex);
        const endRayX = xForIndex(endIdx) + candleBodyWidth;
        const ty = yForPrice(bbStrat.rsiBbSetup.entryPrice);
        const isBuy = bbStrat.rsiBbSetup.state === 'buy_triggered';
        const sigColor = isBuy ? '#10B981' : '#EF4444';

        ctx.fillStyle = sigColor;
        ctx.beginPath();
        ctx.arc(tx, ty, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(isBuy ? 'RSI+BB AL' : 'RSI+BB SAT', tx + 7, ty + 3);

        if (bbStrat.rsiBbSetup.stopLoss != null) {
          const sy = yForPrice(bbStrat.rsiBbSetup.stopLoss);
          ctx.strokeStyle = 'rgba(220, 38, 38, 0.7)';
          ctx.lineWidth = 1.1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(tx, sy);
          ctx.lineTo(endRayX, sy);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (bbStrat.rsiBbSetup.targetPrice != null) {
          const py = yForPrice(bbStrat.rsiBbSetup.targetPrice);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.lineWidth = 1.1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(tx, py);
          ctx.lineTo(endRayX, py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Band Chart Pattern Callout (W-Dip, Klasik M-Tepe, 3 Zirve İtişi)
      if (
        bbStrat.bandPattern &&
        bbStrat.bandPattern.barIndex >= startIdx &&
        bbStrat.bandPattern.barIndex <= endIdx
      ) {
        const bpIdx = bbStrat.bandPattern.barIndex;
        const bpCandle = candles[bpIdx];
        const isW = bbStrat.bandPattern.kind === 'w_bottom';
        const bx = xForIndex(bpIdx);
        const by = isW ? yForPrice(bpCandle.low) + 14 : yForPrice(bpCandle.high) - 8;
        ctx.font = '600 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isW ? '#10B981' : '#F59E0B';
        ctx.textAlign = 'center';
        const shortTag =
          bbStrat.bandPattern.kind === 'w_bottom'
            ? 'BB W-Dip'
            : bbStrat.bandPattern.kind === 'm_top'
              ? 'BB M-Tepe'
              : 'BB 3 İtiş';
        ctx.fillText(shortTag, bx, Math.max(topPad + 12, Math.min(mainPaneHeight - 8, by)));
      }
    }

    // 3B. LAYER: Keltner Kanalı (20 EMA ± 2 × ATR 14) & Kanıtlanmış 3-Yöntem Sinyalleri
    if (settings.showKeltner && techAnalysis.keltner.length > 0) {
      const kSeries = techAnalysis.keltner;
      const sStart = Math.max(0, startIdx - 1);
      const sEnd = Math.min(candles.length - 1, endIdx + 1);

      ctx.fillStyle = isDark ? 'rgba(249, 115, 22, 0.065)' : 'rgba(249, 115, 22, 0.055)';
      ctx.beginPath();
      let started = false;
      const lowerPts: Array<{ x: number; y: number }> = [];
      for (let i = sStart; i <= sEnd; i++) {
        const kc = kSeries[i];
        if (!kc || kc.upper == null || kc.lower == null) continue;
        const x = xForIndex(i);
        const yU = yForPrice(kc.upper);
        const yL = yForPrice(kc.lower);
        if (!started) {
          ctx.moveTo(x, yU);
          started = true;
        } else {
          ctx.lineTo(x, yU);
        }
        lowerPts.push({ x, y: yL });
      }
      for (let k = lowerPts.length - 1; k >= 0; k--) {
        ctx.lineTo(lowerPts[k].x, lowerPts[k].y);
      }
      if (started) {
        ctx.closePath();
        ctx.fill();
      }

      const drawKCLine = (getter: (k: (typeof kSeries)[number]) => number | null, dashed: boolean) => {
        ctx.strokeStyle = dashed ? 'rgba(245, 158, 11, 0.72)' : 'rgba(249, 115, 22, 0.88)';
        ctx.lineWidth = dashed ? 1.3 : 1.5;
        ctx.setLineDash(dashed ? [4, 3] : []);
        ctx.beginPath();
        let st = false;
        for (let i = sStart; i <= sEnd; i++) {
          const val = kSeries[i] ? getter(kSeries[i]) : null;
          if (val == null) continue;
          const x = xForIndex(i);
          const y = yForPrice(val);
          if (!st) {
            ctx.moveTo(x, y);
            st = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawKCLine((k) => k.upper, false);
      drawKCLine((k) => k.middle, true);
      drawKCLine((k) => k.lower, false);

      const ks = techAnalysis.keltnerStrategy;
      const labelOffsetY = settings.useAdaptiveBollinger ? topPad + 25 : topPad + 12;
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#F97316';
      ctx.textAlign = 'left';
      ctx.fillText(
        ks.ttmSqueezeActive
          ? 'Keltner(20, 2 ATR) · TTM SQUEEZE AKTİF!'
          : 'Keltner(20 EMA, 2×ATR)',
        10,
        labelOffsetY
      );

      // Yöntem 1: KC + ADX(>20) Kırılım İşaretçisi
      if (
        ks.breakoutSignal.state !== 'none' &&
        ks.breakoutSignal.barIndex != null &&
        ks.breakoutSignal.price != null &&
        ks.breakoutSignal.barIndex >= startIdx &&
        ks.breakoutSignal.barIndex <= endIdx
      ) {
        const bx = xForIndex(ks.breakoutSignal.barIndex);
        const by = yForPrice(ks.breakoutSignal.price);
        const isBuy = ks.breakoutSignal.state === 'buy_breakout';
        const col = isBuy ? '#10B981' : '#EF4444';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(bx, by, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          isBuy ? 'KC+ADX AL' : 'KC+ADX SAT',
          bx,
          isBuy ? Math.max(topPad + 12, by - 9) : Math.min(mainPaneHeight - 8, by + 15)
        );
      }

      // Yöntem 2: Yatay KC + RSI(2) 10/90 Giriş & Dış Bant Arkası Stop Işını
      if (
        ks.rangeRsi2Signal.state !== 'none' &&
        ks.rangeRsi2Signal.barIndex != null &&
        ks.rangeRsi2Signal.entryPrice != null &&
        ks.rangeRsi2Signal.barIndex >= startIdx &&
        ks.rangeRsi2Signal.barIndex <= endIdx
      ) {
        const rx = xForIndex(ks.rangeRsi2Signal.barIndex);
        const ry = yForPrice(ks.rangeRsi2Signal.entryPrice);
        const isBuy = ks.rangeRsi2Signal.state === 'buy_range';
        const col = isBuy ? '#16A34A' : '#DC2626';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(rx, ry, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(isBuy ? 'KC+RSI(2)<10 AL' : 'KC+RSI(2)>90 SAT', rx + 7, ry + 3);

        if (ks.rangeRsi2Signal.stopLoss != null) {
          const sy = yForPrice(ks.rangeRsi2Signal.stopLoss);
          const endRayX = xForIndex(endIdx) + candleBodyWidth;
          ctx.strokeStyle = 'rgba(220, 38, 38, 0.72)';
          ctx.lineWidth = 1.1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(rx, sy);
          ctx.lineTo(endRayX, sy);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Yöntem 3: Güçlü Trend 20 EMA Pullback + StochRSI Kesişimi
      if (
        ks.pullbackStochRsiSignal.state !== 'none' &&
        ks.pullbackStochRsiSignal.barIndex != null &&
        ks.pullbackStochRsiSignal.price != null &&
        ks.pullbackStochRsiSignal.barIndex >= startIdx &&
        ks.pullbackStochRsiSignal.barIndex <= endIdx
      ) {
        const px = xForIndex(ks.pullbackStochRsiSignal.barIndex);
        const py = yForPrice(ks.pullbackStochRsiSignal.price);
        const isBuy = ks.pullbackStochRsiSignal.state === 'buy_pullback';
        const col = isBuy ? '#0EA5E9' : '#F43F5E';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          isBuy ? 'KC PULLBACK AL' : 'KC PULLBACK SAT',
          px,
          isBuy ? Math.min(mainPaneHeight - 8, py + 15) : Math.max(topPad + 12, py - 9)
        );
      }
    }

    // 3D. LAYER: The 50 CCI & 34 EMA Stratejisi (Buzz / Traders Haven)
    if (settings.showCCI50 && techAnalysis.cci50Strategy) {
      const cs = techAnalysis.cci50Strategy;
      const sStart = Math.max(0, startIdx - 1);
      const sEnd = Math.min(candles.length - 1, endIdx + 1);

      // 1. 204 EMA (HTF 6:1 34 EMA Baseline)
      if (techAnalysis.ema204.length > 0) {
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let st204 = false;
        for (let i = sStart; i <= sEnd; i++) {
          const val = techAnalysis.ema204[i];
          if (val == null) continue;
          const x = xForIndex(i);
          const y = yForPrice(val);
          if (!st204) {
            ctx.moveTo(x, y);
            st204 = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. 34 EMA with Dynamic Segment-by-Segment Slope Coloring (Cyan: Up, Crimson: Down)
      if (techAnalysis.ema34.length > 0) {
        ctx.lineWidth = 2.4;
        for (let i = sStart + 1; i <= sEnd; i++) {
          const vPrev = techAnalysis.ema34[i - 1];
          const vCur = techAnalysis.ema34[i];
          if (vPrev == null || vCur == null) continue;
          const isUp = vCur >= vPrev;
          ctx.strokeStyle = isUp ? '#06B6D4' : '#991B1B';
          ctx.beginPath();
          ctx.moveTo(xForIndex(i - 1), yForPrice(vPrev));
          ctx.lineTo(xForIndex(i), yForPrice(vCur));
          ctx.stroke();
        }
      }

      // 3. Top-left Status readout
      const activeIdx =
        hoveredIndex ?? selectedCandleIndex ?? (candles.length > 0 ? candles.length - 1 : 0);
      const curCci50 = techAnalysis.cci50[activeIdx] ?? cs.cci50Value;
      const curCci14 = techAnalysis.cci14[activeIdx] ?? cs.cci14Value;
      const labelY = topPad + 12;

      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = cs.isChopZone ? '#F59E0B' : (curCci50 ?? 0) >= 0 ? '#10B981' : '#EF4444';
      const cci50Text = curCci50 != null ? `${curCci50 > 0 ? '+' : ''}${curCci50.toFixed(1)}` : 'N/A';
      const cci14Text = curCci14 != null ? `${curCci14 > 0 ? '+' : ''}${curCci14.toFixed(1)}` : 'N/A';
      ctx.fillText(
        cs.isChopZone
          ? `34 EMA & 50 CCI · ⚠️ CHOP BÖLGESİ (50 CCI: ${cci50Text} · 14 CCI: ${cci14Text})`
          : `34 EMA (Cyan/Kahve) & 50 CCI [50: ${cci50Text} · 14: ${cci14Text}] · 204 EMA (HTF)`,
        10,
        labelY
      );

      // Setup 1: 5034 Reversal Marker
      if (
        cs.setup5034.state !== 'none' &&
        cs.setup5034.barIndex != null &&
        cs.setup5034.price != null &&
        cs.setup5034.barIndex >= startIdx &&
        cs.setup5034.barIndex <= endIdx
      ) {
        const sx = xForIndex(cs.setup5034.barIndex);
        const sy = yForPrice(cs.setup5034.price);
        const isBuy = cs.setup5034.state === 'buy_5034';
        const col = isBuy ? '#10B981' : '#EF4444';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(
          isBuy ? '5034 DÖNÜŞ AL' : '5034 DÖNÜŞ SAT',
          sx,
          isBuy ? Math.max(topPad + 14, sy - 10) : Math.min(mainPaneHeight - 8, sy + 16)
        );
      }

      // Setup 2: 5034z Pullback (ZLR Hook) Marker
      if (
        cs.setup5034z.state !== 'none' &&
        cs.setup5034z.barIndex != null &&
        cs.setup5034z.price != null &&
        cs.setup5034z.barIndex >= startIdx &&
        cs.setup5034z.barIndex <= endIdx
      ) {
        const zx = xForIndex(cs.setup5034z.barIndex);
        const zy = yForPrice(cs.setup5034z.price);
        const isBuy = cs.setup5034z.state === 'buy_5034z';
        const col = '#06B6D4';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(zx, zy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(
          isBuy ? '5034z ZLR AL' : '5034z ZLR SAT',
          zx,
          isBuy ? Math.min(mainPaneHeight - 8, zy + 15) : Math.max(topPad + 14, zy - 10)
        );
      }

      // Setup 3: 50140 Strong Trend Re-entry Marker
      if (
        cs.setup50140.state !== 'none' &&
        cs.setup50140.barIndex != null &&
        cs.setup50140.price != null &&
        cs.setup50140.barIndex >= startIdx &&
        cs.setup50140.barIndex <= endIdx
      ) {
        const fx = xForIndex(cs.setup50140.barIndex);
        const fy = yForPrice(cs.setup50140.price);
        const isBuy = cs.setup50140.state === 'buy_50140';
        const col = '#F59E0B';
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(fx, fy, 4.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(
          isBuy ? '50140 DEVAM AL' : '50140 DEVAM SAT',
          fx,
          isBuy ? Math.max(topPad + 14, fy - 10) : Math.min(mainPaneHeight - 8, fy + 16)
        );
      }
    }

    // 3E. LAYER: Courtney Capital Dual Osilatör Sistemi (Slow Stoch 13,8,4 & CCI 20)
    if (settings.showCourtney && techAnalysis.courtneyStrategy) {
      const court = techAnalysis.courtneyStrategy;

      // 1. Dual Confluence Signal Marker (Slayt 18–30)
      if (
        court.dualConfluenceSignal.state !== 'none' &&
        court.dualConfluenceSignal.barIndex != null &&
        court.dualConfluenceSignal.price != null &&
        court.dualConfluenceSignal.barIndex >= startIdx &&
        court.dualConfluenceSignal.barIndex <= endIdx
      ) {
        const cx = xForIndex(court.dualConfluenceSignal.barIndex);
        const cy = yForPrice(court.dualConfluenceSignal.price);
        const isBuy = court.dualConfluenceSignal.state === 'buy_confluence';
        const col = isBuy ? '#14B8A6' : '#F43F5E';

        // Outer halo
        ctx.fillStyle = isBuy ? 'rgba(20, 184, 166, 0.25)' : 'rgba(244, 63, 94, 0.25)';
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid dot
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(cx, cy, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = col;
        ctx.fillText(
          isBuy ? 'COURTNEY AL (13,8,4 + CCI20)' : 'COURTNEY SAT (13,8,4 + CCI20)',
          cx,
          isBuy ? Math.max(topPad + 14, cy - 12) : Math.min(mainPaneHeight - 8, cy + 18)
        );
      }

      // 2. Divergence Banner (Boğa veya Ayı Uyumsuzluğu)
      if (court.divergence.kind !== 'none') {
        const isBullDiv = court.divergence.kind === 'bullish_divergence';
        const divCol = isBullDiv ? '#10B981' : '#EF4444';
        const badgeX = 16;
        const badgeY = topPad + 44;

        ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isBullDiv ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(badgeX, badgeY - 11, 230, 18);
        ctx.strokeStyle = divCol;
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY - 11, 230, 18);

        ctx.fillStyle = divCol;
        ctx.textAlign = 'left';
        ctx.fillText(
          isBullDiv ? '▲ Courtney Boğa Divergence (Stoch/CCI)' : '▼ Courtney Ayı Divergence (Stoch/CCI)',
          badgeX + 6,
          badgeY + 2
        );
      }
    }

    // 4. LAYER: Trend Çizgisi ve Paralel Trend Kanalı
    if (settings.showTrendChannel && techAnalysis.trendChannel) {
      const tc = techAnalysis.trendChannel;
      const x1 = xForIndex(tc.startIndex);
      const x2 = xForIndex(tc.endIndex);
      const yP1 = yForPrice(tc.primaryStartPrice);
      const yP2 = yForPrice(tc.primaryEndPrice);
      const yC1 = yForPrice(tc.channelStartPrice);
      const yC2 = yForPrice(tc.channelEndPrice);

      // Subtle Channel Polygon Fill
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.045)' : 'rgba(2, 132, 199, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x1, yP1);
      ctx.lineTo(x2, yP2);
      ctx.lineTo(x2, yC2);
      ctx.lineTo(x1, yC1);
      ctx.closePath();
      ctx.fill();

      // Primary Trendline
      ctx.strokeStyle =
        tc.direction === 'uptrend'
          ? '#0EA5E9'
          : tc.direction === 'downtrend'
            ? '#F97316'
            : '#64748B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, yP1);
      ctx.lineTo(x2, yP2);
      ctx.stroke();

      // Parallel Channel Line
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x1, yC1);
      ctx.lineTo(x2, yC2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. LAYER: Üçgen & Sıkışma Formasyonu + H Hedef Projeksiyonu
    if (settings.showGeometric && techAnalysis.geometricStructure) {
      const gs = techAnalysis.geometricStructure;
      const x1 = xForIndex(gs.startIndex);
      const x2 = xForIndex(gs.endIndex);
      const yU1 = yForPrice(gs.upperStartPrice);
      const yU2 = yForPrice(gs.upperEndPrice);
      const yL1 = yForPrice(gs.lowerStartPrice);
      const yL2 = yForPrice(gs.lowerEndPrice);

      ctx.fillStyle = isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x1, yU1);
      ctx.lineTo(x2, yU2);
      ctx.lineTo(x2, yL2);
      ctx.lineTo(x1, yL1);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x1, yU1);
      ctx.lineTo(x2, yU2);
      ctx.moveTo(x1, yL1);
      ctx.lineTo(x2, yL2);
      ctx.stroke();

      // Mouth Height H indicator at startIndex
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, yU1);
      ctx.lineTo(x1, yL1);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'left';
      ctx.fillText(gs.turkishName, Math.max(8, x1 + 6), Math.max(topPad + 12, yU1 - 6));
    }

    // Volume histogram
    if (settings.showVolume && maxVol > 0) {
      for (let i = startIdx; i <= endIdx; i++) {
        const c = candles[i];
        const x = xForIndex(i);
        const h = (c.volume / maxVol) * (volZoneHeight - 4);
        const isBull = c.close >= c.open;
        ctx.fillStyle = isBull
          ? isDark
            ? 'rgba(22, 163, 74, 0.22)'
            : 'rgba(22, 163, 74, 0.18)'
          : isDark
            ? 'rgba(220, 38, 38, 0.22)'
            : 'rgba(220, 38, 38, 0.18)';
        ctx.fillRect(x - candleBodyWidth / 2, mainPaneHeight - h, candleBodyWidth, h);
      }
    }

    // Selected candle highlight column
    if (selectedCandleIndex != null && selectedCandleIndex >= startIdx && selectedCandleIndex <= endIdx) {
      const sx = xForIndex(selectedCandleIndex);
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.07)' : 'rgba(2, 132, 199, 0.06)';
      ctx.fillRect(sx - barStep / 2, 0, barStep, mainPaneHeight);
    }

    // EMA 20 & EMA 50
    const drawLineSeries = (series: Array<number | null>, color: string) => {
      if (series.length === 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = Math.max(0, startIdx - 1); i <= Math.min(candles.length - 1, endIdx + 1); i++) {
        const val = series[i];
        if (val == null) continue;
        const x = xForIndex(i);
        const y = yForPrice(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    if (settings.showEMA10) drawLineSeries(techAnalysis.ema10, '#EC4899');
    if (settings.showMA8_21) {
      drawLineSeries(techAnalysis.ma8, '#10B981');
      drawLineSeries(techAnalysis.ma21, '#6366F1');
    }
    if (settings.showEMA20) drawLineSeries(ema20, '#38BDF8');
    if (settings.showEMA50) drawLineSeries(ema50, '#F59E0B');

    // Candlestick Pattern Bounding Boxes + Confirmation & Stoploss Rays (73 Patterns)
    const newHitBoxes: HitBox[] = [];

    for (const p of visiblePatterns) {
      const isSelected = p.id === selectedPatternId;
      let strokeColor = p.direction === 'bullish' ? '#16A34A' : '#DC2626';
      let fillTint =
        p.direction === 'bullish' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)';

      if (settings.colorMode === 'status') {
        if (p.status === 'confirmed') {
          strokeColor = '#16A34A';
          fillTint = 'rgba(22, 163, 74, 0.10)';
        } else if (p.status === 'not_confirmed') {
          strokeColor = '#D97706';
          fillTint = 'rgba(217, 119, 6, 0.09)';
        } else {
          strokeColor = '#DC2626';
          fillTint = 'rgba(220, 38, 38, 0.09)';
        }
      }

      const x1 = xForIndex(p.startIndex) - candleBodyWidth * 0.78 - 2;
      const x2 = xForIndex(p.endIndex) + candleBodyWidth * 0.78 + 2;
      const y1 = yForPrice(p.highBound) - 6;
      const y2 = yForPrice(p.lowBound) + 6;

      newHitBoxes.push({ pattern: p, x1, y1, x2, y2 });

      ctx.fillStyle = isSelected
        ? p.direction === 'bullish'
          ? 'rgba(22, 163, 74, 0.18)'
          : 'rgba(220, 38, 38, 0.18)'
        : fillTint;
      ctx.fillRect(x1, y1, Math.max(8, x2 - x1), Math.max(10, y2 - y1));

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 2.2 : 1.4;
      if (p.patternType === 'continuation' && !isSelected) {
        ctx.setLineDash([4, 2]);
      }
      ctx.strokeRect(x1, y1, Math.max(8, x2 - x1), Math.max(10, y2 - y1));
      ctx.setLineDash([]);

      const rayEndBar = p.endIndex + settings.confirmBarCount;
      const rayX2 = xForIndex(rayEndBar) + candleBodyWidth * 0.4;
      const yConf = yForPrice(p.confirmationLevel);
      const yStop = yForPrice(p.stopLossLevel);

      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = isSelected ? 1.9 : 1.25;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, yConf);
      ctx.lineTo(Math.max(x2 + 14, rayX2), yConf);
      ctx.stroke();

      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = isSelected ? 1.9 : 1.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x2, yStop);
      ctx.lineTo(Math.max(x2 + 14, rayX2), yStop);
      ctx.stroke();
      ctx.setLineDash([]);

      if (barStep >= 5 || isSelected) {
        ctx.font = `${isSelected ? '600' : '500'} 10px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = isSelected ? (isDark ? '#F8FAFC' : '#0F172A') : strokeColor;
        const cx = (x1 + x2) / 2;
        ctx.textAlign = 'center';
        const fBadge = p.morrisFilter?.isFilteredSignal ? ' [F]' : '';
        if (p.direction === 'bullish') {
          ctx.fillText(`↑ ${p.turkishName}${fBadge}`, cx, Math.min(priceAreaBottom - 2, y2 + 13));
        } else {
          ctx.fillText(`↓ ${p.turkishName}${fBadge}`, cx, Math.max(topPad + 10, y1 - 6));
        }

        if (isSelected) {
          const labelX = Math.min(plotWidth - 135, Math.max(x2 + 4, rayX2 + 4));
          ctx.font = '600 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillStyle = '#16A34A';
          ctx.fillText(`TEYİT ${p.confirmationLevel.toFixed(decimals)}`, labelX, yConf + 3);
          ctx.fillStyle = '#DC2626';
          ctx.fillText(`STOP ${p.stopLossLevel.toFixed(decimals)}`, labelX, yStop + 3);

          // Trading Bible %50 Retracement Entry & Next Key Target Rays
          if (p.confluencePlan) {
            const y50 = yForPrice(p.confluencePlan.conservativeEntry);
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(x1, y50);
            ctx.lineTo(Math.max(x2 + 14, rayX2), y50);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#F59E0B';
            ctx.fillText(
              `%50 GİRİŞ ${p.confluencePlan.conservativeEntry.toFixed(decimals)}`,
              labelX,
              y50 + 3
            );

            const yTp = yForPrice(p.confluencePlan.nextTargetPrice);
            if (yTp >= topPad + 6 && yTp <= priceAreaBottom - 6) {
              ctx.strokeStyle = '#0EA5E9';
              ctx.lineWidth = 1.3;
              ctx.setLineDash([5, 3]);
              ctx.beginPath();
              ctx.moveTo(x2, yTp);
              ctx.lineTo(Math.max(x2 + 24, rayX2 + 16), yTp);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.fillStyle = '#0EA5E9';
              ctx.fillText(
                `HEDEF ${p.confluencePlan.nextTargetPrice.toFixed(decimals)} (1:${p.confluencePlan.rrConservative})`,
                labelX,
                yTp + 3
              );
            }
          }
        }
      }
    }

    hitBoxesRef.current = newHitBoxes;

    // Candlesticks (Supports Greg Morris Chapter 9 "CandlePower" Volume-Width Scaling)
    let visibleVolSum = 0;
    let visibleVolCount = 0;
    for (let i = startIdx; i <= endIdx; i++) {
      if (candles[i] && candles[i].volume > 0) {
        visibleVolSum += candles[i].volume;
        visibleVolCount++;
      }
    }
    const avgVisibleVol = visibleVolCount > 0 ? visibleVolSum / visibleVolCount : 0;

    for (let i = startIdx; i <= endIdx; i++) {
      const c = candles[i];
      if (!c) continue;
      const x = Math.round(xForIndex(i));
      const yHigh = yForPrice(c.high);
      const yLow = yForPrice(c.low);
      const yOpen = yForPrice(c.open);
      const yClose = yForPrice(c.close);

      const isBull = c.close >= c.open;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(1.5, Math.abs(yClose - yOpen));

      let wickColor = isBull ? '#16A34A' : '#DC2626';
      let bodyFill = isBull ? '#16A34A' : '#DC2626';
      let bodyStroke = isBull ? '#16A34A' : '#DC2626';

      if (settings.candleStyle === 'matriks') {
        wickColor = isDark ? '#CBD5E1' : '#0F172A';
        if (isBull) {
          bodyFill = isDark ? '#F8FAFC' : '#FFFFFF';
          bodyStroke = isDark ? '#E2E8F0' : '#0F172A';
        } else {
          bodyFill = isDark ? '#1E293B' : '#0F172A';
          bodyStroke = isDark ? '#94A3B8' : '#0F172A';
        }
      }

      const volScale =
        settings.candlePower && avgVisibleVol > 0 && c.volume > 0
          ? Math.max(0.32, Math.min(1.52, c.volume / avgVisibleVol))
          : 1;
      const dynamicBodyW = settings.candlePower
        ? Math.max(1.8, Math.min(barStep * 0.94, candleBodyWidth * volScale))
        : candleBodyWidth;

      ctx.strokeStyle = wickColor;
      ctx.lineWidth = Math.max(1, dynamicBodyW > 8 ? 1.4 : 1);
      ctx.beginPath();
      ctx.moveTo(x + 0.5, yHigh);
      ctx.lineTo(x + 0.5, yLow);
      ctx.stroke();

      const bx = x - dynamicBodyW / 2;
      ctx.fillStyle = bodyFill;
      ctx.fillRect(bx, bodyTop, dynamicBodyW, bodyH);
      if (settings.candleStyle === 'matriks' || dynamicBodyW >= 5) {
        ctx.strokeStyle = bodyStroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, bodyTop, dynamicBodyW, bodyH);
      }
    }

    // Live Price Dotted Line
    const lastCandle = candles[candles.length - 1];
    if (lastCandle) {
      const yLast = yForPrice(lastCandle.close);
      if (yLast >= topPad && yLast <= priceAreaBottom) {
        const lastBull = lastCandle.close >= lastCandle.open;
        ctx.strokeStyle = lastBull ? 'rgba(22, 163, 74, 0.55)' : 'rgba(220, 38, 38, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, yLast);
        ctx.lineTo(plotWidth, yLast);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();

    // =========================================================================
    // 6. LOWER PANE: MACD (12, 26, 9) SUB-CHART
    // =========================================================================
    if (settings.showMACD && macdPaneHeight > 0) {
      const macdTop = mainPaneHeight;
      const macdBottom = mainPaneHeight + macdPaneHeight;

      // Divider between Main Price Pane & MACD Pane
      ctx.strokeStyle = axisBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, macdTop + 0.5);
      ctx.lineTo(size.width, macdTop + 0.5);
      ctx.stroke();

      let maxAbsMacd = 1e-6;
      for (let i = startIdx; i <= endIdx; i++) {
        const mp = techAnalysis.macd[i];
        if (!mp) continue;
        if (mp.macd != null) maxAbsMacd = Math.max(maxAbsMacd, Math.abs(mp.macd));
        if (mp.signal != null) maxAbsMacd = Math.max(maxAbsMacd, Math.abs(mp.signal));
        if (mp.histogram != null) maxAbsMacd = Math.max(maxAbsMacd, Math.abs(mp.histogram));
      }
      maxAbsMacd *= 1.18;

      const padM = 14;
      const macdZeroY = macdTop + macdPaneHeight / 2;
      const halfAvail = Math.max(20, macdPaneHeight / 2 - padM);
      const yForMacd = (v: number) => macdZeroY - (v / maxAbsMacd) * halfAvail;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, macdTop, plotWidth, macdPaneHeight);
      ctx.clip();

      // Zero line
      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, macdZeroY + 0.5);
      ctx.lineTo(plotWidth, macdZeroY + 0.5);
      ctx.stroke();

      // Histogram bars
      for (let i = startIdx; i <= endIdx; i++) {
        const mp = techAnalysis.macd[i];
        if (!mp || mp.histogram == null) continue;
        const x = xForIndex(i);
        const yH = yForMacd(mp.histogram);
        const pos = mp.histogram >= 0;
        ctx.fillStyle = pos ? 'rgba(22, 163, 74, 0.45)' : 'rgba(220, 38, 38, 0.45)';
        ctx.fillRect(
          x - candleBodyWidth * 0.45,
          Math.min(macdZeroY, yH),
          Math.max(1.5, candleBodyWidth * 0.9),
          Math.max(1, Math.abs(yH - macdZeroY))
        );
      }

      // Draw MACD Line (12,26) & Signal Line (9)
      const drawMacdCurve = (getter: (m: (typeof techAnalysis.macd)[number]) => number | null, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let st = false;
        for (let i = Math.max(0, startIdx - 1); i <= Math.min(candles.length - 1, endIdx + 1); i++) {
          const val = techAnalysis.macd[i] ? getter(techAnalysis.macd[i]) : null;
          if (val == null) continue;
          const x = xForIndex(i);
          const y = yForMacd(val);
          if (!st) {
            ctx.moveTo(x, y);
            st = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      drawMacdCurve((m) => m.macd, '#38BDF8');
      drawMacdCurve((m) => m.signal, '#F97316');

      // Mark Crossover Dots (Trend Başlangıcı)
      for (let i = Math.max(1, startIdx); i <= endIdx; i++) {
        const cur = techAnalysis.macd[i];
        const prev = techAnalysis.macd[i - 1];
        if (
          cur?.macd != null &&
          cur?.signal != null &&
          prev?.macd != null &&
          prev?.signal != null
        ) {
          const bullCross = prev.macd <= prev.signal && cur.macd > cur.signal;
          const bearCross = prev.macd >= prev.signal && cur.macd < cur.signal;
          if (bullCross || bearCross) {
            const cx = xForIndex(i);
            const cy = yForMacd(cur.macd);
            ctx.fillStyle = bullCross ? '#16A34A' : '#DC2626';
            ctx.beginPath();
            ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // MACD Pane Title Label
      const activeIdx =
        hoveredIndex ?? selectedCandleIndex ?? (candles.length > 0 ? candles.length - 1 : 0);
      const activeMacd = techAnalysis.macd[activeIdx];
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = axisText;
      ctx.fillText('MACD (12, 26, 9)', 10, macdTop + 15);
      if (activeMacd?.macd != null && activeMacd?.signal != null) {
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`MACD: ${activeMacd.macd.toFixed(decimals)}`, 118, macdTop + 15);
        ctx.fillStyle = '#F97316';
        ctx.fillText(`Sinyal: ${activeMacd.signal.toFixed(decimals)}`, 235, macdTop + 15);
      }

      ctx.restore();

      // Right axis labels for MACD
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = axisText;
      ctx.textAlign = 'left';
      ctx.fillText('0.00', plotWidth + 8, macdZeroY + 3);
      ctx.fillText((maxAbsMacd * 0.75).toFixed(decimals), plotWidth + 8, macdTop + 18);
      ctx.fillText((-maxAbsMacd * 0.75).toFixed(decimals), plotWidth + 8, macdBottom - 8);
    }

    // =========================================================================
    // 7. LOWER PANE: GREG MORRIS PRE-SIGNAL FILTER (STOCHASTIC %D & WILDER RSI 14)
    // =========================================================================
    if (settings.showMorrisFilter && morrisPaneHeight > 0) {
      const mTop = mainPaneHeight + macdPaneHeight;
      const mBottom = mTop + morrisPaneHeight;

      ctx.strokeStyle = axisBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, mTop + 0.5);
      ctx.lineTo(size.width, mTop + 0.5);
      ctx.stroke();

      const padOsc = 12;
      const oscHeight = Math.max(24, morrisPaneHeight - padOsc * 2);
      const yForOsc = (val: number) =>
        mTop + padOsc + ((100 - Math.max(0, Math.min(100, val))) / 100) * oscHeight;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, mTop, plotWidth, morrisPaneHeight);
      ctx.clip();

      // Selling Pre-Signal Band (80..100) & Buying Pre-Signal Band (0..20)
      const y80 = yForOsc(80);
      const y20 = yForOsc(20);
      const y50 = yForOsc(50);
      const y100 = yForOsc(100);
      const y0 = yForOsc(0);

      ctx.fillStyle = isDark ? 'rgba(220, 38, 38, 0.09)' : 'rgba(220, 38, 38, 0.07)';
      ctx.fillRect(0, y100, plotWidth, Math.max(2, y80 - y100));

      ctx.fillStyle = isDark ? 'rgba(22, 163, 74, 0.09)' : 'rgba(22, 163, 74, 0.07)';
      ctx.fillRect(0, y20, plotWidth, Math.max(2, y0 - y20));

      ctx.strokeStyle = 'rgba(220, 38, 38, 0.45)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y80);
      ctx.lineTo(plotWidth, y80);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(22, 163, 74, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, y20);
      ctx.lineTo(plotWidth, y20);
      ctx.stroke();

      ctx.strokeStyle = gridStroke;
      ctx.beginPath();
      ctx.moveTo(0, y50);
      ctx.lineTo(plotWidth, y50);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Stochastic %D(14,3) (#38BDF8) & Wilder RSI(14) (#A855F7)
      const drawOscLine = (getter: (idx: number) => number | null, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let st = false;
        for (let i = Math.max(0, startIdx - 1); i <= Math.min(candles.length - 1, endIdx + 1); i++) {
          const v = getter(i);
          if (v == null) continue;
          const x = xForIndex(i);
          const y = yForOsc(v);
          if (!st) {
            ctx.moveTo(x, y);
            st = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      drawOscLine((idx) => techAnalysis.stochastic[idx]?.pctD ?? null, '#38BDF8');
      drawOscLine((idx) => techAnalysis.rsi14[idx] ?? null, '#A855F7');

      // Highlight Filtered Pattern Dots on %D/RSI
      for (const p of visiblePatterns) {
        if (!p.morrisFilter?.isFilteredSignal) continue;
        const val =
          p.morrisFilter.stochDAtSignal ?? p.morrisFilter.rsiAtSignal;
        if (val == null) continue;
        const cx = xForIndex(p.endIndex);
        const cy = yForOsc(val);
        ctx.fillStyle = p.direction === 'bullish' ? '#16A34A' : '#DC2626';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }

      const activeIdx =
        hoveredIndex ?? selectedCandleIndex ?? (candles.length > 0 ? candles.length - 1 : 0);
      const actD = techAnalysis.stochastic[activeIdx]?.pctD;
      const actRsi = techAnalysis.rsi14[activeIdx];
      const actPctB = techAnalysis.bollinger[activeIdx]?.pctB;

      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = axisText;
      ctx.fillText('MORRIS FİLTRESİ', 10, mTop + 14);
      if (actD != null) {
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(`%D(14,3): ${actD.toFixed(1)}`, 118, mTop + 14);
      }
      if (actRsi != null) {
        ctx.fillStyle = '#A855F7';
        ctx.fillText(`RSI(14): ${actRsi.toFixed(1)}`, 216, mTop + 14);
      }
      if (actPctB != null) {
        ctx.fillStyle = axisText;
        ctx.fillText(`%B: ${(actPctB * 100).toFixed(0)}`, 306, mTop + 14);
      }

      ctx.restore();

      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = axisText;
      ctx.textAlign = 'left';
      ctx.fillText('80', plotWidth + 8, y80 + 3);
      ctx.fillText('50', plotWidth + 8, y50 + 3);
      ctx.fillText('20', plotWidth + 8, y20 + 3);
      // Suppress unused warning on mBottom if needed
      void mBottom;
    }

    // Full Crosshair spanning both Price & MACD panes
    if (hoverPos && hoverPos.x <= plotWidth && hoverPos.y <= totalPlotHeight) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, plotWidth, totalPlotHeight);
      ctx.clip();

      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const snapX =
        hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < candles.length
          ? xForIndex(hoveredIndex)
          : hoverPos.x;

      ctx.beginPath();
      ctx.moveTo(snapX, 0);
      ctx.lineTo(snapX, totalPlotHeight);
      ctx.moveTo(0, hoverPos.y);
      ctx.lineTo(plotWidth, hoverPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Outer Axis Borders
    ctx.strokeStyle = axisBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotWidth + 0.5, 0);
    ctx.lineTo(plotWidth + 0.5, size.height);
    ctx.moveTo(0, totalPlotHeight + 0.5);
    ctx.lineTo(size.width, totalPlotHeight + 0.5);
    ctx.stroke();

    // Right Price Axis Labels
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = axisText;
    ctx.textAlign = 'left';

    for (let s = 0; s <= priceSteps; s++) {
      const y = topPad + (priceAreaHeight / priceSteps) * s;
      const val = priceForY(y);
      ctx.fillText(val.toFixed(decimals), plotWidth + 8, y + 4);
    }

    // Live Price Tag on Right Axis
    if (lastCandle) {
      const yLast = yForPrice(lastCandle.close);
      if (yLast >= 12 && yLast <= mainPaneHeight - 12) {
        const lastBull = lastCandle.close >= lastCandle.open;
        ctx.fillStyle = lastBull ? '#16A34A' : '#DC2626';
        ctx.fillRect(plotWidth + 1, yLast - 10, rightAxisWidth - 2, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillText(lastCandle.close.toFixed(decimals), plotWidth + 7, yLast + 4);
      }
    }

    // Crosshair Price Callout on Right Axis
    if (hoverPos && hoverPos.y >= topPad && hoverPos.y <= priceAreaBottom) {
      const hoverPrice = priceForY(hoverPos.y);
      ctx.fillStyle = isDark ? '#334155' : '#0F172A';
      ctx.fillRect(plotWidth + 1, hoverPos.y - 10, rightAxisWidth - 2, 20);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillText(hoverPrice.toFixed(decimals), plotWidth + 7, hoverPos.y + 4);
    }

    // Bottom Time Axis Labels
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = axisText;
    ctx.textAlign = 'center';
    for (let i = startIdx; i <= endIdx; i++) {
      if (i % barGridInterval !== 0) continue;
      const x = xForIndex(i);
      if (x < 36 || x > plotWidth - 36) continue;
      ctx.fillText(formatChartTime(candles[i].time, timeframe), x, totalPlotHeight + 18);
    }

    if (hoveredIndex != null && hoveredIndex >= 0 && hoveredIndex < candles.length && hoverPos) {
      const sx = xForIndex(hoveredIndex);
      const label = formatChartTime(candles[hoveredIndex].time, timeframe, true);
      const tagW = Math.max(96, label.length * 7 + 14);
      const tagX = Math.max(2, Math.min(plotWidth - tagW - 2, sx - tagW / 2));
      ctx.fillStyle = isDark ? '#334155' : '#0F172A';
      ctx.fillRect(tagX, totalPlotHeight + 2, tagW, 22);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(label, tagX + tagW / 2, totalPlotHeight + 17);
    }
  }, [
    candles,
    patterns,
    techAnalysis,
    settings,
    size,
    visibleCount,
    rightOffset,
    hoverPos,
    hoveredIndex,
    selectedCandleIndex,
    selectedPatternId,
    isDark,
    decimals,
    timeframe,
    ema20,
    ema50,
    plotWidth,
    totalPlotHeight,
    mainPaneHeight,
    macdPaneHeight,
    morrisPaneHeight,
    startIdx,
    endIdx,
    barStep,
    candleBodyWidth,
    xForIndex,
  ]);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.12 : 0.89;
    setVisibleCount((prev) => Math.max(22, Math.min(260, Math.round(prev * delta))));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startOffset: rightOffset,
      moved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragStateRef.current.dragging) {
      const dx = e.clientX - dragStateRef.current.startX;
      if (Math.abs(dx) > 3) dragStateRef.current.moved = true;
      const barShift = Math.round(dx / barStep);
      const maxOffset = Math.max(0, candles.length - 15);
      const nextOffset = Math.max(0, Math.min(maxOffset, dragStateRef.current.startOffset + barShift));
      setRightOffset(nextOffset);
      return;
    }

    setHoverPos({ x, y });
    if (x <= plotWidth && candles.length > 0) {
      const idx = indexForX(x);
      if (idx >= 0 && idx < candles.length) {
        setHoveredIndex(idx);
      } else {
        setHoveredIndex(null);
      }
    } else {
      setHoveredIndex(null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const wasMoved = dragStateRef.current.moved;
    dragStateRef.current.dragging = false;
    if (wasMoved) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x > plotWidth || y > totalPlotHeight) return;

    if (y <= mainPaneHeight) {
      for (let i = hitBoxesRef.current.length - 1; i >= 0; i--) {
        const hb = hitBoxesRef.current[i];
        if (x >= hb.x1 - 4 && x <= hb.x2 + 4 && y >= hb.y1 - 8 && y <= hb.y2 + 14) {
          onSelectPattern(hb.pattern);
          onSelectCandle(hb.pattern.endIndex);
          return;
        }
      }
    }

    const idx = indexForX(x);
    if (idx >= 0 && idx < candles.length) {
      onSelectCandle(idx);
    }
  };

  const handleMouseLeave = () => {
    dragStateRef.current.dragging = false;
    setHoverPos(null);
    setHoveredIndex(null);
  };

  const activeLegendIndex =
    hoveredIndex ?? selectedCandleIndex ?? (candles.length > 0 ? candles.length - 1 : null);
  const activeCandle = activeLegendIndex != null ? candles[activeLegendIndex] : null;
  const prevLegendCandle =
    activeLegendIndex != null && activeLegendIndex > 0 ? candles[activeLegendIndex - 1] : null;
  const activeChangePct =
    activeCandle && prevLegendCandle && prevLegendCandle.close !== 0
      ? ((activeCandle.close - prevLegendCandle.close) / prevLegendCandle.close) * 100
      : 0;

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="block w-full h-full cursor-crosshair"
      />

      {/* Top-Left OHLCV Live Readout Bar */}
      {activeCandle && (
        <div className="pointer-events-none absolute top-2 left-3 right-24 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums bg-white/85 dark:bg-[#0B1120]/85 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-200/70 dark:border-slate-800/80">
          <span className="text-slate-500 dark:text-slate-400">
            {formatChartTime(activeCandle.time, timeframe, true)}
          </span>
          <span>
            <span className="text-slate-400 dark:text-slate-500 mr-1">A</span>
            <span className="text-slate-800 dark:text-slate-200">{activeCandle.open.toFixed(decimals)}</span>
          </span>
          <span>
            <span className="text-slate-400 dark:text-slate-500 mr-1">Y</span>
            <span className="text-slate-800 dark:text-slate-200">{activeCandle.high.toFixed(decimals)}</span>
          </span>
          <span>
            <span className="text-slate-400 dark:text-slate-500 mr-1">D</span>
            <span className="text-slate-800 dark:text-slate-200">{activeCandle.low.toFixed(decimals)}</span>
          </span>
          <span>
            <span className="text-slate-400 dark:text-slate-500 mr-1">K</span>
            <span
              className={
                activeCandle.close >= activeCandle.open
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-red-600 dark:text-red-400 font-semibold'
              }
            >
              {activeCandle.close.toFixed(decimals)}
            </span>
          </span>
          <span
            className={
              activeChangePct >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {activeChangePct >= 0 ? '+' : ''}
            {activeChangePct.toFixed(2)}%
          </span>
          <span>
            <span className="text-slate-400 dark:text-slate-500 mr-1">Hacim</span>
            <span className="text-slate-700 dark:text-slate-300">
              {formatCompactVolume(activeCandle.volume)}
            </span>
          </span>
          {settings.showEMA10 &&
            activeLegendIndex != null &&
            techAnalysis.ema10[activeLegendIndex] != null && (
              <span className="text-pink-600 dark:text-pink-400">
                EMA10 {techAnalysis.ema10[activeLegendIndex]!.toFixed(decimals)}
              </span>
            )}
          {settings.showMA8_21 &&
            activeLegendIndex != null &&
            techAnalysis.ma8[activeLegendIndex] != null && (
              <span className="text-emerald-600 dark:text-emerald-400">
                MA8 {techAnalysis.ma8[activeLegendIndex]!.toFixed(decimals)}
              </span>
            )}
          {settings.showMA8_21 &&
            activeLegendIndex != null &&
            techAnalysis.ma21[activeLegendIndex] != null && (
              <span className="text-indigo-600 dark:text-indigo-400">
                MA21 {techAnalysis.ma21[activeLegendIndex]!.toFixed(decimals)}
              </span>
            )}
          {settings.showEMA20 && activeLegendIndex != null && ema20[activeLegendIndex] != null && (
            <span className="text-sky-600 dark:text-sky-400">
              EMA20 {ema20[activeLegendIndex]!.toFixed(decimals)}
            </span>
          )}
          {settings.showEMA50 && activeLegendIndex != null && ema50[activeLegendIndex] != null && (
            <span className="text-amber-600 dark:text-amber-400">
              EMA50 {ema50[activeLegendIndex]!.toFixed(decimals)}
            </span>
          )}
          {settings.showKeltner &&
            activeLegendIndex != null &&
            techAnalysis.keltner[activeLegendIndex]?.upper != null &&
            techAnalysis.keltner[activeLegendIndex]?.lower != null && (
              <span className="text-orange-600 dark:text-orange-400">
                KC {techAnalysis.keltner[activeLegendIndex]!.lower!.toFixed(decimals)}–
                {techAnalysis.keltner[activeLegendIndex]!.upper!.toFixed(decimals)}
              </span>
            )}
          {settings.candlePower && (
            <span className="text-violet-600 dark:text-violet-400 font-semibold">
              CandlePower
            </span>
          )}
        </div>
      )}

      {/* Zoom & Reset Controls */}
      <div
        className="absolute left-3 flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-md p-1 shadow-xs"
        style={{ bottom: lowerPanesHeight + 36 }}
      >
        <button
          type="button"
          onClick={() => setVisibleCount((v) => Math.max(22, Math.round(v * 0.8)))}
          title="Yakınlaştır"
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setVisibleCount((v) => Math.min(260, Math.round(v * 1.25)))}
          title="Uzaklaştır"
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setRightOffset(0);
            setVisibleCount(85);
          }}
          title="Son Muma Odakla"
          className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Canlı Bar</span>
        </button>
      </div>
    </div>
  );
}
