import { computeEMA } from './candlestickEngine';
import type {
  BollingerPoint,
  BollingerStrategySummary,
  Candle,
  DetectedPattern,
  EmpiricalBollingerOptimization,
  FibonacciGrid,
  FibonacciLevel,
  GapSignal,
  GeometricStructure,
  KeltnerPoint,
  KeltnerStrategySummary,
  MacdPoint,
  MarketRegimeInfo,
  MorrisFilterStatus,
  SakataMorrisSummary,
  SetupConfluencePlan,
  StochasticPoint,
  SupplyDemandZone,
  SupportResistanceZone,
  SwingStructureTag,
  TechnicalStructureAnalysis,
  Timeframe,
  TopDownSummary,
  TrendChannelInfo,
} from '../types/market';

interface PivotPoint {
  index: number;
  price: number;
  kind: 'high' | 'low';
}

function getAverageRange(candles: Candle[], lookback = 30): number {
  if (candles.length === 0) return 1;
  const start = Math.max(0, candles.length - lookback);
  let sum = 0;
  let count = 0;
  for (let i = start; i < candles.length; i++) {
    sum += Math.max(candles[i].high - candles[i].low, 1e-9);
    count++;
  }
  return count > 0 ? sum / count : 1;
}

function findSwingPivots(candles: Candle[], leftBars = 3, rightBars = 3, startIdx = 0): PivotPoint[] {
  const pivots: PivotPoint[] = [];
  if (candles.length < leftBars + rightBars + 1) return pivots;

  for (let i = Math.max(leftBars, startIdx); i < candles.length - rightBars; i++) {
    const curHigh = candles[i].high;
    const curLow = candles[i].low;
    let isHigh = true;
    let isLow = true;

    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue;
      if (candles[j].high > curHigh) isHigh = false;
      if (candles[j].low < curLow) isLow = false;
    }

    if (isHigh) {
      pivots.push({ index: i, price: curHigh, kind: 'high' });
    }
    if (isLow) {
      pivots.push({ index: i, price: curLow, kind: 'low' });
    }
  }
  return pivots;
}

/**
 * 0A. Piyasa Yapısı Rejimi: HH/HL Trend, LH/LL Trend, Yatay (Ranging) & Choppy (Gürültülü) Filtresi
 * Kaynak: The Candlestick Trading Bible (Sayfa 13–21)
 */
export function detectMarketRegime(candles: Candle[]): MarketRegimeInfo {
  if (candles.length < 22) {
    return {
      regime: 'ranging',
      turkishTitle: 'Yatay Denge (Veri Toplanıyor)',
      wavePhase: 'range_middle',
      waveLabel: 'Başlangıç Dengesi',
      actionAdvice: 'Yeterli swing pivotu oluşması bekleniyor.',
      swingTags: [],
    };
  }

  const startIdx = Math.max(0, candles.length - 100);
  const pivots = findSwingPivots(candles, 3, 3, startIdx);
  const avgRange = getAverageRange(candles, 30);

  const swingTags: SwingStructureTag[] = [];
  let prevHigh: PivotPoint | null = null;
  let prevLow: PivotPoint | null = null;

  for (const p of pivots) {
    if (p.kind === 'high') {
      if (prevHigh) {
        swingTags.push({
          index: p.index,
          price: p.price,
          tag: p.price >= prevHigh.price ? 'HH' : 'LH',
          kind: 'high',
        });
      }
      prevHigh = p;
    } else {
      if (prevLow) {
        swingTags.push({
          index: p.index,
          price: p.price,
          tag: p.price >= prevLow.price ? 'HL' : 'LL',
          kind: 'low',
        });
      }
      prevLow = p;
    }
  }

  // Son 26 barda yön verimliliği (Efficiency Ratio) ve gölge karmaşası ölçümü
  const effLookback = Math.min(26, candles.length - 2);
  const effStart = candles.length - 1 - effLookback;
  const netDisplacement = candles[candles.length - 1].close - candles[effStart].close;
  let sumRanges = 0;
  let dojiWickHeavyCount = 0;
  for (let i = effStart + 1; i < candles.length; i++) {
    const r = Math.max(candles[i].high - candles[i].low, 1e-9);
    const b = Math.abs(candles[i].close - candles[i].open);
    sumRanges += r;
    if (b / r < 0.32) dojiWickHeavyCount++;
  }
  const efficiencyRatio = sumRanges > 0 ? Math.abs(netDisplacement) / sumRanges : 0;
  const wickNoiseRatio = dojiWickHeavyCount / Math.max(1, effLookback);

  const recentTags = swingTags.slice(-6);
  const hhCount = recentTags.filter((t) => t.tag === 'HH').length;
  const hlCount = recentTags.filter((t) => t.tag === 'HL').length;
  const lhCount = recentTags.filter((t) => t.tag === 'LH').length;
  const llCount = recentTags.filter((t) => t.tag === 'LL').length;

  const lastClose = candles[candles.length - 1].close;
  const prev4Close = candles[Math.max(0, candles.length - 5)].close;
  const shortDelta = lastClose - prev4Close;

  // Choppy Market Filter (Bible p.15-19): Düşük verimlilik + düzensiz çakışan gölgeler + karışık HH/LL
  const mixedSwings = hhCount > 0 && llCount > 0 && lhCount > 0 && hlCount > 0;
  if ((efficiencyRatio < 0.12 && wickNoiseRatio > 0.45) || (efficiencyRatio < 0.14 && mixedSwings)) {
    return {
      regime: 'choppy',
      turkishTitle: 'Kararsız / Gürültülü Piyasa (Choppy)',
      wavePhase: 'choppy_noise',
      waveLabel: 'Yönsüz İç İçe Mumlar',
      actionAdvice:
        'UZAK DURUN: Alıcı ve satıcı üstünlük kuramıyor; düzensiz gölgeler stopları avlar. Temiz HH/HL veya net yatay sınır oluşana kadar bekleyin.',
      swingTags: swingTags.slice(-8),
    };
  }

  // Uptrend (HH + HL)
  if ((hhCount + hlCount >= lhCount + llCount + 1 && netDisplacement > avgRange * 1.4) || netDisplacement > avgRange * 3.2) {
    const isImpulsive = shortDelta >= avgRange * 0.35;
    return {
      regime: 'uptrend',
      turkishTitle: 'Yükseliş Piyasası (HH + HL)',
      wavePhase: isImpulsive ? 'impulsive' : 'retracement',
      waveLabel: isImpulsive ? 'İtki Dalgası (Impulsive Move)' : 'Düzeltme / Pullback (HL Adayı)',
      actionAdvice: isImpulsive
        ? 'Fiyat itki dalgasında ilerliyor; tepeden kovalamak yerine bir sonraki HL / MA21 geri çekilmesini bekleyin.'
        : 'İDEAL PUSULA: Yükseliş trendi içinde geri çekilme (pullback) aşaması — destek/MA21 üzerinde Boğa Pin Bar veya Yutan Boğa arayın.',
      swingTags: swingTags.slice(-8),
    };
  }

  // Downtrend (LH + LL)
  if ((lhCount + llCount >= hhCount + hlCount + 1 && netDisplacement < -avgRange * 1.4) || netDisplacement < -avgRange * 3.2) {
    const isImpulsive = shortDelta <= -avgRange * 0.35;
    return {
      regime: 'downtrend',
      turkishTitle: 'Düşüş Piyasası (LH + LL)',
      wavePhase: isImpulsive ? 'impulsive' : 'retracement',
      waveLabel: isImpulsive ? 'Satış İtki Dalgası (Impulsive)' : 'Tepki / Pullback (LH Adayı)',
      actionAdvice: isImpulsive
        ? 'Satış itkisi devam ediyor; dipten satmak yerine dirence/MA21 hattına düzeltme tepkisini bekleyin.'
        : 'İDEAL PUSULA: Düşüş trendi içinde yukarı düzeltme (pullback) aşaması — direnç/Arz bölgesinde Ayı Pin Bar veya Yutan Ayı arayın.',
      swingTags: swingTags.slice(-8),
    };
  }

  // Ranging Market (Yatay Bant Piyasası — Bible p.15-18)
  const recentSlice = candles.slice(-35);
  const rangeHigh = Math.max(...recentSlice.map((c) => c.high));
  const rangeLow = Math.min(...recentSlice.map((c) => c.low));
  const span = Math.max(rangeHigh - rangeLow, 1e-9);
  const posInRange = (lastClose - rangeLow) / span;
  const nearEdge = posInRange <= 0.24 || posInRange >= 0.76;

  return {
    regime: 'ranging',
    turkishTitle: 'Yatay Bant Piyasası (Ranging)',
    wavePhase: nearEdge ? 'range_boundary' : 'range_middle',
    waveLabel: nearEdge ? 'Yatay Kanal Sınırında (Uç Bölge)' : 'Yatay Kanal Ortasında',
    actionAdvice: nearEdge
      ? 'Fiyat yatay piyasanın uç sınırında! Yatay destek/direnç reddi + Bollinger sahte kırılımı (Pin Bar / Fakey) için yüksek olasılıklı bölge.'
      : 'Yatay piyasanın ortasında işlem açmayın; fiyatın alt destek veya üst direnç duvarına ulaşmasını bekleyin.',
    swingTags: swingTags.slice(-8),
  };
}

/**
 * 0B. Kurumsal Arz ve Talep Bölgeleri (Supply & Demand Zones — Bible Sayfa 34–38)
 */
export function detectSupplyDemandZones(candles: Candle[]): SupplyDemandZone[] {
  if (candles.length < 20) return [];
  const avgRange = getAverageRange(candles, 35);
  const startIdx = Math.max(2, candles.length - 125);
  const zones: SupplyDemandZone[] = [];

  for (let i = startIdx; i < candles.length - 2; i++) {
    const base = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    const baseRange = base.high - base.low;
    if (baseRange <= 0 || baseRange > avgRange * 1.25) continue;

    // Patlayıcı Boğa Kalkışı -> Kurumsal Talep (Demand) Bölgesi
    const bullMove1 = next1.close - next1.open;
    const bullMove2 = next2.close - base.high;
    const isStrongBullDeparture =
      (bullMove1 >= avgRange * 1.65 && bullMove1 >= (next1.high - next1.low) * 0.65) ||
      (bullMove1 > avgRange * 0.9 && bullMove2 >= avgRange * 2.1);

    if (isStrongBullDeparture) {
      const lowBound = Math.min(base.low, next1.low);
      const highBound = Math.max(base.open, base.close);
      if (highBound > lowBound) {
        let broken = false;
        let tested = false;
        for (let k = i + 3; k < candles.length; k++) {
          if (candles[k].close < lowBound - avgRange * 0.15) {
            broken = true;
            break;
          }
          if (candles[k].low <= highBound) tested = true;
        }
        if (!broken) {
          zones.push({
            id: `demand_${i}`,
            kind: 'demand',
            turkishLabel: !tested ? 'Taze Kurumsal Talep Bölgesi' : 'Test Edilmiş Talep Bölgesi',
            lowBound,
            highBound,
            originIndex: i,
            departureStrength: Number((Math.max(bullMove1, bullMove2) / avgRange).toFixed(1)),
            fresh: !tested,
          });
        }
      }
    }

    // Patlayıcı Ayı Çöküşü -> Kurumsal Arz (Supply) Bölgesi
    const bearMove1 = next1.open - next1.close;
    const bearMove2 = base.low - next2.close;
    const isStrongBearDeparture =
      (bearMove1 >= avgRange * 1.65 && bearMove1 >= (next1.high - next1.low) * 0.65) ||
      (bearMove1 > avgRange * 0.9 && bearMove2 >= avgRange * 2.1);

    if (isStrongBearDeparture) {
      const lowBound = Math.min(base.open, base.close);
      const highBound = Math.max(base.high, next1.high);
      if (highBound > lowBound) {
        let broken = false;
        let tested = false;
        for (let k = i + 3; k < candles.length; k++) {
          if (candles[k].close > highBound + avgRange * 0.15) {
            broken = true;
            break;
          }
          if (candles[k].high >= lowBound) tested = true;
        }
        if (!broken) {
          zones.push({
            id: `supply_${i}`,
            kind: 'supply',
            turkishLabel: !tested ? 'Taze Kurumsal Arz Bölgesi' : 'Test Edilmiş Arz Bölgesi',
            lowBound,
            highBound,
            originIndex: i,
            departureStrength: Number((Math.max(bearMove1, bearMove2) / avgRange).toFixed(1)),
            fresh: !tested,
          });
        }
      }
    }
  }

  const lastClose = candles[candles.length - 1].close;
  // Yakın ve güçlü olan en fazla 4 Arz/Talep bölgesini döndür (üst üste binenleri sadeleştir)
  const deduped: SupplyDemandZone[] = [];
  for (const z of zones.reverse()) {
    const overlaps = deduped.some(
      (d) =>
        d.kind === z.kind &&
        Math.abs((d.lowBound + d.highBound) / 2 - (z.lowBound + z.highBound) / 2) < avgRange * 1.1
    );
    if (!overlaps) deduped.push(z);
  }

  return deduped
    .sort((a, b) => {
      const distA = Math.abs((a.lowBound + a.highBound) / 2 - lastClose);
      const distB = Math.abs((b.lowBound + b.highBound) / 2 - lastClose);
      return distA - distB;
    })
    .slice(0, 4);
}

/**
 * 1. Destek / Direnç Bölgeleri ve Rol Değişimi (S/R Polarity Flip) Tespiti
 */
export function detectSupportResistanceZones(candles: Candle[]): SupportResistanceZone[] {
  if (candles.length < 15) return [];
  const windowStart = Math.max(0, candles.length - 140);
  const pivots = findSwingPivots(candles, 3, 3, windowStart);
  const avgRange = getAverageRange(candles, 40);
  const zoneHalfWidth = avgRange * 0.45;
  const clusterThreshold = avgRange * 1.05;

  interface Cluster {
    prices: number[];
    kinds: Set<'high' | 'low'>;
    lastIndex: number;
  }

  const clusters: Cluster[] = [];
  for (const p of pivots) {
    let matched: Cluster | null = null;
    for (const cl of clusters) {
      const mean = cl.prices.reduce((a, b) => a + b, 0) / cl.prices.length;
      if (Math.abs(p.price - mean) <= clusterThreshold) {
        matched = cl;
        break;
      }
    }
    if (matched) {
      matched.prices.push(p.price);
      matched.kinds.add(p.kind);
      if (p.index > matched.lastIndex) matched.lastIndex = p.index;
    } else {
      clusters.push({
        prices: [p.price],
        kinds: new Set([p.kind]),
        lastIndex: p.index,
      });
    }
  }

  const lastClose = candles[candles.length - 1].close;

  const zones: SupportResistanceZone[] = clusters
    .filter((c) => c.prices.length >= 2)
    .map((c, idx) => {
      const center = c.prices.reduce((a, b) => a + b, 0) / c.prices.length;
      const role: 'support' | 'resistance' = lastClose >= center ? 'support' : 'resistance';
      const polarityFlipped = c.kinds.has('high') && c.kinds.has('low');
      return {
        id: `sr_${idx}_${Math.round(center * 1000)}`,
        centerPrice: center,
        lowBound: center - zoneHalfWidth,
        highBound: center + zoneHalfWidth,
        touches: c.prices.length,
        role,
        polarityFlipped,
        lastTouchIndex: c.lastIndex,
      };
    })
    .sort((a, b) => {
      const distA = Math.abs(a.centerPrice - lastClose);
      const distB = Math.abs(b.centerPrice - lastClose);
      return distA / Math.max(1, a.touches) - distB / Math.max(1, b.touches);
    })
    .slice(0, 4);

  return zones.sort((a, b) => b.centerPrice - a.centerPrice);
}

/**
 * 2. Trend Çizgisi (3 Nokta Doğrulamalı) & Paralel Trend Kanalı Tespiti
 */
export function detectTrendChannel(candles: Candle[]): TrendChannelInfo | null {
  if (candles.length < 25) return null;
  const lookback = Math.min(85, candles.length - 2);
  const startIdx = candles.length - lookback;
  const pivots = findSwingPivots(candles, 2, 2, startIdx);
  const lows = pivots.filter((p) => p.kind === 'low');
  const highs = pivots.filter((p) => p.kind === 'high');
  const avgRange = getAverageRange(candles, 35);
  const endIdx = candles.length - 1;

  const firstClose = candles[startIdx].close;
  const lastClose = candles[endIdx].close;
  const netMove = lastClose - firstClose;

  if (Math.abs(netMove) < avgRange * 2.0 && lows.length >= 2 && highs.length >= 2) {
    const topMean = highs.reduce((s, p) => s + p.price, 0) / highs.length;
    const botMean = lows.reduce((s, p) => s + p.price, 0) / lows.length;
    const touches = highs.length + lows.length;
    return {
      direction: 'horizontal',
      label: 'Yatay Trend Kanalı',
      startIndex: startIdx,
      endIndex: endIdx,
      primaryStartPrice: botMean,
      primaryEndPrice: botMean,
      channelStartPrice: topMean,
      channelEndPrice: topMean,
      touchCount: touches,
      isValidatedByThreePoints: touches >= 3,
      isSteepWarning: false,
    };
  }

  if (netMove >= 0 && lows.length >= 2) {
    const p1 = lows[0];
    let bestP2 = lows[lows.length - 1];
    for (let i = 1; i < lows.length; i++) {
      if (lows[i].price > p1.price && lows[i].index - p1.index >= 5) {
        bestP2 = lows[i];
      }
    }
    if (bestP2.index > p1.index && bestP2.price > p1.price) {
      const slope = (bestP2.price - p1.price) / (bestP2.index - p1.index);
      const lineAt = (idx: number) => p1.price + slope * (idx - p1.index);

      let touches = 0;
      for (const l of lows) {
        if (Math.abs(l.price - lineAt(l.index)) <= avgRange * 0.65) {
          touches++;
        }
      }

      let maxOffset = avgRange * 2;
      for (let i = p1.index; i <= endIdx; i++) {
        const diff = candles[i].high - lineAt(i);
        if (diff > maxOffset) maxOffset = diff;
      }

      const isSteep = Math.abs(slope) > avgRange * 0.42;
      return {
        direction: 'uptrend',
        label: 'Yükseliş Trendi ve Kanalı',
        startIndex: p1.index,
        endIndex: endIdx,
        primaryStartPrice: lineAt(p1.index),
        primaryEndPrice: lineAt(endIdx),
        channelStartPrice: lineAt(p1.index) + maxOffset,
        channelEndPrice: lineAt(endIdx) + maxOffset,
        touchCount: Math.max(2, touches),
        isValidatedByThreePoints: touches >= 3,
        isSteepWarning: isSteep,
      };
    }
  }

  if (highs.length >= 2) {
    const p1 = highs[0];
    let bestP2 = highs[highs.length - 1];
    for (let i = 1; i < highs.length; i++) {
      if (highs[i].price < p1.price && highs[i].index - p1.index >= 5) {
        bestP2 = highs[i];
      }
    }
    if (bestP2.index > p1.index && bestP2.price < p1.price) {
      const slope = (bestP2.price - p1.price) / (bestP2.index - p1.index);
      const lineAt = (idx: number) => p1.price + slope * (idx - p1.index);

      let touches = 0;
      for (const h of highs) {
        if (Math.abs(h.price - lineAt(h.index)) <= avgRange * 0.65) {
          touches++;
        }
      }

      let maxBelow = avgRange * 2;
      for (let i = p1.index; i <= endIdx; i++) {
        const diff = lineAt(i) - candles[i].low;
        if (diff > maxBelow) maxBelow = diff;
      }

      const isSteep = Math.abs(slope) > avgRange * 0.42;
      return {
        direction: 'downtrend',
        label: 'Düşüş Trendi ve Kanalı',
        startIndex: p1.index,
        endIndex: endIdx,
        primaryStartPrice: lineAt(p1.index),
        primaryEndPrice: lineAt(endIdx),
        channelStartPrice: lineAt(p1.index) - maxBelow,
        channelEndPrice: lineAt(endIdx) - maxBelow,
        touchCount: Math.max(2, touches),
        isValidatedByThreePoints: touches >= 3,
        isSteepWarning: isSteep,
      };
    }
  }

  return null;
}

/**
 * 3. Sıkışma (Artan / Azalan Sıkışma) ve Üçgen Formasyonları (Simetrik, Yükselen, Alçalan)
 */
export function detectGeometricStructure(candles: Candle[]): GeometricStructure | null {
  if (candles.length < 30) return null;
  const startIdx = Math.max(0, candles.length - 65);
  const pivots = findSwingPivots(candles, 2, 2, startIdx);
  const highs = pivots.filter((p) => p.kind === 'high');
  const lows = pivots.filter((p) => p.kind === 'low');

  if (highs.length < 2 || lows.length < 2) return null;

  const h1 = highs[0];
  const h2 = highs[highs.length - 1];
  const l1 = lows[0];
  const l2 = lows[lows.length - 1];

  if (h2.index - h1.index < 6 || l2.index - l1.index < 6) return null;

  const upperSlope = (h2.price - h1.price) / (h2.index - h1.index);
  const lowerSlope = (l2.price - l1.price) / (l2.index - l1.index);

  const patternStart = Math.min(h1.index, l1.index);
  const patternEnd = candles.length - 1;

  const upperAt = (idx: number) => h1.price + upperSlope * (idx - h1.index);
  const lowerAt = (idx: number) => l1.price + lowerSlope * (idx - l1.index);

  const startWidth = upperAt(patternStart) - lowerAt(patternStart);
  const endWidth = upperAt(patternEnd) - lowerAt(patternEnd);

  if (startWidth <= 0 || endWidth >= startWidth * 0.88 || endWidth < -startWidth * 0.25) {
    return null;
  }

  const avgRange = getAverageRange(candles, 35);
  const flatThreshold = avgRange * 0.035;

  let type: GeometricStructure['type'] | null = null;
  let turkishName = '';
  let bias: GeometricStructure['bias'] = 'neutral_breakout';
  let description = '';

  const upperFlat = Math.abs(upperSlope) <= flatThreshold;
  const lowerFlat = Math.abs(lowerSlope) <= flatThreshold;

  if (upperFlat && lowerSlope > flatThreshold) {
    type = 'ascending_triangle';
    turkishName = 'Yükselen Üçgen Formasyonu';
    bias = 'bullish';
    description =
      'Yatay direnç bölgesi ile yükselen dip seviyelerinin kesişmesi sonucu oluşan sıkışma yapısı.';
  } else if (lowerFlat && upperSlope < -flatThreshold) {
    type = 'descending_triangle';
    turkishName = 'Alçalan Üçgen Formasyonu';
    bias = 'bearish';
    description =
      'Yatay destek bölgesi ile alçalan tepelerin kesişmesi sonucu oluşan sıkışma yapısı.';
  } else if (upperSlope < -flatThreshold && lowerSlope > flatThreshold) {
    type = 'symmetrical_triangle';
    turkishName = 'Simetrik Üçgen Formasyonu';
    bias = 'neutral_breakout';
    description =
      'Yükselmelerin ve düşüşlerin azalarak birbirine yaklaştığı dengeli sıkışma; kırılım yönünde en geniş ağız (H) kadar hareket beklenir.';
  } else if (upperSlope > flatThreshold && lowerSlope > flatThreshold && lowerSlope > upperSlope) {
    type = 'rising_wedge';
    turkishName = 'Artan Sıkışma (Yükselen Takoz)';
    bias = 'bearish';
    description =
      'Fiyatların yukarı eğimli dar bir koridorda sıkıştığı yapı; genellikle aşağı yönlü kırılım üretir.';
  } else if (upperSlope < -flatThreshold && lowerSlope < -flatThreshold && upperSlope < lowerSlope) {
    type = 'falling_wedge';
    turkishName = 'Azalan Sıkışma (Alçalan Takoz)';
    bias = 'bullish';
    description =
      'Fiyatların destek bölgesine doğru daralarak alçaldığı sıkışma; genellikle yukarı yönlü güçlü tepki doğurur.';
  }

  if (!type) return null;

  const lastClose = candles[patternEnd].close;
  const curUpper = upperAt(patternEnd);
  const curLower = lowerAt(patternEnd);

  let breakoutState: GeometricStructure['breakoutState'] = 'forming';
  if (lastClose > curUpper) breakoutState = 'broken_up';
  else if (lastClose < curLower) breakoutState = 'broken_down';

  return {
    type,
    turkishName,
    bias,
    startIndex: patternStart,
    endIndex: patternEnd,
    upperStartPrice: upperAt(patternStart),
    upperEndPrice: curUpper,
    lowerStartPrice: lowerAt(patternStart),
    lowerEndPrice: curLower,
    mouthHeight: startWidth,
    projectedTargetUp: curUpper + startWidth,
    projectedTargetDown: Math.max(0, curLower - startWidth),
    breakoutState,
    description,
  };
}

/**
 * 4. Fiyat Boşlukları (Kopuş, Kaçış/Ölçme, Tükeniş) ve Ada Dönüş Formasyonları
 */
export function detectPriceGaps(candles: Candle[]): GapSignal[] {
  const signals: GapSignal[] = [];
  if (candles.length < 15) return signals;

  const avgRange = getAverageRange(candles, 35);
  const minGap = avgRange * 0.14;
  const startIdx = Math.max(5, candles.length - 90);

  for (let i = startIdx; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];

    if (cur.low > prev.high + minGap) {
      const gapLow = prev.high;
      const gapHigh = cur.low;
      let isIsland = false;
      for (let k = i + 1; k <= Math.min(candles.length - 1, i + 5); k++) {
        if (candles[k].high < gapHigh && candles[k].high < candles[k - 1].low - minGap * 0.6) {
          isIsland = true;
          break;
        }
      }

      const priorSlope = prev.close - candles[Math.max(0, i - 6)].close;
      let gapType: GapSignal['type'] = 'runaway';
      let turkishName = 'Kaçış (Ölçme) Boşluğu';
      let note = 'Trend devam ederken oluştu; trendin devam mesafesini ölçmede referans alınır.';

      if (isIsland) {
        gapType = 'island_reversal';
        turkishName = 'Ada Dönüş Formasyonu (Tepe)';
        note = 'İki boşluk arasında yalnız kalan barlar tepe dönüşü sinyali üretti.';
      } else if (Math.abs(priorSlope) <= avgRange * 1.6) {
        gapType = 'breakaway';
        turkishName = 'Kopuş Boşluğu (Yukarı)';
        note = 'Sıkışma bölgesinden yukarı koparak yeni hareketin başlangıcını işaret etti.';
      } else if (i < candles.length - 2 && candles[i + 1].close < cur.open) {
        gapType = 'exhaustion';
        turkishName = 'Tükeniş Boşluğu';
        note = 'Trend sonunda alıcı yorulmasıyla oluştu; geri dönüş riski taşır.';
      }

      signals.push({
        index: i,
        time: cur.time,
        type: gapType,
        turkishName,
        direction: isIsland || gapType === 'exhaustion' ? 'bearish' : 'bullish',
        gapLow,
        gapHigh,
        note,
      });
    }

    if (cur.high < prev.low - minGap) {
      const gapLow = cur.high;
      const gapHigh = prev.low;

      let isIsland = false;
      for (let k = i + 1; k <= Math.min(candles.length - 1, i + 5); k++) {
        if (candles[k].low > gapLow && candles[k].low > candles[k - 1].high + minGap * 0.6) {
          isIsland = true;
          break;
        }
      }

      const priorSlope = prev.close - candles[Math.max(0, i - 6)].close;
      let gapType: GapSignal['type'] = 'runaway';
      let turkishName = 'Kaçış (Ölçme) Boşluğu';
      let note = 'Düşüş trendi ortasında oluştu; düşüş hedefini hesaplamada kullanılır.';

      if (isIsland) {
        gapType = 'island_reversal';
        turkishName = 'Ada Dönüş Formasyonu (Dip)';
        note = 'İki boşluk arasında kalan dip ada yapısı güçlü yükseliş dönüşünü işaret eder.';
      } else if (Math.abs(priorSlope) <= avgRange * 1.6) {
        gapType = 'breakaway';
        turkishName = 'Kopuş Boşluğu (Aşağı)';
        note = 'Denge/sıkışma alanından aşağı kopuşla yeni satış dalgasını başlattı.';
      } else if (i < candles.length - 2 && candles[i + 1].close > cur.open) {
        gapType = 'exhaustion';
        turkishName = 'Tükeniş Boşluğu';
        note = 'Satış trendinin sonuna gelindiğini ve tepki başlayabileceğini gösterir.';
      }

      signals.push({
        index: i,
        time: cur.time,
        type: gapType,
        turkishName,
        direction: isIsland || gapType === 'exhaustion' ? 'bullish' : 'bearish',
        gapLow,
        gapHigh,
        note,
      });
    }
  }

  return signals.slice(-5);
}

/**
 * 5. Bollinger Bandı (20, 2), BandWidth % ve %B Hesaplaması
 */
export function computeBollingerBands(candles: Candle[], period = 20, stdDevMult = 2): BollingerPoint[] {
  const result: BollingerPoint[] = candles.map(() => ({
    middle: null,
    upper: null,
    lower: null,
    pctB: null,
    bandWidthPct: null,
  }));
  if (candles.length < period) return result;

  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    const mean = sum / period;
    let sqSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = candles[j].close - mean;
      sqSum += diff * diff;
    }
    const std = Math.sqrt(sqSum / period);
    const upper = mean + stdDevMult * std;
    const lower = mean - stdDevMult * std;
    const span = upper - lower;
    const pctB = span > 1e-9 ? (candles[i].close - lower) / span : 0.5;
    const bandWidthPct = Math.abs(mean) > 1e-9 ? (span / Math.abs(mean)) * 100 : null;
    result[i] = {
      middle: mean,
      upper,
      lower,
      pctB,
      bandWidthPct,
    };
  }
  return result;
}

/**
 * 5B. Wilder RSI (14) — Greg Morris Mum Filtreleme Ön-Sinyal Göstergesi (Bölüm 8, s.131)
 */
export function computeRSI(candles: Candle[], period = 14): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    if (delta >= 0) gainSum += delta;
    else lossSum += -delta;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const delta = candles[i].close - candles[i - 1].close;
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

/**
 * 5C. George Lane Stokastik %K(14) ve %D(3) — Greg Morris Mum Filtreleme (Bölüm 8, s.130)
 */
export function computeStochastics(
  candles: Candle[],
  kPeriod = 14,
  dPeriod = 3
): StochasticPoint[] {
  const result: StochasticPoint[] = candles.map(() => ({ pctK: null, pctD: null }));
  if (candles.length < kPeriod) return result;

  const kValues: Array<number | null> = new Array(candles.length).fill(null);
  for (let i = kPeriod - 1; i < candles.length; i++) {
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > highest) highest = candles[j].high;
      if (candles[j].low < lowest) lowest = candles[j].low;
    }
    const span = highest - lowest;
    const k = span > 1e-9 ? ((candles[i].close - lowest) / span) * 100 : 50;
    kValues[i] = k;
    result[i] = { pctK: k, pctD: null };
  }

  for (let i = kPeriod - 1 + dPeriod - 1; i < candles.length; i++) {
    let dSum = 0;
    let valid = true;
    for (let j = i - dPeriod + 1; j <= i; j++) {
      if (kValues[j] == null) {
        valid = false;
        break;
      }
      dSum += kValues[j]!;
    }
    if (valid) {
      result[i].pctD = dSum / dPeriod;
    }
  }
  return result;
}

/**
 * 5D. Sakata 5 Yöntemi (Shinne Hatte 8–10 Yeni Zirve/Dip & San-ku 3 Boşluk) + Morris EMA(10) Özeti
 */
export function computeSakataMorrisSummary(
  candles: Candle[],
  ema10: Array<number | null>,
  gaps: GapSignal[],
  rsi14: Array<number | null>,
  stochastic: StochasticPoint[],
  bollinger: BollingerPoint[]
): SakataMorrisSummary {
  if (candles.length === 0) {
    return {
      ema10Trend: 'flat',
      ema10Label: 'Veri bekleniyor',
      newPriceRecordCount: 0,
      newPriceRecordDirection: 'none',
      shinneHatteWarning: null,
      threeGapsExhaustion: false,
      preSignalState: 'neutral',
      preSignalLabel: 'Nötr Bölge',
    };
  }

  const lastIdx = candles.length - 1;
  const lastClose = candles[lastIdx].close;
  const lastEma10 = ema10[lastIdx];

  let ema10Trend: SakataMorrisSummary['ema10Trend'] = 'flat';
  let ema10Label = 'EMA(10) hesaplanıyor';
  if (lastEma10 != null) {
    if (lastClose > lastEma10 * 1.0004) {
      ema10Trend = 'uptrend';
      ema10Label = 'Kapanış > EMA(10) — Kısa Vadeli Yükseliş Trendi';
    } else if (lastClose < lastEma10 * 0.9996) {
      ema10Trend = 'downtrend';
      ema10Label = 'Kapanış < EMA(10) — Kısa Vadeli Düşüş Trendi';
    } else {
      ema10Trend = 'flat';
      ema10Label = 'EMA(10) Denge Hattında';
    }
  }

  // Shinne Hatte (Eight New Price Lines — Bölüm 5, s.108): Son swing bacağında yeni rekor tepe/dip sayacı
  const lookback = Math.min(32, candles.length - 1);
  const sliceStart = candles.length - 1 - lookback;
  let minIdx = sliceStart;
  let maxIdx = sliceStart;
  for (let i = sliceStart; i < candles.length; i++) {
    if (candles[i].low <= candles[minIdx].low) minIdx = i;
    if (candles[i].high >= candles[maxIdx].high) maxIdx = i;
  }

  let newPriceRecordCount = 0;
  let newPriceRecordDirection: SakataMorrisSummary['newPriceRecordDirection'] = 'none';
  if (minIdx < maxIdx || ema10Trend === 'uptrend') {
    const legStart = Math.min(minIdx, Math.max(0, candles.length - 18));
    let runningHigh = candles[legStart].high;
    for (let i = legStart + 1; i < candles.length; i++) {
      if (candles[i].high > runningHigh) {
        runningHigh = candles[i].high;
        newPriceRecordCount++;
      }
    }
    if (newPriceRecordCount > 0) newPriceRecordDirection = 'highs';
  } else {
    const legStart = Math.min(maxIdx, Math.max(0, candles.length - 18));
    let runningLow = candles[legStart].low;
    for (let i = legStart + 1; i < candles.length; i++) {
      if (candles[i].low < runningLow) {
        runningLow = candles[i].low;
        newPriceRecordCount++;
      }
    }
    if (newPriceRecordCount > 0) newPriceRecordDirection = 'lows';
  }

  let shinneHatteWarning: string | null = null;
  if (newPriceRecordCount >= 8) {
    shinneHatteWarning =
      newPriceRecordDirection === 'highs'
        ? `Shinne Hatte (${newPriceRecordCount} Yeni Zirve): Alım aşırı uzadı — kar realizasyonu / karga dönüşü riski yüksek!`
        : `Shinne Hatte (${newPriceRecordCount} Yeni Dip): Satış aşırı uzadı — dip tepkisi / şemsiye dönüşü yakın olabilir!`;
  }

  const recentBullGaps = gaps.filter((g) => g.index >= candles.length - 35 && g.direction === 'bullish').length;
  const recentBearGaps = gaps.filter((g) => g.index >= candles.length - 35 && g.direction === 'bearish').length;
  const threeGapsExhaustion = recentBullGaps >= 3 || recentBearGaps >= 3;

  const r = rsi14[lastIdx];
  const d = stochastic[lastIdx]?.pctD ?? null;
  const pb = bollinger[lastIdx]?.pctB ?? null;

  let preSignalState: SakataMorrisSummary['preSignalState'] = 'neutral';
  let preSignalLabel = 'Nötr Bölge (Ön-Sinyal Bekleniyor)';
  if ((d != null && d <= 20) || (r != null && r <= 35) || (pb != null && pb <= 0.05)) {
    preSignalState = 'buy_zone';
    preSignalLabel = 'ALIM ÖN-SİNYAL BÖLGESİ (%D≤20 / RSI≤35 / %B≤0)';
  } else if ((d != null && d >= 80) || (r != null && r >= 65) || (pb != null && pb >= 0.95)) {
    preSignalState = 'sell_zone';
    preSignalLabel = 'SATIM ÖN-SİNYAL BÖLGESİ (%D≥80 / RSI≥65 / %B≥1)';
  }

  return {
    ema10Trend,
    ema10Label,
    newPriceRecordCount,
    newPriceRecordDirection,
    shinneHatteWarning,
    threeGapsExhaustion,
    preSignalState,
    preSignalLabel,
  };
}

/**
 * 5E. Bollinger Bands Trading Strategy (HowToTrade, s.3–7):
 * - Squeeze (Daralma), Genişleme, Bandı Yürümek (Walking the Band) & Karşı Bant Yorulması
 * - W-Dip (Double Bottom), Klasik M-Tepe & 3 Zirve İtişi (Three Pushes to High)
 * - Strateji 1: BBMA (50 EMA × Orta Bollinger Bandı 20 SMA Kesişimi)
 * - Strateji 2: RSI (30/70) + Bant Dışı Taşma + Orta Bant Kapanış Onayı & Swing Stop
 */
export function computeBollingerStrategy(
  candles: Candle[],
  bollinger: BollingerPoint[],
  rsi14: Array<number | null>,
  ema50: Array<number | null>
): BollingerStrategySummary {
  const emptyResult: BollingerStrategySummary = {
    bandWidthPct: null,
    volatilityRegime: 'normal',
    volatilityLabel: 'Veri bekleniyor',
    walkingBandWarning: null,
    oppositeBandExhaustionWarning: null,
    bandPattern: null,
    bbmaSignal: {
      state: 'neutral',
      label: '50 EMA / Orta Bant hesaplanıyor',
      crossIndex: null,
      crossPrice: null,
      barsSinceCross: null,
    },
    rsiBbSetup: {
      state: 'none',
      label: 'Aktif RSI + Bollinger kurulumu yok',
      triggerIndex: null,
      entryPrice: null,
      stopLoss: null,
      targetPrice: null,
    },
  };

  if (candles.length < 25 || bollinger.length !== candles.length) return emptyResult;

  const lastIdx = candles.length - 1;
  const lastB = bollinger[lastIdx];
  const avgRange = getAverageRange(candles, 30);
  const bw = lastB.bandWidthPct;

  // 1. Volatilite Döngüsü: Squeeze / Genişleme / Walking the Band
  const recentBws: number[] = [];
  for (let i = Math.max(0, lastIdx - 45); i <= lastIdx; i++) {
    const val = bollinger[i]?.bandWidthPct;
    if (val != null) recentBws.push(val);
  }

  let volatilityRegime: BollingerStrategySummary['volatilityRegime'] = 'normal';
  let volatilityLabel = 'Normal Volatilite Kanalı';
  let walkingBandWarning: string | null = null;
  let oppositeBandExhaustionWarning: string | null = null;

  // Son 5 barda üst veya alt bandı yürüme kontrolü (Walking the Band — s.4)
  let upperTouches = 0;
  let lowerTouches = 0;
  for (let i = Math.max(0, lastIdx - 4); i <= lastIdx; i++) {
    const bi = bollinger[i];
    if (!bi || bi.upper == null || bi.lower == null || bi.middle == null) continue;
    if (candles[i].high >= bi.upper - avgRange * 0.12 && candles[i].close >= bi.middle) {
      upperTouches++;
    }
    if (candles[i].low <= bi.lower + avgRange * 0.12 && candles[i].close <= bi.middle) {
      lowerTouches++;
    }
  }

  if (upperTouches >= 3) {
    volatilityRegime = 'walking_upper';
    volatilityLabel = 'Üst Bandı Yürüyor (Walking the Upper Band)';
    walkingBandWarning =
      'Hata Uyarısı (s.4–5): Güçlü yükselişte üst bant teması otomatik SAT sinyali değildir; Klasik M-Tepe veya 3 Zirve İtişi olmadan trende karşı girilmemelidir.';
  } else if (lowerTouches >= 3) {
    volatilityRegime = 'walking_lower';
    volatilityLabel = 'Alt Bandı Yürüyor (Walking the Lower Band)';
    walkingBandWarning =
      'Hata Uyarısı (s.4–5): Güçlü düşüşte alt bant teması otomatik AL sinyali değildir; W-Dip (Çift Dip) veya orta bant kırılımı beklenmelidir.';
  } else if (bw != null && recentBws.length >= 15) {
    const minBw = Math.min(...recentBws);
    const maxBw = Math.max(...recentBws);
    const spanBw = Math.max(1e-6, maxBw - minBw);
    if (bw <= minBw + spanBw * 0.18) {
      volatilityRegime = 'squeeze';
      volatilityLabel = 'Bollinger Squeeze (Daralma — Sert Kırılım Hazırlığı)';
    } else if (bw >= minBw + spanBw * 0.78) {
      volatilityRegime = 'expanding';
      volatilityLabel = 'Yüksek Volatilite Genişlemesi (Expansion)';
    }
  }

  // Karşı bandın ters yönden içe bükülmesiyle trend sonu uyarısı (s.4)
  if (lastIdx >= 4) {
    const b0 = bollinger[lastIdx];
    const b2 = bollinger[lastIdx - 2];
    const b4 = bollinger[lastIdx - 4];
    if (
      b0.lower != null &&
      b2.lower != null &&
      b4.lower != null &&
      b0.upper != null &&
      b2.upper != null &&
      b4.upper != null
    ) {
      if (b2.upper > b4.upper && b2.lower < b4.lower) {
        if (candles[lastIdx].close > (b0.middle ?? 0) && b0.lower > b2.lower) {
          oppositeBandExhaustionWarning =
            'Karşı Bant Uyarısı (s.4): Yükseliş genişlemesi sonrası alt bandın yukarı bükülmesi mevcut trend ivmesinin yavaşladığını işaret ediyor.';
        } else if (candles[lastIdx].close < (b0.middle ?? 0) && b0.upper < b2.upper) {
          oppositeBandExhaustionWarning =
            'Karşı Bant Uyarısı (s.4): Düşüş genişlemesi sonrası üst bandın aşağı bükülmesi satış dalgasının yorulduğunu işaret ediyor.';
        }
      }
    }
  }

  // 2. Bant Üzeri Formasyonlar: W-Dip, Klasik M-Tepe, Zirveye 3 İtiş (s.4)
  let bandPattern: BollingerStrategySummary['bandPattern'] = null;
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  const scanStart = Math.max(2, lastIdx - 36);
  for (let i = scanStart; i <= lastIdx - 1; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    const next = candles[i + 1];
    if (cur.high >= prev.high && cur.high >= next.high) swingHighs.push(i);
    if (cur.low <= prev.low && cur.low <= next.low) swingLows.push(i);
  }

  // Three Pushes to High (Üçlü Zirve İtişi) kontrolü
  if (swingHighs.length >= 3) {
    const h3 = swingHighs[swingHighs.length - 1];
    const h2 = swingHighs[swingHighs.length - 2];
    const h1 = swingHighs[swingHighs.length - 3];
    const b3 = bollinger[h3];
    const b2 = bollinger[h2];
    if (
      h3 >= lastIdx - 10 &&
      h3 - h2 >= 2 &&
      h2 - h1 >= 2 &&
      candles[h1].high < candles[h2].high &&
      candles[h2].high < candles[h3].high &&
      b2?.upper != null &&
      b3?.upper != null &&
      (candles[h2].high >= b2.upper * 0.998 || candles[h3].high >= b3.upper * 0.998) &&
      candles[h3].close <= b3.upper
    ) {
      bandPattern = {
        kind: 'three_pushes_high',
        label: 'Zirveye 3 İtiş (Three Pushes to High — Üst Bant Yorulması)',
        barIndex: h3,
      };
    }
  }

  // Classic M-Top (Klasik M-Tepe) kontrolü
  if (!bandPattern && swingHighs.length >= 2) {
    const h2 = swingHighs[swingHighs.length - 1];
    const h1 = swingHighs[swingHighs.length - 2];
    const b1 = bollinger[h1];
    const b2 = bollinger[h2];
    if (
      h2 >= lastIdx - 10 &&
      h2 - h1 >= 3 &&
      b1?.upper != null &&
      b2?.upper != null &&
      candles[h1].high >= b1.upper * 0.998 &&
      Math.abs(candles[h2].high - candles[h1].high) <= avgRange * 1.2 &&
      candles[h2].close < b2.upper
    ) {
      bandPattern = {
        kind: 'm_top',
        label: 'Klasik M-Tepe (Üst Bant İkinci Tepe Reddi)',
        barIndex: h2,
      };
    }
  }

  // W-Bottom / Double Bottom (Çift Dip) kontrolü
  if (!bandPattern && swingLows.length >= 2) {
    const l2 = swingLows[swingLows.length - 1];
    const l1 = swingLows[swingLows.length - 2];
    const b1 = bollinger[l1];
    const b2 = bollinger[l2];
    if (
      l2 >= lastIdx - 10 &&
      l2 - l1 >= 3 &&
      b1?.lower != null &&
      b2?.lower != null &&
      candles[l1].low <= b1.lower * 1.002 &&
      Math.abs(candles[l2].low - candles[l1].low) <= avgRange * 1.2 &&
      candles[l2].close > b2.lower
    ) {
      bandPattern = {
        kind: 'w_bottom',
        label: 'W-Dip / Çift Dip (Alt Bant İkinci Dip Onayı)',
        barIndex: l2,
      };
    }
  }

  // 3. Strateji #1: BBMA (Bollinger Orta Bandı 20 SMA × 50 EMA Kesişimi — s.5–6)
  let bbmaSignal: BollingerStrategySummary['bbmaSignal'] = {
    state: 'neutral',
    label: '50 EMA verisi için ek bar bekleniyor',
    crossIndex: null,
    crossPrice: null,
    barsSinceCross: null,
  };

  const curMid = lastB.middle;
  const curE50 = ema50[lastIdx];
  if (curMid != null && curE50 != null) {
    let crossIdx: number | null = null;
    let crossDir: 'bull' | 'bear' | null = null;
    for (let k = lastIdx; k >= Math.max(1, lastIdx - 20); k--) {
      const mNow = bollinger[k]?.middle;
      const eNow = ema50[k];
      const mPrev = bollinger[k - 1]?.middle;
      const ePrev = ema50[k - 1];
      if (mNow != null && eNow != null && mPrev != null && ePrev != null) {
        if (mPrev <= ePrev && mNow > eNow) {
          crossIdx = k;
          crossDir = 'bull';
          break;
        }
        if (mPrev >= ePrev && mNow < eNow) {
          crossIdx = k;
          crossDir = 'bear';
          break;
        }
      }
    }

    const barsSince = crossIdx != null ? lastIdx - crossIdx : null;
    const crossPrice = crossIdx != null ? (bollinger[crossIdx].middle ?? candles[crossIdx].close) : null;

    if (crossDir === 'bull' && barsSince != null && barsSince <= 4) {
      bbmaSignal = {
        state: 'bullish_cross',
        label:
          barsSince === 0
            ? 'BBMA AL Kesişimi (Orta Bant > 50 EMA — Yeni Giriş)'
            : `BBMA AL Kesişimi (${barsSince} bar önce tetiklendi)`,
        crossIndex: crossIdx,
        crossPrice,
        barsSinceCross: barsSince,
      };
    } else if (crossDir === 'bear' && barsSince != null && barsSince <= 4) {
      bbmaSignal = {
        state: 'bearish_cross',
        label:
          barsSince === 0
            ? 'BBMA SAT Kesişimi (50 EMA > Orta Bant — Yeni Giriş)'
            : `BBMA SAT Kesişimi (${barsSince} bar önce tetiklendi)`,
        crossIndex: crossIdx,
        crossPrice,
        barsSinceCross: barsSince,
      };
    } else if (curMid >= curE50) {
      bbmaSignal = {
        state: 'bullish_trend',
        label: 'BBMA Boğa Trendi (Orta Bant > 50 EMA · Ters Kesişime Kadar Sür)',
        crossIndex: crossIdx,
        crossPrice,
        barsSinceCross: barsSince,
      };
    } else {
      bbmaSignal = {
        state: 'bearish_trend',
        label: 'BBMA Ayı Trendi (50 EMA > Orta Bant · Ters Kesişime Kadar Sür)',
        crossIndex: crossIdx,
        crossPrice,
        barsSinceCross: barsSince,
      };
    }
  }

  // 4. Strateji #2: Öncü RSI (30/70) + Bant Dışı Taşma + Orta Bant Kapanış Onayı (s.6–7)
  let rsiBbSetup: BollingerStrategySummary['rsiBbSetup'] = {
    state: 'none',
    label: 'Bant dışı + RSI(30/70) kurulumu bekleniyor',
    triggerIndex: null,
    entryPrice: null,
    stopLoss: null,
    targetPrice: null,
  };

  const setupWindowStart = Math.max(1, lastIdx - 14);
  let recentOversoldOutIdx: number | null = null;
  let recentOverboughtOutIdx: number | null = null;

  for (let i = setupWindowStart; i <= lastIdx; i++) {
    const bi = bollinger[i];
    const ri = rsi14[i];
    const riPrev = i > 0 ? rsi14[i - 1] : null;
    if (!bi || bi.lower == null || bi.upper == null) continue;

    const minNearRsi = Math.min(ri ?? 50, riPrev ?? 50);
    const maxNearRsi = Math.max(ri ?? 50, riPrev ?? 50);

    // Alt bant dışı + aşırı satım RSI (<= 32 toleranslı 30 eşiği)
    if (candles[i].low < bi.lower && minNearRsi <= 32) {
      recentOversoldOutIdx = i;
    }
    // Üst bant dışı + aşırı alım RSI (>= 68 toleranslı 70 eşiği)
    if (candles[i].high > bi.upper && maxNearRsi >= 68) {
      recentOverboughtOutIdx = i;
    }
  }

  if (recentOversoldOutIdx != null && lastB.middle != null && lastB.upper != null) {
    let swingLow = Infinity;
    for (let k = recentOversoldOutIdx; k <= lastIdx; k++) {
      if (candles[k].low < swingLow) swingLow = candles[k].low;
    }
    let crossAboveMidIdx: number | null = null;
    for (let k = Math.max(recentOversoldOutIdx + 1, lastIdx - 4); k <= lastIdx; k++) {
      const mNow = bollinger[k]?.middle;
      const mPrev = bollinger[k - 1]?.middle;
      if (mNow != null && mPrev != null && candles[k - 1].close <= mPrev && candles[k].close > mNow) {
        crossAboveMidIdx = k;
      }
    }

    if (crossAboveMidIdx != null && candles[lastIdx].close > lastB.middle) {
      rsiBbSetup = {
        state: 'buy_triggered',
        label: 'AL Onaylı: RSI Aşırı Satım + Alt Bant Dışı Sonrası Orta Bant Üzeri Kapanış',
        triggerIndex: crossAboveMidIdx,
        entryPrice: candles[crossAboveMidIdx].close,
        stopLoss: swingLow - avgRange * 0.2,
        targetPrice: lastB.upper,
      };
    } else if (lastIdx - recentOversoldOutIdx <= 6 && candles[lastIdx].close <= lastB.middle) {
      rsiBbSetup = {
        state: 'buy_armed',
        label: 'AL Hazırlığı: Alt Bant Dışı + RSI≤30 Göründü — Orta Bant Üzeri Kapanış Bekleniyor',
        triggerIndex: null,
        entryPrice: lastB.middle,
        stopLoss: swingLow - avgRange * 0.2,
        targetPrice: lastB.upper,
      };
    }
  }

  if (
    rsiBbSetup.state === 'none' &&
    recentOverboughtOutIdx != null &&
    lastB.middle != null &&
    lastB.lower != null
  ) {
    let swingHigh = -Infinity;
    for (let k = recentOverboughtOutIdx; k <= lastIdx; k++) {
      if (candles[k].high > swingHigh) swingHigh = candles[k].high;
    }
    let crossBelowMidIdx: number | null = null;
    for (let k = Math.max(recentOverboughtOutIdx + 1, lastIdx - 4); k <= lastIdx; k++) {
      const mNow = bollinger[k]?.middle;
      const mPrev = bollinger[k - 1]?.middle;
      if (mNow != null && mPrev != null && candles[k - 1].close >= mPrev && candles[k].close < mNow) {
        crossBelowMidIdx = k;
      }
    }

    if (crossBelowMidIdx != null && candles[lastIdx].close < lastB.middle) {
      rsiBbSetup = {
        state: 'sell_triggered',
        label: 'SAT Onaylı: RSI Aşırı Alım + Üst Bant Dışı Sonrası Orta Bant Altı Kapanış',
        triggerIndex: crossBelowMidIdx,
        entryPrice: candles[crossBelowMidIdx].close,
        stopLoss: swingHigh + avgRange * 0.2,
        targetPrice: lastB.lower,
      };
    } else if (lastIdx - recentOverboughtOutIdx <= 6 && candles[lastIdx].close >= lastB.middle) {
      rsiBbSetup = {
        state: 'sell_armed',
        label: 'SAT Hazırlığı: Üst Bant Dışı + RSI≥70 Göründü — Orta Bant Altı Kapanış Bekleniyor',
        triggerIndex: null,
        entryPrice: lastB.middle,
        stopLoss: swingHigh + avgRange * 0.2,
        targetPrice: lastB.lower,
      };
    }
  }

  return {
    bandWidthPct: bw,
    volatilityRegime,
    volatilityLabel,
    walkingBandWarning,
    oppositeBandExhaustionWarning,
    bandPattern,
    bbmaSignal,
    rsiBbSetup,
  };
}

/**
 * Bollinger Kural #11 (Williams SFU s.27 / Tez s.17):
 * Periyot uzadıkça standart sapma çarpanı D eşzamanlı artırılır (10->1.9, 20->2.0, 50->2.1)
 */
export function getBollingerScaledStdDev(period: number): number {
  if (period <= 10) return 1.9;
  if (period <= 20) {
    return Number((1.9 + 0.1 * ((period - 10) / 10)).toFixed(2));
  }
  if (period <= 50) {
    return Number((2.0 + 0.1 * ((period - 20) / 30)).toFixed(2));
  }
  return Number(Math.min(2.2, 2.1 + 0.1 * ((period - 50) / 150)).toFixed(2));
}

function classifyCycleTerm(n: number): string {
  // Williams Tablo 1 (s.26 / Tez s.16 — Achelis):
  if (n <= 13) return 'Çok Kısa Vade (5–13 Bar)';
  if (n <= 25) return 'Kısa Vade (14–25 Bar)';
  if (n <= 49) return 'Minör Orta Vade (26–49 Bar)';
  if (n <= 100) return 'Orta Vade (50–100 Bar)';
  return 'Uzun Vade (100–200 Bar)';
}

function backtestWilliamsReEntryWindow(
  candles: Candle[],
  period: number,
  stdMult: number
): { returnPct: number; trades: number; bands: BollingerPoint[] } {
  const bands = computeBollingerBands(candles, period, stdMult);
  if (candles.length < period + 3) {
    return { returnPct: 0, trades: 0, bands };
  }

  let position: 'flat' | 'long' | 'short' = 'flat';
  let entryPrice = 0;
  let cashGainRatio = 0;
  let trades = 0;

  for (let t = period; t < candles.length; t++) {
    const bPrev = bands[t - 1];
    const bCur = bands[t];
    if (
      bPrev.lower == null ||
      bPrev.upper == null ||
      bCur.lower == null ||
      bCur.upper == null
    ) {
      continue;
    }

    const pPrev = candles[t - 1].close;
    const pCur = candles[t].close;

    // Denklem 5 (Buy Rule): P(t-1) < BB_low(t-1) ve P(t) > BB_low(t)
    const isBuyReEntry = pPrev < bPrev.lower && pCur > bCur.lower;
    // Denklem 6 (Sell Rule): P(t-1) > BB_up(t-1) ve P(t) < BB_up(t)
    const isSellReEntry = pPrev > bPrev.upper && pCur < bCur.upper;

    if (isBuyReEntry && position !== 'long') {
      if (position === 'short' && entryPrice > 0) {
        const legGain = (entryPrice - pCur) / entryPrice;
        // Rasyonel işlem disiplini veya karşıt kapama
        cashGainRatio += legGain;
        trades++;
      }
      position = 'long';
      entryPrice = pCur;
    } else if (isSellReEntry && position !== 'short') {
      if (position === 'long' && entryPrice > 0) {
        const legGain = (pCur - entryPrice) / entryPrice;
        cashGainRatio += legGain;
        trades++;
      }
      position = 'short';
      entryPrice = pCur;
    }
  }

  // Açık pozisyonun dönem sonu rasyonel değerlemesi (Denklem 7)
  if (position !== 'flat' && entryPrice > 0) {
    const lastPrice = candles[candles.length - 1].close;
    const openLeg =
      position === 'long'
        ? (lastPrice - entryPrice) / entryPrice
        : (entryPrice - lastPrice) / entryPrice;
    if (openLeg > 0 || trades === 0) {
      cashGainRatio += openLeg;
      trades++;
    }
  }

  return {
    returnPct: Number((cashGainRatio * 100).toFixed(2)),
    trades,
    bands,
  };
}

/**
 * 5F. Oliver D. Williams (SFU, 2006) — Empirical Optimization of Bollinger Bands:
 * - 3. ve 4. Moment (Skewness & Kurtosis > 3 Kalın Kuyruk / Outlier Analizi — Tablo 3)
 * - Denklem 1 İdeal Döngü Ortalaması (Cycle Length / 2 + 1)
 * - Denklem 5, 6 & 7 ile Varlığa Özgü Optimal Pencere (N*, D*) Tarama Matrisi
 * - Bölüm 3.1 Bant Dışı -> Bant İçi Göreceli Uyumsuzluk (Nominal Yeni Zirve / Dip)
 */
export function computeEmpiricalBollingerOptimization(
  candles: Candle[],
  defaultBollinger: BollingerPoint[],
  rsi14: Array<number | null>
): { optimization: EmpiricalBollingerOptimization; adaptiveBollinger: BollingerPoint[] } {
  if (candles.length < 25) {
    return {
      adaptiveBollinger: defaultBollinger,
      optimization: {
        skewness: 0,
        kurtosis: 3,
        tailProfileLabel: 'Veri bekleniyor',
        outside2SigmaPct: 0,
        dominantCycleBars: 38,
        cycleSuggestedMa: 20,
        optimalWindowN: 20,
        scaledStdDevD: 2.0,
        cycleTermLabel: 'Kısa Vade (14–25 Bar)',
        optimalWinReturnPct: 0,
        default20ReturnPct: 0,
        windowSpectrum: [],
        eq5Eq6Signal: { state: 'none', label: 'Veri bekleniyor', barIndex: null, price: null },
        bandDivergence: null,
      },
    };
  }

  // 1. Getiri Dağılımı 3. Moment (Skewness) ve 4. Moment (Kurtosis — Normal = 3.0)
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) {
      returns.push((candles[i].close - prev) / prev);
    }
  }

  let skewness = 0;
  let kurtosis = 3.0;
  if (returns.length >= 10) {
    const mean = returns.reduce((acc, v) => acc + v, 0) / returns.length;
    let m2 = 0;
    let m3 = 0;
    let m4 = 0;
    for (const r of returns) {
      const d = r - mean;
      const d2 = d * d;
      m2 += d2;
      m3 += d2 * d;
      m4 += d2 * d2;
    }
    const variance = m2 / returns.length;
    const std = Math.sqrt(Math.max(variance, 1e-12));
    skewness = Number((m3 / returns.length / Math.pow(std, 3)).toFixed(2));
    kurtosis = Number((m4 / returns.length / Math.pow(std, 4)).toFixed(2));
  }

  let tailProfileLabel = 'Normale Yakın Dağılım (Kurtosis ≈ 3)';
  if (kurtosis >= 6.5) {
    tailProfileLabel = 'Aşırı Kalın Kuyruk (Yüksek Uç Sıçrama / Outlier Riski)';
  } else if (kurtosis > 3.5) {
    tailProfileLabel = 'Kalın Kuyruk / Leptokurtik (Kurtosis > 3 · Sık ±2σ Taşması)';
  } else if (kurtosis < 2.6) {
    tailProfileLabel = 'Basık Dağılım (Platikurtik · Düşük Uç Sapma)';
  }

  // Gerçekleşen ±2σ Dışı Kapanış Oranı (Normal dağılımda teorik %5)
  let validBandBars = 0;
  let outsideBandBars = 0;
  for (let i = 0; i < candles.length; i++) {
    const b = defaultBollinger[i];
    if (b && b.upper != null && b.lower != null) {
      validBandBars++;
      if (candles[i].close > b.upper || candles[i].close < b.lower) {
        outsideBandBars++;
      }
    }
  }
  const outside2SigmaPct =
    validBandBars > 0 ? Number(((outsideBandBars / validBandBars) * 100).toFixed(1)) : 0;

  // 2. Baskın Fiyat Döngüsü (Cycle Length) ve Denklem 1: Ideal MA = Cycle/2 + 1 (s.17)
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];
  for (let i = 3; i < candles.length - 3; i++) {
    const c = candles[i];
    if (
      c.high >= candles[i - 1].high &&
      c.high >= candles[i - 2].high &&
      c.high >= candles[i - 3].high &&
      c.high >= candles[i + 1].high &&
      c.high >= candles[i + 2].high &&
      c.high >= candles[i + 3].high
    ) {
      if (pivotHighs.length === 0 || i - pivotHighs[pivotHighs.length - 1] >= 5) {
        pivotHighs.push(i);
      }
    }
    if (
      c.low <= candles[i - 1].low &&
      c.low <= candles[i - 2].low &&
      c.low <= candles[i - 3].low &&
      c.low <= candles[i + 1].low &&
      c.low <= candles[i + 2].low &&
      c.low <= candles[i + 3].low
    ) {
      if (pivotLows.length === 0 || i - pivotLows[pivotLows.length - 1] >= 5) {
        pivotLows.push(i);
      }
    }
  }

  const cycleSpans: number[] = [];
  for (let i = 1; i < pivotHighs.length; i++) cycleSpans.push(pivotHighs[i] - pivotHighs[i - 1]);
  for (let i = 1; i < pivotLows.length; i++) cycleSpans.push(pivotLows[i] - pivotLows[i - 1]);

  const rawCycle =
    cycleSpans.length > 0
      ? Math.round(cycleSpans.reduce((a, b) => a + b, 0) / cycleSpans.length)
      : 38;
  const dominantCycleBars = Math.max(18, Math.min(140, rawCycle * 2));
  const cycleSuggestedMa = Math.max(10, Math.min(100, Math.round(dominantCycleBars / 2 + 1)));

  // 3. Varlığa Özgü Pencere Spektrumu Taraması (N = 10..100, Kural #11 D Ölçeklemeli)
  const candidateSet = new Set<number>([10, 14, 20, 28, 36, 50, 75, 100, cycleSuggestedMa]);
  const validCandidates = Array.from(candidateSet)
    .filter((n) => n >= 10 && n <= Math.max(20, candles.length - 15))
    .sort((a, b) => a - b);

  const windowSpectrum: EmpiricalBollingerOptimization['windowSpectrum'] = [];
  let bestN = 20;
  let bestD = 2.0;
  let bestRet = -Infinity;
  let bestBands = defaultBollinger;
  let default20ReturnPct = 0;

  for (const n of validCandidates) {
    const d = getBollingerScaledStdDev(n);
    const sim = backtestWilliamsReEntryWindow(candles, n, d);
    windowSpectrum.push({
      n,
      d,
      returnPct: sim.returnPct,
      trades: sim.trades,
    });
    if (n === 20) {
      default20ReturnPct = sim.returnPct;
    }
    if (sim.trades > 0 && sim.returnPct > bestRet) {
      bestRet = sim.returnPct;
      bestN = n;
      bestD = d;
      bestBands = sim.bands;
    }
  }

  if (bestRet === -Infinity) {
    bestN = cycleSuggestedMa;
    bestD = getBollingerScaledStdDev(bestN);
    const fallbackSim = backtestWilliamsReEntryWindow(candles, bestN, bestD);
    bestRet = fallbackSim.returnPct;
    bestBands = fallbackSim.bands;
  }

  // 4. Canlı Denklem 5 & Denklem 6 (Bant Dışından İçe Dönüş — Re-Entry) Sinyali
  const lastIdx = candles.length - 1;
  let eq5Eq6Signal: EmpiricalBollingerOptimization['eq5Eq6Signal'] = {
    state: 'none',
    label: 'Son barlarda aktif Denklem 5/6 bant içi geri dönüşü yok',
    barIndex: null,
    price: null,
  };

  for (let t = lastIdx; t >= Math.max(1, lastIdx - 3); t--) {
    const bPrev = bestBands[t - 1];
    const bCur = bestBands[t];
    if (!bPrev || !bCur || bPrev.lower == null || bPrev.upper == null || bCur.lower == null || bCur.upper == null) {
      continue;
    }
    const pPrev = candles[t - 1].close;
    const pCur = candles[t].close;
    const ago = lastIdx - t;

    if (pPrev < bPrev.lower && pCur > bCur.lower) {
      eq5Eq6Signal = {
        state: 'buy_reentry',
        label:
          ago === 0
            ? `Denklem 5 AL (Alt Banttan İçe Dönüş · N*=${bestN})`
            : `Denklem 5 AL (${ago} bar önce içe döndü · N*=${bestN})`,
        barIndex: t,
        price: pCur,
      };
      break;
    }
    if (pPrev > bPrev.upper && pCur < bCur.upper) {
      eq5Eq6Signal = {
        state: 'sell_reentry',
        label:
          ago === 0
            ? `Denklem 6 SAT (Üst Banttan İçe Dönüş · N*=${bestN})`
            : `Denklem 6 SAT (${ago} bar önce içe döndü · N*=${bestN})`,
        barIndex: t,
        price: pCur,
      };
      break;
    }
  }

  // 5. Bölüm 3.1 (s.24): Bant Dışı İlk Tepe/Dip -> Bant İçi İkinci Tepe/Dip (%B & RSI Uyumsuzluğu)
  let bandDivergence: EmpiricalBollingerOptimization['bandDivergence'] = null;
  if (pivotHighs.length >= 2) {
    const h2 = pivotHighs[pivotHighs.length - 1];
    const h1 = pivotHighs[pivotHighs.length - 2];
    const pb1 = bestBands[h1]?.pctB;
    const pb2 = bestBands[h2]?.pctB;
    const r1 = rsi14[h1];
    const r2 = rsi14[h2];
    if (
      h2 >= lastIdx - 12 &&
      pb1 != null &&
      pb2 != null &&
      pb1 > 1.0 &&
      pb2 < 1.0 &&
      (candles[h2].high >= candles[h1].high * 0.996 || (r1 != null && r2 != null && r2 < r1 - 2))
    ) {
      bandDivergence = {
        kind: 'bearish_divergence',
        label:
          candles[h2].high > candles[h1].high
            ? 'Göreceli SAT Uyumsuzluğu: Nominal Yeni Zirve Bant İçinde Kaldı (%B<1)'
            : 'Bant Dışı Tepe Sonrası Bant İçi Zayıf İkinci Tepe (%B Uyumsuzluğu)',
        barIndex: h2,
      };
    }
  }

  if (!bandDivergence && pivotLows.length >= 2) {
    const l2 = pivotLows[pivotLows.length - 1];
    const l1 = pivotLows[pivotLows.length - 2];
    const pb1 = bestBands[l1]?.pctB;
    const pb2 = bestBands[l2]?.pctB;
    const r1 = rsi14[l1];
    const r2 = rsi14[l2];
    if (
      l2 >= lastIdx - 12 &&
      pb1 != null &&
      pb2 != null &&
      pb1 < 0.0 &&
      pb2 > 0.0 &&
      (candles[l2].low <= candles[l1].low * 1.004 || (r1 != null && r2 != null && r2 > r1 + 2))
    ) {
      bandDivergence = {
        kind: 'bullish_divergence',
        label:
          candles[l2].low < candles[l1].low
            ? 'Göreceli AL Uyumsuzluğu: Nominal Yeni Dip Bant İçinde Kaldı (%B>0)'
            : 'Bant Dışı Dip Sonrası Bant İçi Güçlü İkinci Dip (%B Uyumsuzluğu)',
        barIndex: l2,
      };
    }
  }

  return {
    adaptiveBollinger: bestBands,
    optimization: {
      skewness,
      kurtosis,
      tailProfileLabel,
      outside2SigmaPct,
      dominantCycleBars,
      cycleSuggestedMa,
      optimalWindowN: bestN,
      scaledStdDevD: bestD,
      cycleTermLabel: classifyCycleTerm(bestN),
      optimalWinReturnPct: bestRet,
      default20ReturnPct,
      windowSpectrum,
      eq5Eq6Signal,
      bandDivergence,
    },
  };
}

/**
 * 5G. Wilder ATR (14) & Keltner Kanalı (20 EMA ± 2 × ATR)
 * Kaynak: Casey Stubbs — Keltner Trading Strategy (Trading Strategy Guides)
 */
export function computeATR(candles: Candle[], period = 14): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  const tr: number[] = new Array(candles.length).fill(0);
  tr[0] = Math.max(candles[0].high - candles[0].low, 1e-9);
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr[i] = Math.max(hl, hc, lc, 1e-9);
  }

  let atrSum = 0;
  for (let i = 0; i < period; i++) {
    atrSum += tr[i];
  }
  let atr = atrSum / period;
  result[period - 1] = atr;

  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i] = atr;
  }
  return result;
}

export function computeKeltnerChannels(
  candles: Candle[],
  emaPeriod = 20,
  atrMult = 2,
  atrPeriod = 14
): KeltnerPoint[] {
  const result: KeltnerPoint[] = candles.map(() => ({
    middle: null,
    upper: null,
    lower: null,
    atr: null,
  }));
  if (candles.length < Math.max(emaPeriod, atrPeriod)) return result;

  const ema = computeEMA(candles, emaPeriod);
  const atr = computeATR(candles, atrPeriod);

  for (let i = 0; i < candles.length; i++) {
    const m = ema[i];
    const a = atr[i];
    if (m != null && a != null) {
      result[i] = {
        middle: m,
        upper: m + atrMult * a,
        lower: m - atrMult * a,
        atr: a,
      };
    }
  }
  return result;
}

/**
 * 5H. Wilder ADX (14) — Keltner Kırılım Gücü Filtresi (>20 Kırılım Onayı, <20 Yatay Konsolidasyon)
 */
export function computeADX(candles: Candle[], period = 14): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period * 2) return result;

  const tr: number[] = new Array(candles.length).fill(0);
  const plusDM: number[] = new Array(candles.length).fill(0);
  const minusDM: number[] = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr[i] = Math.max(hl, hc, lc);

    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }

  let smTR = 0;
  let smPlusDM = 0;
  let smMinusDM = 0;
  for (let i = 1; i <= period; i++) {
    smTR += tr[i];
    smPlusDM += plusDM[i];
    smMinusDM += minusDM[i];
  }

  const dxValues: Array<number | null> = new Array(candles.length).fill(null);
  const calcDX = (t: number, p: number, m: number) => {
    if (t <= 1e-9) return 0;
    const pDI = (p / t) * 100;
    const mDI = (m / t) * 100;
    const denom = pDI + mDI;
    return denom > 1e-9 ? (Math.abs(pDI - mDI) / denom) * 100 : 0;
  };

  dxValues[period] = calcDX(smTR, smPlusDM, smMinusDM);

  for (let i = period + 1; i < candles.length; i++) {
    smTR = smTR - smTR / period + tr[i];
    smPlusDM = smPlusDM - smPlusDM / period + plusDM[i];
    smMinusDM = smMinusDM - smMinusDM / period + minusDM[i];
    dxValues[i] = calcDX(smTR, smPlusDM, smMinusDM);
  }

  let dxSum = 0;
  const firstAdxIdx = period * 2 - 1;
  for (let i = period; i <= firstAdxIdx; i++) {
    dxSum += dxValues[i] ?? 0;
  }
  let adx = dxSum / period;
  result[firstAdxIdx] = adx;

  for (let i = firstAdxIdx + 1; i < candles.length; i++) {
    adx = (adx * (period - 1) + (dxValues[i] ?? 0)) / period;
    result[i] = adx;
  }
  return result;
}

/**
 * 5I. Stochastic RSI (14, 14, 3, 3) — Keltner Güçlü Trend 20 EMA Pullback Tetikleyicisi
 */
export function computeStochRSI(
  rsiSeries: Array<number | null>,
  stochPeriod = 14,
  smoothK = 3,
  smoothD = 3
): StochasticPoint[] {
  const n = rsiSeries.length;
  const result: StochasticPoint[] = new Array(n).fill(null).map(() => ({ pctK: null, pctD: null }));
  const rawStoch: Array<number | null> = new Array(n).fill(null);

  for (let i = stochPeriod - 1; i < n; i++) {
    let minR = Infinity;
    let maxR = -Infinity;
    let valid = true;
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      const v = rsiSeries[j];
      if (v == null) {
        valid = false;
        break;
      }
      if (v < minR) minR = v;
      if (v > maxR) maxR = v;
    }
    if (!valid) continue;
    const span = maxR - minR;
    rawStoch[i] = span > 1e-9 ? ((rsiSeries[i]! - minR) / span) * 100 : 50;
  }

  const kArr: Array<number | null> = new Array(n).fill(null);
  for (let i = smoothK - 1; i < n; i++) {
    let sum = 0;
    let valid = true;
    for (let j = i - smoothK + 1; j <= i; j++) {
      if (rawStoch[j] == null) {
        valid = false;
        break;
      }
      sum += rawStoch[j]!;
    }
    if (valid) {
      kArr[i] = sum / smoothK;
      result[i].pctK = kArr[i];
    }
  }

  for (let i = smoothD - 1; i < n; i++) {
    let sum = 0;
    let valid = true;
    for (let j = i - smoothD + 1; j <= i; j++) {
      if (kArr[j] == null) {
        valid = false;
        break;
      }
      sum += kArr[j]!;
    }
    if (valid) {
      result[i].pctD = sum / smoothD;
    }
  }

  return result;
}

/**
 * 5J. Keltner Trading Strategy — Kanıtlanmış 3 Yöntem (Casey Stubbs / TradingStrategyGuides):
 * - Yöntem 1: Yatay Keltner Kırılımı + ADX(14) > 20 Yükselen Trend Gücü Onayı
 * - Yöntem 2: Yatay Keltner + Orta Bant (20 EMA) Kırılımı + 2-Periyot RSI (10 / 90) & Dış Bant Stopu
 * - Yöntem 3: Güçlü Trend (Band Crawl) Sonrası 20 EMA Orta Bant Pullback + StochRSI (20 / 80) Kesişimi
 */
export function computeKeltnerStrategy(
  candles: Candle[],
  keltner: KeltnerPoint[],
  bollinger: BollingerPoint[],
  adx14: Array<number | null>,
  rsi2: Array<number | null>,
  stochRsi: StochasticPoint[]
): KeltnerStrategySummary {
  const empty: KeltnerStrategySummary = {
    channelState: 'flat_range',
    channelLabel: 'Veri bekleniyor',
    adx14: null,
    adxRising: false,
    rsi2: null,
    stochRsiK: null,
    stochRsiD: null,
    ttmSqueezeActive: false,
    breakoutSignal: {
      state: 'none',
      label: 'Aktif Keltner + ADX(>20) kırılım sinyali yok',
      barIndex: null,
      price: null,
    },
    rangeRsi2Signal: {
      state: 'none',
      label: 'Aktif yatay Keltner + RSI(2) 10/90 sinyali yok',
      barIndex: null,
      entryPrice: null,
      stopLoss: null,
      targetNote: 'Kar Al: RSI(2) karşı uç (90 / 10)',
    },
    pullbackStochRsiSignal: {
      state: 'none',
      label: 'Aktif 20 EMA Pullback + StochRSI kesişimi yok',
      barIndex: null,
      price: null,
    },
  };

  if (candles.length < 25 || keltner.length !== candles.length) return empty;

  const lastIdx = candles.length - 1;
  const kcNow = keltner[lastIdx];
  if (!kcNow || kcNow.middle == null || kcNow.upper == null || kcNow.lower == null || kcNow.atr == null) {
    return empty;
  }

  const curAdx = adx14[lastIdx] ?? null;
  const prevAdx = lastIdx > 0 ? adx14[lastIdx - 1] ?? null : null;
  const adxRising = curAdx != null && prevAdx != null ? curAdx > prevAdx : false;
  const curRsi2 = rsi2[lastIdx] != null ? Number(rsi2[lastIdx]!.toFixed(1)) : null;
  const curStochK = stochRsi[lastIdx]?.pctK != null ? Number(stochRsi[lastIdx].pctK!.toFixed(1)) : null;
  const curStochD = stochRsi[lastIdx]?.pctD != null ? Number(stochRsi[lastIdx].pctD!.toFixed(1)) : null;

  // TTM Squeeze: Bollinger Bands compressed completely inside Keltner Envelope
  const bbNow = bollinger[lastIdx];
  const ttmSqueezeActive = Boolean(
    bbNow &&
      bbNow.upper != null &&
      bbNow.lower != null &&
      bbNow.upper < kcNow.upper &&
      bbNow.lower > kcNow.lower
  );

  // Kanal Rejimi Analizi: Üst/Alt Band Sürünmesi (Crawl) vs Yatay Zarf (~%70 Piyasa Zamanı)
  const refBack = Math.max(0, lastIdx - 8);
  const kcBack = keltner[refBack];
  const atrRef = Math.max(kcNow.atr, 1e-9);
  const midDelta = kcBack?.middle != null ? kcNow.middle - kcBack.middle : 0;
  const slopePerBarAtr = Math.abs(midDelta) / (Math.max(1, lastIdx - refBack) * atrRef);

  let upperCrawl = 0;
  let lowerCrawl = 0;
  for (let i = Math.max(0, lastIdx - 4); i <= lastIdx; i++) {
    const ki = keltner[i];
    if (!ki || ki.upper == null || ki.lower == null || ki.middle == null || ki.atr == null) continue;
    if (candles[i].high >= ki.upper - ki.atr * 0.15 && candles[i].close >= ki.middle) {
      upperCrawl++;
    }
    if (candles[i].low <= ki.lower + ki.atr * 0.15 && candles[i].close <= ki.middle) {
      lowerCrawl++;
    }
  }

  let channelState: KeltnerStrategySummary['channelState'] = 'flat_range';
  let channelLabel = 'Yatay Konsolidasyon — Düz Keltner Zarfları (Ranging)';

  if (upperCrawl >= 3 && midDelta > 0) {
    channelState = 'bull_crawl';
    channelLabel = 'Güçlü Boğa Trendi — Üst Keltner Bandında Sürünme (Crawl)';
  } else if (lowerCrawl >= 3 && midDelta < 0) {
    channelState = 'bear_crawl';
    channelLabel = 'Güçlü Ayı Trendi — Alt Keltner Bandında Sürünme (Crawl)';
  } else if (slopePerBarAtr < 0.085 || (curAdx != null && curAdx < 20)) {
    channelState = 'flat_range';
    channelLabel = 'Yatay Konsolidasyon — Düz Keltner Zarfları (ADX<20 / Düz Eğim)';
  } else if (midDelta >= 0) {
    channelState = 'uptrend';
    channelLabel = 'Yukarı Eğimli Keltner Kanalı (20 EMA Dinamik Destek)';
  } else {
    channelState = 'downtrend';
    channelLabel = 'Aşağı Eğimli Keltner Kanalı (20 EMA Dinamik Direnç)';
  }

  // YÖNTEM 1: Yatay Keltner Kırılımı + ADX(14) > 20 Yükselen Trend Gücü
  let breakoutSignal: KeltnerStrategySummary['breakoutSignal'] = {
    state: 'none',
    label: 'Son barlarda aktif Keltner + ADX(>20) kırılımı yok',
    barIndex: null,
    price: null,
  };

  for (let t = lastIdx; t >= Math.max(10, lastIdx - 4); t--) {
    const kt = keltner[t];
    const kPrev = keltner[t - 1];
    const kBase = keltner[Math.max(0, t - 7)];
    const aNow = adx14[t];
    const aPrev = adx14[t - 1];
    if (
      !kt ||
      !kPrev ||
      kt.upper == null ||
      kt.lower == null ||
      kt.middle == null ||
      kt.atr == null ||
      kPrev.upper == null ||
      kPrev.lower == null ||
      aNow == null ||
      aPrev == null
    ) {
      continue;
    }

    const priorFlat =
      (kBase?.middle != null && Math.abs(kPrev.middle! - kBase.middle) <= kt.atr * 1.15) ||
      (adx14[Math.max(0, t - 3)] ?? 18) <= 23;
    const adxConfirmed = aNow >= 20 && aNow >= aPrev - 0.15;
    const ago = lastIdx - t;

    if (priorFlat && adxConfirmed && candles[t - 1].close <= kPrev.upper && candles[t].close > kt.upper) {
      breakoutSignal = {
        state: 'buy_breakout',
        label:
          ago === 0
            ? `Yöntem 1 AL: Üst Keltner Kırılımı + ADX ${aNow.toFixed(1)} (>20)`
            : `Yöntem 1 AL (${ago}b önce): Üst Bant Kırılımı + ADX ${aNow.toFixed(1)}`,
        barIndex: t,
        price: candles[t].close,
      };
      break;
    }

    if (priorFlat && adxConfirmed && candles[t - 1].close >= kPrev.lower && candles[t].close < kt.lower) {
      breakoutSignal = {
        state: 'sell_breakout',
        label:
          ago === 0
            ? `Yöntem 1 SAT: Alt Keltner Kırılımı + ADX ${aNow.toFixed(1)} (>20)`
            : `Yöntem 1 SAT (${ago}b önce): Alt Bant Kırılımı + ADX ${aNow.toFixed(1)}`,
        barIndex: t,
        price: candles[t].close,
      };
      break;
    }
  }

  // YÖNTEM 2: Yatay Keltner + 20 EMA Altı/Üstü Kırılım + 2-Periyot RSI (<10 / >90)
  let rangeRsi2Signal: KeltnerStrategySummary['rangeRsi2Signal'] = {
    state: 'none',
    label: 'Son barlarda yatay Keltner + RSI(2) 10/90 sinyali yok',
    barIndex: null,
    entryPrice: null,
    stopLoss: null,
    targetNote: 'Kar Al (TP): RSI(2) karşı uç (90 / 10)',
  };

  for (let t = lastIdx; t >= Math.max(8, lastIdx - 3); t--) {
    const kt = keltner[t];
    const kBack6 = keltner[t - 6];
    const r2 = rsi2[t];
    if (
      !kt ||
      kt.middle == null ||
      kt.upper == null ||
      kt.lower == null ||
      kt.atr == null ||
      r2 == null
    ) {
      continue;
    }
    const isFlatEnv =
      (kBack6?.middle != null && Math.abs(kt.middle - kBack6.middle) <= kt.atr * 1.15) ||
      (adx14[t] ?? 18) < 25;
    if (!isFlatEnv) continue;

    const ago = lastIdx - t;
    if (candles[t].close < kt.middle && r2 <= 10) {
      rangeRsi2Signal = {
        state: 'buy_range',
        label:
          ago === 0
            ? `Yöntem 2 AL: Yatay KC Orta Bant Altı + RSI(2)=${r2.toFixed(1)} (<10)`
            : `Yöntem 2 AL (${ago}b önce): Yatay KC + RSI(2)=${r2.toFixed(1)}`,
        barIndex: t,
        entryPrice: candles[t].close,
        stopLoss: kt.lower - kt.atr * 0.12,
        targetNote: 'Kar Al (TP): 2-Periyot RSI ≥ 90',
      };
      break;
    }

    if (candles[t].close > kt.middle && r2 >= 90) {
      rangeRsi2Signal = {
        state: 'sell_range',
        label:
          ago === 0
            ? `Yöntem 2 SAT: Yatay KC Orta Bant Üstü + RSI(2)=${r2.toFixed(1)} (>90)`
            : `Yöntem 2 SAT (${ago}b önce): Yatay KC + RSI(2)=${r2.toFixed(1)}`,
        barIndex: t,
        entryPrice: candles[t].close,
        stopLoss: kt.upper + kt.atr * 0.12,
        targetNote: 'Kar Al (TP): 2-Periyot RSI ≤ 10',
      };
      break;
    }
  }

  // YÖNTEM 3: Güçlü Trend 20 EMA Orta Bant Pullback + StochRSI Aşırı Bölge Kesişimi
  let pullbackStochRsiSignal: KeltnerStrategySummary['pullbackStochRsiSignal'] = {
    state: 'none',
    label: 'Son barlarda 20 EMA Pullback + StochRSI kesişimi yok',
    barIndex: null,
    price: null,
  };

  for (let t = lastIdx; t >= Math.max(12, lastIdx - 4); t--) {
    const kt = keltner[t];
    const kBack8 = keltner[t - 8];
    const srNow = stochRsi[t];
    const srPrev = stochRsi[t - 1];
    if (
      !kt ||
      !kBack8 ||
      kt.middle == null ||
      kt.upper == null ||
      kt.lower == null ||
      kt.atr == null ||
      kBack8.middle == null ||
      srNow?.pctK == null ||
      srNow?.pctD == null ||
      srPrev?.pctK == null ||
      srPrev?.pctD == null
    ) {
      continue;
    }

    let hadUpperWalk = false;
    let hadLowerWalk = false;
    for (let j = Math.max(0, t - 12); j <= t - 2; j++) {
      const kj = keltner[j];
      if (!kj || kj.upper == null || kj.lower == null || kj.atr == null) continue;
      if (candles[j].high >= kj.upper - kj.atr * 0.18) hadUpperWalk = true;
      if (candles[j].low <= kj.lower + kj.atr * 0.18) hadLowerWalk = true;
    }

    const ago = lastIdx - t;
    const bullCross =
      srPrev.pctK <= srPrev.pctD &&
      srNow.pctK > srNow.pctD &&
      Math.min(srPrev.pctK, srNow.pctK, srPrev.pctD) <= 25;
    const bearCross =
      srPrev.pctK >= srPrev.pctD &&
      srNow.pctK < srNow.pctD &&
      Math.max(srPrev.pctK, srNow.pctK, srPrev.pctD) >= 75;

    const nearMidBull =
      candles[t].low <= kt.middle + kt.atr * 0.45 && candles[t].close >= kt.lower;
    const nearMidBear =
      candles[t].high >= kt.middle - kt.atr * 0.45 && candles[t].close <= kt.upper;

    if (kt.middle > kBack8.middle && hadUpperWalk && nearMidBull && bullCross) {
      pullbackStochRsiSignal = {
        state: 'buy_pullback',
        label:
          ago === 0
            ? 'Yöntem 3 AL: 20 EMA Pullback + StochRSI Dip Kesişimi'
            : `Yöntem 3 AL (${ago}b önce): 20 EMA Pullback + StochRSI Kesişimi`,
        barIndex: t,
        price: candles[t].close,
      };
      break;
    }

    if (kt.middle < kBack8.middle && hadLowerWalk && nearMidBear && bearCross) {
      pullbackStochRsiSignal = {
        state: 'sell_pullback',
        label:
          ago === 0
            ? 'Yöntem 3 SAT: 20 EMA Pullback + StochRSI Tepe Kesişimi'
            : `Yöntem 3 SAT (${ago}b önce): 20 EMA Pullback + StochRSI Kesişimi`,
        barIndex: t,
        price: candles[t].close,
      };
      break;
    }
  }

  return {
    channelState,
    channelLabel,
    adx14: curAdx != null ? Number(curAdx.toFixed(1)) : null,
    adxRising,
    rsi2: curRsi2,
    stochRsiK: curStochK,
    stochRsiD: curStochD,
    ttmSqueezeActive,
    breakoutSignal,
    rangeRsi2Signal,
    pullbackStochRsiSignal,
  };
}

/**
 * 6. MACD (12, 26, 9) Hesaplaması ve Yeni Trend Başlangıcı Kesişim Tespiti
 */
export function computeMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MacdPoint[] {
  const result: MacdPoint[] = candles.map(() => ({
    macd: null,
    signal: null,
    histogram: null,
  }));
  if (candles.length < slowPeriod + signalPeriod) return result;

  const emaFast = computeEMA(candles, fastPeriod);
  const emaSlow = computeEMA(candles, slowPeriod);

  const macdValues: Array<number | null> = candles.map((_, idx) => {
    const f = emaFast[idx];
    const s = emaSlow[idx];
    return f != null && s != null ? f - s : null;
  });

  const firstValidIdx = macdValues.findIndex((v) => v !== null);
  if (firstValidIdx === -1 || candles.length - firstValidIdx < signalPeriod) {
    return result;
  }

  let sum = 0;
  for (let i = firstValidIdx; i < firstValidIdx + signalPeriod; i++) {
    sum += macdValues[i]!;
  }
  let sig = sum / signalPeriod;
  const k = 2 / (signalPeriod + 1);

  for (let i = firstValidIdx; i < candles.length; i++) {
    const m = macdValues[i]!;
    if (i < firstValidIdx + signalPeriod - 1) {
      result[i] = { macd: m, signal: null, histogram: null };
    } else if (i === firstValidIdx + signalPeriod - 1) {
      result[i] = { macd: m, signal: sig, histogram: m - sig };
    } else {
      sig = m * k + sig * (1 - k);
      result[i] = { macd: m, signal: sig, histogram: m - sig };
    }
  }

  return result;
}

/**
 * 7. Fibonacci Düzeltme Izgarası (Yükselişte Dipten Tepeye, Düşüşte Tepeden Dibe)
 */
export function computeAutoFibonacci(candles: Candle[]): FibonacciGrid | null {
  if (candles.length < 20) return null;
  const startIdx = Math.max(0, candles.length - 95);

  let lowIdx = startIdx;
  let highIdx = startIdx;
  let swingLow = candles[startIdx].low;
  let swingHigh = candles[startIdx].high;

  for (let i = startIdx; i < candles.length; i++) {
    if (candles[i].low <= swingLow) {
      swingLow = candles[i].low;
      lowIdx = i;
    }
    if (candles[i].high >= swingHigh) {
      swingHigh = candles[i].high;
      highIdx = i;
    }
  }

  if (swingHigh <= swingLow) return null;

  const trendMode: 'uptrend' | 'downtrend' = lowIdx <= highIdx ? 'uptrend' : 'downtrend';
  const diff = swingHigh - swingLow;
  const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

  const levels: FibonacciLevel[] = ratios.map((r) => {
    const price =
      trendMode === 'uptrend'
        ? swingHigh - diff * r
        : swingLow + diff * r;
    return {
      ratio: r,
      label: `%${(r * 100).toFixed(1)}`,
      price,
    };
  });

  const lastClose = candles[candles.length - 1].close;
  const sortedAsc = [...levels].sort((a, b) => a.price - b.price);

  let nearestSupport: FibonacciLevel | null = null;
  let nearestResistance: FibonacciLevel | null = null;

  for (const lv of sortedAsc) {
    if (lv.price <= lastClose) nearestSupport = lv;
    if (lv.price > lastClose && !nearestResistance) nearestResistance = lv;
  }

  return {
    trendMode,
    swingStartIndex: Math.min(lowIdx, highIdx),
    swingEndIndex: Math.max(lowIdx, highIdx),
    swingLow,
    swingHigh,
    levels,
    nearestSupport,
    nearestResistance,
  };
}

/**
 * Birleştirilmiş Teknik Yapı & Price Action Analizi
 */
export function analyzeTechnicalStructure(candles: Candle[]): TechnicalStructureAnalysis {
  const marketRegime = detectMarketRegime(candles);
  const supplyDemandZones = detectSupplyDemandZones(candles);
  const ma8 = computeEMA(candles, 8);
  const ma21 = computeEMA(candles, 21);
  const ema10 = computeEMA(candles, 10);
  const ema50 = computeEMA(candles, 50);
  const zones = detectSupportResistanceZones(candles);
  const trendChannel = detectTrendChannel(candles);
  const geometricStructure = detectGeometricStructure(candles);
  const gaps = detectPriceGaps(candles);
  const fibonacci = computeAutoFibonacci(candles);
  const bollinger = computeBollingerBands(candles, 20, 2);
  const macd = computeMACD(candles, 12, 26, 9);
  const rsi14 = computeRSI(candles, 14);
  const stochastic = computeStochastics(candles, 14, 3);
  const sakataMorris = computeSakataMorrisSummary(
    candles,
    ema10,
    gaps,
    rsi14,
    stochastic,
    bollinger
  );
  const bollingerStrategy = computeBollingerStrategy(candles, bollinger, rsi14, ema50);
  const { optimization: bollingerOptimization, adaptiveBollinger } =
    computeEmpiricalBollingerOptimization(candles, bollinger, rsi14);
  const keltner = computeKeltnerChannels(candles, 20, 2, 14);
  const adx14 = computeADX(candles, 14);
  const rsi2 = computeRSI(candles, 2);
  const stochRsi = computeStochRSI(rsi14, 14, 3, 3);
  const keltnerStrategy = computeKeltnerStrategy(
    candles,
    keltner,
    bollinger,
    adx14,
    rsi2,
    stochRsi
  );

  let bollingerStatus = 'Veri hesaplanıyor';
  if (candles.length > 0 && bollinger.length > 0) {
    const lastC = candles[candles.length - 1];
    const lastB = bollinger[bollinger.length - 1];
    if (lastB.upper != null && lastB.lower != null && lastB.middle != null) {
      if (lastC.close > lastB.upper) {
        bollingerStatus = 'Üst Bant Dışında (%B > 100 · Güçlü Kopuş / Satım Ön-Sinyal)';
      } else if (lastC.close < lastB.lower) {
        bollingerStatus = 'Alt Bant Dışında (%B < 0 · Aşırı Satım / Alım Ön-Sinyal)';
      } else if (lastC.high > lastB.upper && lastC.close <= lastB.upper) {
        bollingerStatus = 'Üst Bant Sahte Kırılım Reddi (Yatayda Satış Teyidi)';
      } else if (lastC.low < lastB.lower && lastC.close >= lastB.lower) {
        bollingerStatus = 'Alt Bant Sahte Kırılım Reddi (Yatayda Alış Teyidi)';
      } else if (lastC.close >= lastB.middle) {
        bollingerStatus = 'Bant İçinde — Orta Bant Üzeri Pozitif Seyir';
      } else {
        bollingerStatus = 'Bant İçinde — Alt Destek Bandına Yakın Seyir';
      }
    }
  }

  let macdStatus: TechnicalStructureAnalysis['macdStatus'] = {
    state: 'neutral',
    label: 'Nötr Denge',
    barsSinceCross: null,
  };

  if (macd.length >= 4) {
    const lastIdx = macd.length - 1;
    const cur = macd[lastIdx];
    let crossBarsAgo: number | null = null;
    let crossDir: 'bull' | 'bear' | null = null;

    for (let k = lastIdx; k >= Math.max(1, lastIdx - 8); k--) {
      const mNow = macd[k].macd;
      const sNow = macd[k].signal;
      const mPrev = macd[k - 1].macd;
      const sPrev = macd[k - 1].signal;
      if (mNow != null && sNow != null && mPrev != null && sPrev != null) {
        if (mPrev <= sPrev && mNow > sNow) {
          crossBarsAgo = lastIdx - k;
          crossDir = 'bull';
          break;
        }
        if (mPrev >= sPrev && mNow < sNow) {
          crossBarsAgo = lastIdx - k;
          crossDir = 'bear';
          break;
        }
      }
    }

    if (crossDir === 'bull' && crossBarsAgo !== null && crossBarsAgo <= 3) {
      macdStatus = {
        state: 'bullish_cross',
        label:
          crossBarsAgo === 0
            ? 'Boğa Kesişimi (Yeni Trend Başlangıcı)'
            : `Boğa Kesişimi (${crossBarsAgo} bar önce)`,
        barsSinceCross: crossBarsAgo,
      };
    } else if (crossDir === 'bear' && crossBarsAgo !== null && crossBarsAgo <= 3) {
      macdStatus = {
        state: 'bearish_cross',
        label:
          crossBarsAgo === 0
            ? 'Ayı Kesişimi (Düşüş Başlangıcı)'
            : `Ayı Kesişimi (${crossBarsAgo} bar önce)`,
        barsSinceCross: crossBarsAgo,
      };
    } else if (cur.macd != null && cur.signal != null) {
      macdStatus =
        cur.macd >= cur.signal
          ? {
              state: 'bullish_momentum',
              label: 'Sinyal Üzerinde (Pozitif Trend)',
              barsSinceCross: crossBarsAgo,
            }
          : {
              state: 'bearish_momentum',
              label: 'Sinyal Altında (Negatif Trend)',
              barsSinceCross: crossBarsAgo,
            };
    }
  }

  return {
    marketRegime,
    supplyDemandZones,
    ma8,
    ma21,
    ema10,
    ema50,
    zones,
    trendChannel,
    geometricStructure,
    gaps,
    fibonacci,
    bollinger,
    adaptiveBollinger,
    bollingerStatus,
    macd,
    macdStatus,
    rsi14,
    stochastic,
    sakataMorris,
    bollingerStrategy,
    bollingerOptimization,
    keltner,
    keltnerStrategy,
  };
}

/**
 * 8. The Candlestick Trading Bible — Sniper Confluence Puanlama, %50 Giriş ve R:R Hesaplayıcı
 * (Sayfa 76–157: Confluence, Pin Bar %50 Retracement, Inside Bar, Engulfing & 1:2 R:R Kuralı)
 */
export function evaluatePatternsConfluence(
  patterns: DetectedPattern[],
  candles: Candle[],
  tech: TechnicalStructureAnalysis
): DetectedPattern[] {
  if (candles.length === 0 || patterns.length === 0) return patterns;
  const avgRange = getAverageRange(candles, 30);
  const prox = avgRange * 0.65;

  return patterns.map((p) => {
    const sigCandle = candles[p.endIndex] || candles[candles.length - 1];
    const factors: string[] = [];
    const isBull = p.direction === 'bullish';

    // 1. Piyasa Yapısı & Trend Uyumu
    const regime = tech.marketRegime.regime;
    const isChoppyMarketWarning = regime === 'choppy';
    let isCounterTrendWarning = false;

    if (isBull && regime === 'uptrend') {
      factors.push('Yükseliş Trendi (HH/HL) ile Aynı Yönde');
    } else if (!isBull && regime === 'downtrend') {
      factors.push('Düşüş Trendi (LH/LL) ile Aynı Yönde');
    } else if (regime === 'ranging' && tech.marketRegime.wavePhase === 'range_boundary') {
      factors.push('Yatay Piyasa (Range) Uç Sınır Reddi');
    } else if ((isBull && regime === 'downtrend') || (!isBull && regime === 'uptrend')) {
      isCounterTrendWarning = true;
    }

    // 2. Yatay S/R veya Kurumsal Arz/Talep Bölgesi Teması
    const touchesSR = tech.zones.some((z) => {
      if (isBull) {
        return p.lowBound <= z.highBound + prox && p.highBound >= z.lowBound - prox;
      }
      return p.highBound >= z.lowBound - prox && p.lowBound <= z.highBound + prox;
    });
    const touchesSD = tech.supplyDemandZones.some((sd) => {
      if (isBull && sd.kind === 'demand') {
        return p.lowBound <= sd.highBound + prox && p.highBound >= sd.lowBound - prox;
      }
      if (!isBull && sd.kind === 'supply') {
        return p.highBound >= sd.lowBound - prox && p.lowBound <= sd.highBound + prox;
      }
      return false;
    });

    if (touchesSD && touchesSR) {
      factors.push('Kurumsal Arz/Talep + Yatay S/R Bölgesi Kesişimi');
    } else if (touchesSD) {
      factors.push(isBull ? 'Kurumsal Talep (Demand) Bölgesi Reddi' : 'Kurumsal Arz (Supply) Bölgesi Reddi');
    } else if (touchesSR) {
      factors.push(isBull ? 'Yatay Destek Bölgesi Teması' : 'Yatay Direnç Bölgesi Teması');
    }

    // 3. 8 & 21 Dinamik Hareketli Ortalama Reddi (Bible p.85-92)
    const m8 = tech.ma8[p.endIndex];
    const m21 = tech.ma21[p.endIndex];
    const nearMA8 = m8 != null && p.lowBound - prox * 0.4 <= m8 && p.highBound + prox * 0.4 >= m8;
    const nearMA21 = m21 != null && p.lowBound - prox * 0.4 <= m21 && p.highBound + prox * 0.4 >= m21;
    if (nearMA21 || nearMA8) {
      const alignedMA =
        m8 != null && m21 != null ? (isBull ? m8 >= m21 * 0.998 : m8 <= m21 * 1.002) : true;
      if (alignedMA) {
        factors.push(
          nearMA21 && nearMA8
            ? '8 & 21 Dinamik Ortalamalar Kümesi (Dynamic S/R)'
            : nearMA21
              ? '21 Periyot Dinamik Ortalama Reddi'
              : '8 Periyot Dinamik Momentum Ortalaması Reddi'
        );
      }
    }

    // 4. %50 – %61.8 Fibonacci Altın Oran Kümesi (Bible p.111-116)
    if (tech.fibonacci) {
      const goldenLevels = tech.fibonacci.levels.filter(
        (lv) => Math.abs(lv.ratio - 0.5) < 0.01 || Math.abs(lv.ratio - 0.618) < 0.01
      );
      const hitsGolden = goldenLevels.some(
        (lv) => p.lowBound - prox * 0.5 <= lv.price && p.highBound + prox * 0.5 >= lv.price
      );
      if (hitsGolden) {
        factors.push('Fibonacci %50 – %61.8 Altın Düzeltme Bölgesi');
      }
    }

    // 5. Bollinger Stratejisi & Williams Denklem 5/6 İçe Dönüşü veya MACD Momentum Uyumu
    const bb = tech.adaptiveBollinger[p.endIndex] || tech.bollinger[p.endIndex];
    const prevBb =
      p.endIndex > 0
        ? tech.adaptiveBollinger[p.endIndex - 1] || tech.bollinger[p.endIndex - 1]
        : null;
    const prevSigCandle = p.endIndex > 0 ? candles[p.endIndex - 1] : null;
    const e50AtSig = tech.ema50[p.endIndex];

    const williamsReEntry =
      bb != null &&
      prevBb != null &&
      prevSigCandle != null &&
      ((isBull &&
        prevBb.lower != null &&
        bb.lower != null &&
        prevSigCandle.close < prevBb.lower &&
        sigCandle.close > bb.lower) ||
        (!isBull &&
          prevBb.upper != null &&
          bb.upper != null &&
          prevSigCandle.close > prevBb.upper &&
          sigCandle.close < bb.upper));

    const bbFalseBreak =
      bb &&
      ((isBull && bb.lower != null && p.lowBound <= bb.lower && sigCandle.close >= bb.lower) ||
        (!isBull && bb.upper != null && p.highBound >= bb.upper && sigCandle.close <= bb.upper));

    const bbmaAligned =
      bb?.middle != null &&
      e50AtSig != null &&
      (isBull ? bb.middle >= e50AtSig : bb.middle <= e50AtSig);

    if (williamsReEntry) {
      factors.push(
        isBull
          ? `Williams Denklem 5 Alt Bant İçi Geri Dönüş (N*=${tech.bollingerOptimization.optimalWindowN})`
          : `Williams Denklem 6 Üst Bant İçi Geri Dönüş (N*=${tech.bollingerOptimization.optimalWindowN})`
      );
    } else if (bbFalseBreak) {
      factors.push('Bollinger Dış Bandı Sahte Kırılım Reddi');
    } else if (bbmaAligned && p.patternType === 'continuation') {
      factors.push('BBMA (Orta Bant × 50 EMA) Trend Uyumu');
    } else {
      const mp = tech.macd[p.endIndex];
      if (mp && mp.macd != null && mp.signal != null) {
        if ((isBull && mp.macd >= mp.signal) || (!isBull && mp.macd <= mp.signal)) {
          factors.push('MACD (12,26,9) Momentum Yön Onayı');
        }
      } else if (bbmaAligned) {
        factors.push('BBMA (Orta Bant × 50 EMA) Yön Onayı');
      }
    }

    // 5B. Keltner Kanalı (20 EMA ± 2 ATR) 3-Yöntem Confluence Katkısı
    if (factors.length < 5) {
      const ks = tech.keltnerStrategy;
      const kcAtSig = tech.keltner[p.endIndex];
      if (
        ks.pullbackStochRsiSignal.barIndex != null &&
        Math.abs(ks.pullbackStochRsiSignal.barIndex - p.endIndex) <= 2 &&
        ((isBull && ks.pullbackStochRsiSignal.state === 'buy_pullback') ||
          (!isBull && ks.pullbackStochRsiSignal.state === 'sell_pullback'))
      ) {
        factors.push('Keltner 20 EMA Pullback + StochRSI Kesişimi');
      } else if (
        ks.rangeRsi2Signal.barIndex != null &&
        Math.abs(ks.rangeRsi2Signal.barIndex - p.endIndex) <= 2 &&
        ((isBull && ks.rangeRsi2Signal.state === 'buy_range') ||
          (!isBull && ks.rangeRsi2Signal.state === 'sell_range'))
      ) {
        factors.push('Yatay Keltner + 2-Periyot RSI (10/90) Aşırı Uç Onayı');
      } else if (
        ks.breakoutSignal.barIndex != null &&
        Math.abs(ks.breakoutSignal.barIndex - p.endIndex) <= 2 &&
        ((isBull && ks.breakoutSignal.state === 'buy_breakout') ||
          (!isBull && ks.breakoutSignal.state === 'sell_breakout'))
      ) {
        factors.push('Keltner Dış Bant Kırılımı + ADX(>20) Güç Onayı');
      } else if (
        kcAtSig?.middle != null &&
        kcAtSig?.atr != null &&
        p.lowBound <= kcAtSig.middle + kcAtSig.atr * 0.25 &&
        p.highBound >= kcAtSig.middle - kcAtSig.atr * 0.25 &&
        ((isBull && (ks.channelState === 'bull_crawl' || ks.channelState === 'uptrend')) ||
          (!isBull && (ks.channelState === 'bear_crawl' || ks.channelState === 'downtrend')))
      ) {
        factors.push('Keltner Orta Bandı (20 EMA) Dinamik Trend Tepkisi');
      }
    }

    // Giriş Taktikleri & Risk/Ödül Planı (Bible p.93-95, p.152-157)
    const aggressiveEntry = sigCandle.close;
    const conservativeEntry = (p.highBound + p.lowBound) / 2; // %50 Bar Geri Çekilmesi
    const stopBuffer = avgRange * 0.12;
    const protectiveStop = isBull
      ? Math.min(p.stopLossLevel, p.lowBound - stopBuffer)
      : Math.max(p.stopLossLevel, p.highBound + stopBuffer);

    const minSafeRisk = Math.max(avgRange * 0.25, 1e-6);
    const riskAgg = Math.max(minSafeRisk, Math.abs(aggressiveEntry - protectiveStop));
    const riskCons = Math.max(minSafeRisk, Math.abs(conservativeEntry - protectiveStop));

    // Sonraki Karşıt Anahtar Seviyeyi (Hedef Fiyat / TP) Bul
    const candidateTargets: number[] = [];
    for (const z of tech.zones) {
      if (isBull && z.centerPrice > aggressiveEntry + riskAgg * 0.8) {
        candidateTargets.push(z.lowBound);
      } else if (!isBull && z.centerPrice < aggressiveEntry - riskAgg * 0.8) {
        candidateTargets.push(z.highBound);
      }
    }
    for (const sd of tech.supplyDemandZones) {
      if (isBull && sd.kind === 'supply' && sd.lowBound > aggressiveEntry + riskAgg * 0.8) {
        candidateTargets.push(sd.lowBound);
      } else if (!isBull && sd.kind === 'demand' && sd.highBound < aggressiveEntry - riskAgg * 0.8) {
        candidateTargets.push(sd.highBound);
      }
    }

    let nextTargetPrice: number;
    if (candidateTargets.length > 0) {
      nextTargetPrice = isBull ? Math.min(...candidateTargets) : Math.max(...candidateTargets);
    } else {
      // Önü açık ise 2.4R projeksiyon hedefi
      nextTargetPrice = isBull ? aggressiveEntry + riskAgg * 2.4 : Math.max(0, aggressiveEntry - riskAgg * 2.4);
    }

    const rewardAgg = Math.max(0, isBull ? nextTargetPrice - aggressiveEntry : aggressiveEntry - nextTargetPrice);
    const rewardCons = Math.max(
      0,
      isBull ? nextTargetPrice - conservativeEntry : conservativeEntry - nextTargetPrice
    );

    const rrAggressive = Number((rewardAgg / riskAgg).toFixed(2));
    const rrConservative = Number((rewardCons / riskCons).toFixed(2));

    // 6. Greg Morris Ön-Sinyal Filtresi (Bölüm 8: Stokastik %D 20/80, Wilder RSI 14, Bollinger %B, EMA 10)
    const rsiVal = tech.rsi14[p.endIndex] ?? null;
    const stochDVal = tech.stochastic[p.endIndex]?.pctD ?? null;
    const pctBVal = tech.bollinger[p.endIndex]?.pctB ?? null;

    const priorRefIdx = Math.max(0, p.startIndex - 1);
    const ema10Prior = tech.ema10[priorRefIdx];
    const ema10End = tech.ema10[p.endIndex];
    const ema10Aligned =
      p.patternType === 'continuation'
        ? ema10End != null
          ? isBull
            ? sigCandle.close >= ema10End
            : sigCandle.close <= ema10End
          : false
        : ema10Prior != null
          ? isBull
            ? candles[priorRefIdx].close <= ema10Prior
            : candles[priorRefIdx].close >= ema10Prior
          : false;

    let preHitReasons: string[] = [];
    if (p.patternType === 'reversal') {
      // Check across pattern window [startIndex..endIndex] for Pre-Signal Oversold/Overbought
      let minD = Infinity;
      let maxD = -Infinity;
      let minRsi = Infinity;
      let maxRsi = -Infinity;
      let minPctB = Infinity;
      let maxPctB = -Infinity;
      for (let k = p.startIndex; k <= p.endIndex; k++) {
        const dk = tech.stochastic[k]?.pctD;
        const rk = tech.rsi14[k];
        const bk = tech.bollinger[k]?.pctB;
        if (dk != null) {
          if (dk < minD) minD = dk;
          if (dk > maxD) maxD = dk;
        }
        if (rk != null) {
          if (rk < minRsi) minRsi = rk;
          if (rk > maxRsi) maxRsi = rk;
        }
        if (bk != null) {
          if (bk < minPctB) minPctB = bk;
          if (bk > maxPctB) maxPctB = bk;
        }
      }
      if (isBull) {
        if (minD <= 20) preHitReasons.push(`%D≤20 (${minD.toFixed(0)})`);
        if (minRsi <= 35) preHitReasons.push(`RSI≤35 (${minRsi.toFixed(0)})`);
        if (minPctB <= 0.05) preHitReasons.push(`%B≤0.05`);
      } else {
        if (maxD >= 80) preHitReasons.push(`%D≥80 (${maxD.toFixed(0)})`);
        if (maxRsi >= 65) preHitReasons.push(`RSI≥65 (${maxRsi.toFixed(0)})`);
        if (maxPctB >= 0.95) preHitReasons.push(`%B≥0.95`);
      }
    } else {
      // Continuation pattern: EMA(10) short-term trend alignment + non-exhausted RSI (35..68)
      if (
        ema10Aligned &&
        rsiVal != null &&
        (isBull ? rsiVal >= 45 && rsiVal <= 72 : rsiVal <= 55 && rsiVal >= 28)
      ) {
        preHitReasons.push('EMA(10) Trend + Sağlıklı RSI Devam Gücü');
      }
    }

    const isFilteredSignal = preHitReasons.length > 0;
    if (isFilteredSignal && factors.length < 5) {
      factors.push(`Morris Ön-Sinyal Filtresi (${preHitReasons.join(', ')})`);
    }

    const morrisFilter: MorrisFilterStatus = {
      isFilteredSignal,
      ema10Aligned,
      rsiAtSignal: rsiVal,
      stochDAtSignal: stochDVal,
      bollingerPctBAtSignal: pctBVal,
      triggerSummary: isFilteredSignal
        ? `Ön-Sinyal Onaylı: ${preHitReasons.join(' · ')}`
        : p.patternType === 'continuation'
          ? 'Devam yapısı — EMA(10) yönü izleniyor'
          : 'Aşırı alım/satım ön-sinyal eşiği dışında oluştu',
    };

    const plan: SetupConfluencePlan = {
      confluenceScore: Math.min(5, factors.length),
      confluenceFactors: factors,
      aggressiveEntry,
      conservativeEntry,
      protectiveStop,
      nextTargetPrice,
      rrAggressive,
      rrConservative,
      meetsTwoToOneRule: rrAggressive >= 2 || rrConservative >= 2,
      isCounterTrendWarning,
      isChoppyMarketWarning,
    };

    return {
      ...p,
      confluencePlan: plan,
      morrisFilter,
    };
  });
}

/**
 * 9. Top-Down Çoklu Zaman Dilimi Analizi (Bible Sayfa 22–26)
 * Üst zaman dilimi (4s veya 1G) büyük resmi ile aktif grafik arasındaki hizalanmayı kontrol eder.
 */
export function getHigherTimeframeFor(tf: Timeframe): { tf: Timeframe; label: string } {
  switch (tf) {
    case '1m':
    case '5m':
      return { tf: '1h', label: '1 Saatlik (Üst Perspektif)' };
    case '15m':
    case '1h':
      return { tf: '4h', label: '4 Saatlik (Üst Perspektif)' };
    case '4h':
    case '1d':
    default:
      return { tf: '1d', label: 'Günlük — 1G (Ana Makro Yapı)' };
  }
}

export function evaluateTopDownAlignment(
  currentCandles: Candle[],
  currentRegime: MarketRegimeInfo,
  htfCandles: Candle[],
  htfMeta: { tf: Timeframe; label: string }
): TopDownSummary | null {
  if (currentCandles.length === 0 || htfCandles.length < 15) return null;

  const htfRegimeInfo = detectMarketRegime(htfCandles);
  const htfZones = detectSupportResistanceZones(htfCandles);
  const htfLast = htfCandles[htfCandles.length - 1];
  const curPrice = currentCandles[currentCandles.length - 1].close;
  const htfAvgRange = getAverageRange(htfCandles, 25);

  let htfKeyResistance: number | null = null;
  let htfKeySupport: number | null = null;

  const resistancesAbove = htfZones
    .filter((z) => z.centerPrice >= curPrice)
    .sort((a, b) => a.centerPrice - b.centerPrice);
  const supportsBelow = htfZones
    .filter((z) => z.centerPrice < curPrice)
    .sort((a, b) => b.centerPrice - a.centerPrice);

  if (resistancesAbove.length > 0) htfKeyResistance = resistancesAbove[0].centerPrice;
  if (supportsBelow.length > 0) htfKeySupport = supportsBelow[0].centerPrice;

  const nearHtfResistance =
    htfKeyResistance != null && Math.abs(htfKeyResistance - curPrice) <= htfAvgRange * 0.55;
  const nearHtfSupport =
    htfKeySupport != null && Math.abs(curPrice - htfKeySupport) <= htfAvgRange * 0.55;

  let alignmentNote = '';
  if (nearHtfResistance) {
    alignmentNote =
      'DİKKAT: Fiyat üst zaman dilimi ana direnç duvarına çok yakın! Doğrudan alış (Long) açmak tehlikelidir; kırılım veya satış reddi izlenmeli.';
  } else if (nearHtfSupport) {
    alignmentNote =
      'FIRSAT / DİKKAT: Fiyat üst zaman dilimi ana destek bölgesinde! Açığa satıştan kaçının; alt grafikte Boğa Pin Bar / Yutan Boğa teyidi arayın.';
  } else if (htfRegimeInfo.regime === currentRegime.regime && currentRegime.regime !== 'choppy') {
    alignmentNote =
      'TAM UYUM: Üst zaman dilimi ile aktif grafik aynı yönde hizalanmış durumda — yüksek olasılıklı Top-Down kurulum ortamı.';
  } else if (htfRegimeInfo.regime === 'choppy' || currentRegime.regime === 'choppy') {
    alignmentNote =
      'GÜRÜLTÜ UYARISI: Zaman dilimlerinden birinde kararsız (choppy) yapı var; yalnızca en güçlü S/R uçlarında seçici olun.';
  } else {
    alignmentNote = `Üst zaman dilimi (${htfMeta.label}) ${htfRegimeInfo.turkishTitle} görünümünde; ana akıma ters işlemlerde R:R hedefini yakın tutun.`;
  }

  return {
    higherTimeframe: htfMeta.tf,
    higherTimeframeLabel: htfMeta.label,
    htfRegime: htfRegimeInfo.regime,
    htfRegimeLabel: htfRegimeInfo.turkishTitle,
    htfLastCandleBullish: htfLast.close >= htfLast.open,
    nearHtfResistance,
    nearHtfSupport,
    htfKeyResistance,
    htfKeySupport,
    alignmentNote,
  };
}
