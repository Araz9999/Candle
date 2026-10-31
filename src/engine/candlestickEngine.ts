import { PATTERN_MAP, PATTERNS_CATALOG } from '../data/patternsCatalog';
import type {
  Candle,
  CandleAnatomy,
  DetectedPattern,
  PatternBreakdownInfo,
  PatternDirection,
  PatternRole,
  PatternSettings,
  PatternStatus,
} from '../types/market';

export function computeEMA(candles: Candle[], period: number): Array<number | null> {
  const result: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let ema = sum / period;
  result[period - 1] = ema;

  const k = 2 / (period + 1);
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function getBody(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function getRange(c: Candle): number {
  return Math.max(c.high - c.low, 1e-9);
}

function getBodyTop(c: Candle): number {
  return Math.max(c.open, c.close);
}

function getBodyBottom(c: Candle): number {
  return Math.min(c.open, c.close);
}

function getBodyMid(c: Candle): number {
  return (c.open + c.close) / 2;
}

function getUpperWick(c: Candle): number {
  return Math.max(0, c.high - getBodyTop(c));
}

function getLowerWick(c: Candle): number {
  return Math.max(0, getBodyBottom(c) - c.low);
}

function getLocalAverages(candles: Candle[], idx: number, lookback = 14): { avgBody: number; avgRange: number; avgVol: number } {
  const start = Math.max(0, idx - lookback);
  const end = idx;
  let bodySum = 0;
  let rangeSum = 0;
  let volSum = 0;
  let count = 0;
  for (let i = start; i <= end; i++) {
    bodySum += getBody(candles[i]);
    rangeSum += getRange(candles[i]);
    volSum += candles[i].volume || 0;
    count++;
  }
  return {
    avgBody: count > 0 ? Math.max(bodySum / count, 1e-8) : 1e-8,
    avgRange: count > 0 ? Math.max(rangeSum / count, 1e-8) : 1e-8,
    avgVol: count > 0 ? volSum / count : 0,
  };
}

function getTrendContext(candles: Candle[], endBeforeIdx: number): 'up' | 'down' | 'flat' {
  if (endBeforeIdx < 4) return 'flat';
  const lookback = Math.min(8, endBeforeIdx);
  let sum = 0;
  for (let i = endBeforeIdx - lookback; i < endBeforeIdx; i++) {
    sum += candles[i].close;
  }
  const sma = sum / lookback;
  const refClose = candles[endBeforeIdx].close;
  const anchorClose = candles[Math.max(0, endBeforeIdx - 5)].close;
  const { avgRange } = getLocalAverages(candles, endBeforeIdx, 10);
  const threshold = avgRange * 0.25;

  if (refClose < sma - threshold * 0.4 || refClose < anchorClose - threshold) {
    return 'down';
  }
  if (refClose > sma + threshold * 0.4 || refClose > anchorClose + threshold) {
    return 'up';
  }
  return 'flat';
}

export function analyzeSingleCandle(candles: Candle[], index: number, decimals = 2): CandleAnatomy | null {
  if (index < 0 || index >= candles.length) return null;
  const c = candles[index];
  const prev = index > 0 ? candles[index - 1] : null;
  const totalRange = Math.max(c.high - c.low, 0);
  const safeRange = totalRange > 0 ? totalRange : 1;

  const bodySize = Math.abs(c.close - c.open);
  const upperWick = Math.max(0, c.high - Math.max(c.open, c.close));
  const lowerWick = Math.max(0, Math.min(c.open, c.close) - c.low);

  const bodyPct = totalRange > 0 ? (bodySize / safeRange) * 100 : 0;
  const upperWickPct = totalRange > 0 ? (upperWick / safeRange) * 100 : 0;
  const lowerWickPct = totalRange > 0 ? (lowerWick / safeRange) * 100 : 0;

  const { avgBody, avgRange, avgVol } = getLocalAverages(candles, index, 14);
  const isDoji = totalRange === 0 || (bodyPct <= 11 && bodySize <= avgBody * 0.35);
  const isBullish = c.close > c.open && !isDoji;
  const isBearish = c.close < c.open && !isDoji;
  const isMarubozu = bodyPct >= 86 && bodySize >= avgBody * 0.85;

  const refOpen = prev ? prev.close : c.open;
  const changeAbs = c.close - refOpen;
  const changePct = refOpen !== 0 ? (changeAbs / refOpen) * 100 : 0;

  const trend = getTrendContext(candles, Math.max(0, index - 1));
  const trendLabel =
    trend === 'up' ? 'Yükseliş Eğilimi' : trend === 'down' ? 'Düşüş Eğilimi' : 'Yatay Denge';

  let candleTypeLabel = 'Standart Gövdeli Mum';
  if (isDoji) {
    if (lowerWickPct >= 60 && upperWickPct <= 15) {
      candleTypeLabel = 'Yusufçuk Doji (Dragonfly)';
    } else if (upperWickPct >= 60 && lowerWickPct <= 15) {
      candleTypeLabel = 'Mezar Taşı Doji (Gravestone)';
    } else {
      candleTypeLabel = 'Doji (Kararsızlık Mumu)';
    }
  } else if (isMarubozu) {
    candleTypeLabel = isBullish ? 'Boğa Marubozu (Tam Gövde)' : 'Ayı Marubozu (Tam Gövde)';
  } else if (lowerWick >= bodySize * 2 && upperWickPct <= 18) {
    candleTypeLabel = trend === 'down' ? 'Çekiç Yapılı Mum (Dip Tepkisi)' : 'Asılı Adam Yapılı Mum';
  } else if (upperWick >= bodySize * 2 && lowerWickPct <= 18) {
    candleTypeLabel = trend === 'up' ? 'Kayan Yıldız Yapısı (Üst Red)' : 'Ters Çekiç Yapısı';
  } else if (bodyPct <= 30 && upperWickPct >= 25 && lowerWickPct >= 25) {
    candleTypeLabel = 'Topaç Mum (Spinning Top)';
  } else if (bodySize >= avgBody * 1.35) {
    candleTypeLabel = isBullish ? 'Geniş Gövdeli Alıcılı Mum' : 'Geniş Gövdeli Satıcılı Mum';
  } else {
    candleTypeLabel = isBullish ? 'Alıcılı (Beyaz/Yeşil) Mum' : 'Satıcılı (Siyah/Kırmızı) Mum';
  }

  let pressureLabel = 'Dengeli Fiyatlama';
  if (isMarubozu && isBullish) {
    pressureLabel = 'Güçlü Alıcı Hakimiyeti';
  } else if (isMarubozu && isBearish) {
    pressureLabel = 'Güçlü Satıcı Hakimiyeti';
  } else if (lowerWickPct >= 48) {
    pressureLabel = 'Alt Seviyelerden Güçlü Alıcı Tepkisi';
  } else if (upperWickPct >= 48) {
    pressureLabel = 'Üst Seviyelerden Satıcı Reddi';
  } else if (isBullish) {
    pressureLabel = 'Alıcı Ağırlıklı Kapanış';
  } else if (isBearish) {
    pressureLabel = 'Satıcı Ağırlıklı Kapanış';
  }

  const volumeRatio = avgVol > 0 ? c.volume / avgVol : 1;
  const readingNotes: string[] = [];

  // 1. Body story
  if (isDoji) {
    readingNotes.push(
      `Açılış (${c.open.toFixed(decimals)}) ve kapanış (${c.close.toFixed(decimals)}) birbirine çok yakın gerçekleşti; alıcı ve satıcılar bu barda yeni bir denge arıyor.`
    );
  } else if (isBullish) {
    readingNotes.push(
      `Fiyat açılıştan itibaren alıcıların kontrolünde yükselerek bar aralığının %${bodyPct.toFixed(0)} kadarını pozitif gövde olarak kapattı.`
    );
  } else {
    readingNotes.push(
      `Satış baskısıyla fiyat açılışın altına geriledi ve toplam bar boyunun %${bodyPct.toFixed(0)} kadarı negatif gövde olarak oluştu.`
    );
  }

  // 2. Shadow / Wick story
  if (lowerWickPct >= 40) {
    readingNotes.push(
      `Uzun alt gölge (%${lowerWickPct.toFixed(0)}), seans içinde ${c.low.toFixed(decimals)} seviyesine inen satışların alıcılar tarafından karşılandığını gösteriyor.`
    );
  } else if (upperWickPct >= 40) {
    readingNotes.push(
      `Belirgin üst gölge (%${upperWickPct.toFixed(0)}), ${c.high.toFixed(decimals)} test edildiğinde kar satışlarının devreye girdiğine işaret ediyor.`
    );
  } else if (upperWickPct < 12 && lowerWickPct < 12 && totalRange > avgRange * 0.5) {
    readingNotes.push(
      `Gölgelerin çok kısa kalması, bar yönündeki momentumun seans sonuna kadar kesintisiz korunduğunu doğruluyor.`
    );
  }

  // 3. Relation to prior bar
  if (prev) {
    const prevTop = getBodyTop(prev);
    const prevBot = getBodyBottom(prev);
    const curTop = getBodyTop(c);
    const curBot = getBodyBottom(c);
    if (curTop > prevTop && curBot < prevBot && bodySize > getBody(prev)) {
      readingNotes.push('Mevcut mum gövdesi bir önceki mumun gövdesini tamamen içine alarak yutan (engulfing) bir dinamik üretti.');
    } else if (curTop < prevTop && curBot > prevBot) {
      readingNotes.push('Gövde tamamen önceki barın sınırları içinde kaldı (İç Bar / Harami yapısı); sıkışma sonrası kırılım yönü izlenmeli.');
    } else if (c.close > prev.high) {
      readingNotes.push(`Kapanış, bir önceki barın en yüksek seviyesi (${prev.high.toFixed(decimals)}) üzerinde gerçekleşerek kısa vadeli direnci aştı.`);
    } else if (c.close < prev.low) {
      readingNotes.push(`Kapanış, bir önceki barın en düşük seviyesi (${prev.low.toFixed(decimals)}) altında kalarak aşağı yönlü baskıyı sürdürdü.`);
    }
  }

  // 4. Volume confirmation
  if (c.volume > 0 && avgVol > 0) {
    if (volumeRatio >= 1.5) {
      readingNotes.push(
        `İşlem hacmi son 14 bar ortalamasının ${volumeRatio.toFixed(2)} katına çıkarak fiyat hareketini güçlü şekilde destekledi.`
      );
    } else if (volumeRatio <= 0.6) {
      readingNotes.push(
        `Hacim ortalamanın altında (${volumeRatio.toFixed(2)}x) kaldı; hareketin kalıcılığı için sonraki barlarda teyit aranmalı.`
      );
    }
  }

  return {
    index,
    candle: c,
    prevCandle: prev,
    bodySize,
    bodyPct,
    upperWick,
    upperWickPct,
    lowerWick,
    lowerWickPct,
    totalRange,
    changeAbs,
    changePct,
    isBullish,
    isBearish,
    isDoji,
    isMarubozu,
    candleTypeLabel,
    pressureLabel,
    trendLabel,
    volumeRatio,
    readingNotes,
  };
}

function evaluatePatternLifecycle(
  candles: Candle[],
  endIndex: number,
  direction: PatternDirection,
  confirmationLevel: number,
  stopLossLevel: number,
  confirmBarCount: number
): { status: PatternStatus; confirmedAtIndex: number | null; failedAtIndex: number | null } {
  const maxIdx = Math.min(candles.length - 1, endIndex + Math.max(1, confirmBarCount));
  let confirmed = false;
  let confirmedAtIndex: number | null = null;
  let failed = false;
  let failedAtIndex: number | null = null;

  for (let k = endIndex + 1; k <= maxIdx; k++) {
    const close = candles[k].close;
    if (direction === 'bullish') {
      if (!confirmed) {
        if (close > confirmationLevel) {
          confirmed = true;
          confirmedAtIndex = k;
        }
      } else {
        if (close < stopLossLevel) {
          failed = true;
          failedAtIndex = k;
          break;
        }
      }
    } else {
      if (!confirmed) {
        if (close < confirmationLevel) {
          confirmed = true;
          confirmedAtIndex = k;
        }
      } else {
        if (close > stopLossLevel) {
          failed = true;
          failedAtIndex = k;
          break;
        }
      }
    }
  }

  if (confirmed && failed) {
    return { status: 'confirmed_fail', confirmedAtIndex, failedAtIndex };
  }
  if (confirmed) {
    return { status: 'confirmed', confirmedAtIndex, failedAtIndex: null };
  }
  return { status: 'not_confirmed', confirmedAtIndex: null, failedAtIndex: null };
}

/**
 * Greg Morris — Pattern Breakdown (Çoklu Mum Formasyonunu Tek Muma İndirgeme — Bölüm 3 & 4)
 * Kural: [İlk Bar Açılış, Tüm Barlar En Yüksek, Tüm Barlar En Düşük, Son Bar Kapanış]
 */
export function computePatternBreakdown(
  candles: Candle[],
  startIndex: number,
  endIndex: number,
  direction: PatternDirection,
  patternType: PatternRole
): PatternBreakdownInfo {
  const first = candles[startIndex];
  const last = candles[endIndex];
  let high = -Infinity;
  let low = Infinity;
  for (let k = startIndex; k <= endIndex; k++) {
    if (candles[k].high > high) high = candles[k].high;
    if (candles[k].low < low) low = candles[k].low;
  }
  const open = first.open;
  const close = last.close;
  const range = Math.max(high - low, 1e-9);
  const body = Math.abs(close - open);
  const upperWick = Math.max(0, high - Math.max(open, close));
  const lowerWick = Math.max(0, Math.min(open, close) - low);

  const bodyPct = (body / range) * 100;
  const upperWickPct = (upperWick / range) * 100;
  const lowerWickPct = (lowerWick / range) * 100;
  const isDoji = bodyPct <= 11;
  const isBullish = close > open && !isDoji;

  let reducedLabel = 'Standart Mum';
  let alignment: PatternBreakdownInfo['alignment'] = 'neutral';

  const isHammerUmbrella = lowerWickPct >= 55 && upperWickPct <= 18;
  const isShootingStarUmbrella = upperWickPct >= 55 && lowerWickPct <= 18;

  if (isDoji) {
    if (lowerWickPct >= 58) reducedLabel = 'Yusufçuk Doji (Alıcı Kuyruğu)';
    else if (upperWickPct >= 58) reducedLabel = 'Mezar Taşı Doji (Satıcı Kuyruğu)';
    else reducedLabel = 'Uzun Bacaklı Doji (Kararsızlık)';
  } else if (isHammerUmbrella) {
    reducedLabel = direction === 'bullish' ? 'Kağıt Şemsiye / Çekiç (Boğa)' : 'Asılı Adam Şemsiyesi';
  } else if (isShootingStarUmbrella) {
    reducedLabel = direction === 'bearish' ? 'Kayan Yıldız (Üst Red)' : 'Ters Çekiç Yapısı';
  } else if (bodyPct >= 62) {
    reducedLabel = isBullish ? 'Uzun Beyaz Mum (Güçlü Boğa)' : 'Uzun Siyah Mum (Güçlü Ayı)';
  } else if (bodyPct <= 28 && upperWickPct >= 25 && lowerWickPct >= 25) {
    reducedLabel = 'Topaç Mum (Spinning Top)';
  } else {
    reducedLabel = isBullish ? 'Alıcılı Beyaz Mum' : 'Satıcılı Siyah Mum';
  }

  if (direction === 'bullish') {
    if (isHammerUmbrella || (isDoji && lowerWickPct >= 58) || (isBullish && bodyPct >= 38)) {
      alignment = 'supports';
    } else if ((!isBullish && !isDoji && bodyPct >= 25) || isShootingStarUmbrella) {
      alignment = 'conflicts';
    } else {
      alignment = 'neutral';
    }
  } else {
    if (isShootingStarUmbrella || (isDoji && upperWickPct >= 58) || (!isBullish && !isDoji && bodyPct >= 38)) {
      alignment = 'supports';
    } else if ((isBullish && bodyPct >= 25) || isHammerUmbrella) {
      alignment = 'conflicts';
    } else {
      alignment = 'neutral';
    }
  }

  let explanation = '';
  if (alignment === 'supports') {
    explanation = `İndirgenmiş tek mum (${reducedLabel}) ${
      direction === 'bullish' ? 'Boğa' : 'Ayı'
    } ${patternType === 'continuation' ? 'devam' : 'dönüş'} psikolojisini doğrudan destekliyor; Greg Morris kuralına göre ek onay aranmadan sinyal güçlüdür.`;
  } else if (alignment === 'conflicts') {
    explanation = `İndirgenmiş tek mum (${reducedLabel}) formasyon yönüyle çelişen gövde/gölge taşıyor; Greg Morris kuralı gereği ertesi bar teyit kapanışı mutlaka beklenmelidir.`;
  } else {
    explanation = `İndirgenmiş tek mum (${reducedLabel}) kararsızlık/denge gösteriyor; kırılım yönünde teyit kapanışı izlenmelidir.`;
  }

  return {
    open,
    high,
    low,
    close,
    bodyPct,
    upperWickPct,
    lowerWickPct,
    isBullish,
    isDoji,
    reducedLabel,
    alignment,
    explanation,
  };
}

interface RawMatch {
  patternId: string;
  startIndex: number;
  endIndex: number;
  confirmationLevel: number;
  stopLossLevel: number;
}

export function detectAllRawPatterns(candles: Candle[], confirmBarCount: number, startFromIndex = 0): DetectedPattern[] {
  const detected: DetectedPattern[] = [];
  if (candles.length < 5) return detected;

  const minIdx = Math.max(2, startFromIndex);

  for (let i = minIdx; i < candles.length; i++) {
    const { avgBody, avgRange } = getLocalAverages(candles, i, 14);
    const tol = avgRange * 0.045;

    const isDojiBar = (c: Candle) => {
      const r = getRange(c);
      const b = getBody(c);
      return b <= r * 0.12 || b <= avgRange * 0.07;
    };
    const isWhite = (c: Candle) => c.close > c.open && !isDojiBar(c);
    const isBlack = (c: Candle) => c.close < c.open && !isDojiBar(c);
    const isShortBody = (c: Candle) => getBody(c) <= avgBody * 0.65;
    const isLongBody = (c: Candle) => getBody(c) >= avgBody * 1.05;
    const isMarubozuBar = (c: Candle) => getBody(c) >= getRange(c) * 0.84 && getBody(c) >= avgBody * 0.85;

    const matchesAtBar: RawMatch[] = [];

    const b0 = candles[i];
    const b1 = i >= 1 ? candles[i - 1] : null;
    const b2 = i >= 2 ? candles[i - 2] : null;
    const b3 = i >= 3 ? candles[i - 3] : null;
    const b4 = i >= 4 ? candles[i - 4] : null;

    const trend1 = getTrendContext(candles, i - 1);
    const trend2 = i >= 2 ? getTrendContext(candles, i - 2) : 'flat';
    const trend3 = i >= 3 ? getTrendContext(candles, i - 3) : 'flat';
    const trend4 = i >= 4 ? getTrendContext(candles, i - 4) : 'flat';
    const trend5 = i >= 5 ? getTrendContext(candles, i - 5) : 'flat';

    // -----------------------------------------------------------------------
    // 5-BAR GREG MORRIS REVERSAL & CONTINUATION PATTERNS (b4, b3, b2, b1, b0)
    // -----------------------------------------------------------------------
    if (b4 && b3 && b2 && b1) {
      // Rising Three Methods (Sakata Devam — Greg Morris s.86)
      if (
        trend5 === 'up' &&
        isWhite(b4) &&
        isLongBody(b4) &&
        getBody(b3) <= getBody(b4) * 0.65 &&
        getBody(b2) <= getBody(b4) * 0.65 &&
        getBody(b1) <= getBody(b4) * 0.65 &&
        Math.max(b3.high, b2.high, b1.high) <= b4.high + tol &&
        Math.min(b3.low, b2.low, b1.low) >= b4.low - tol &&
        b1.close < b3.open &&
        isWhite(b0) &&
        b0.close > b4.close + tol * 0.4
      ) {
        matchesAtBar.push({
          patternId: 'morris_rising_three_methods',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b4.low,
        });
      }

      // Falling Three Methods (Sakata Devam — Greg Morris s.86)
      if (
        trend5 === 'down' &&
        isBlack(b4) &&
        isLongBody(b4) &&
        getBody(b3) <= getBody(b4) * 0.65 &&
        getBody(b2) <= getBody(b4) * 0.65 &&
        getBody(b1) <= getBody(b4) * 0.65 &&
        Math.max(b3.high, b2.high, b1.high) <= b4.high + tol &&
        Math.min(b3.low, b2.low, b1.low) >= b4.low - tol &&
        b1.close > b3.open &&
        isBlack(b0) &&
        b0.close < b4.close - tol * 0.4
      ) {
        matchesAtBar.push({
          patternId: 'morris_falling_three_methods',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b4.high,
        });
      }

      // Mat Hold (Minder Tutuşu 5 Mum Devam — Greg Morris s.91)
      if (
        trend5 === 'up' &&
        isWhite(b4) &&
        isLongBody(b4) &&
        isBlack(b3) &&
        b3.open > b4.close - tol * 0.3 &&
        isShortBody(b3) &&
        isShortBody(b2) &&
        isShortBody(b1) &&
        Math.min(b3.low, b2.low, b1.low) >= getBodyMid(b4) - tol &&
        isWhite(b0) &&
        b0.close > Math.max(b4.high, b3.high)
      ) {
        matchesAtBar.push({
          patternId: 'morris_mat_hold',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b2.low, b1.low, getBodyMid(b4)),
        });
      }

      // Ladder Bottom (Merdiven Dip 5 Mum — Greg Morris s.74)
      if (
        trend5 === 'down' &&
        isBlack(b4) &&
        isBlack(b3) &&
        isBlack(b2) &&
        b3.close < b4.close &&
        b2.close < b3.close &&
        isBlack(b1) &&
        getUpperWick(b1) >= getBody(b1) * 0.9 &&
        isWhite(b0) &&
        b0.open > b1.open - tol * 0.5 &&
        b0.close > b2.open
      ) {
        matchesAtBar.push({
          patternId: 'morris_ladder_bottom',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // Bullish Breakaway (Boğa Kopuş 5 Mum — Greg Morris s.70)
      if (
        trend5 === 'down' &&
        isBlack(b4) &&
        isLongBody(b4) &&
        isBlack(b3) &&
        b3.open < b4.close - tol * 0.3 &&
        b2.low < b3.low &&
        isBlack(b1) &&
        b1.close < b2.close &&
        isWhite(b0) &&
        isLongBody(b0) &&
        b0.close > b3.open &&
        b0.close < b4.close + getBody(b4) * 0.5
      ) {
        matchesAtBar.push({
          patternId: 'morris_bullish_breakaway',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b1.low,
        });
      }

      // Bearish Breakaway (Ayı Kopuş 5 Mum — Greg Morris s.70)
      if (
        trend5 === 'up' &&
        isWhite(b4) &&
        isLongBody(b4) &&
        isWhite(b3) &&
        b3.open > b4.close + tol * 0.3 &&
        b2.high > b3.high &&
        isWhite(b1) &&
        b1.close > b2.close &&
        isBlack(b0) &&
        isLongBody(b0) &&
        b0.close < b3.open &&
        b0.close > b4.close - getBody(b4) * 0.5
      ) {
        matchesAtBar.push({
          patternId: 'morris_bearish_breakaway',
          startIndex: i - 4,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b1.high,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 4-BAR GREG MORRIS REVERSAL & CONTINUATION PATTERNS (b3, b2, b1, b0)
    // -----------------------------------------------------------------------
    if (b3 && b2 && b1) {
      // Concealing Baby Swallow (Gizlenen Yavru Kırlangıç — Greg Morris s.54)
      if (
        trend4 === 'down' &&
        isBlack(b3) &&
        isMarubozuBar(b3) &&
        isBlack(b2) &&
        isMarubozuBar(b2) &&
        isBlack(b1) &&
        b1.open < b2.close &&
        b1.high > b2.close &&
        isBlack(b0) &&
        b0.open >= b1.high - tol &&
        b0.close < b1.low
      ) {
        matchesAtBar.push({
          patternId: 'morris_concealing_baby_swallow',
          startIndex: i - 3,
          endIndex: i,
          confirmationLevel: getBodyMid(b0),
          stopLossLevel: b0.low,
        });
      }

      // Bullish Three-Line Strike (Üç Çizgi Darbesi Boğa Devam — Greg Morris s.93)
      if (
        isWhite(b3) &&
        isWhite(b2) &&
        isWhite(b1) &&
        b2.close > b3.close &&
        b1.close > b2.close &&
        isBlack(b0) &&
        b0.open >= b1.close - tol &&
        b0.close < b3.open
      ) {
        matchesAtBar.push({
          patternId: 'morris_bullish_three_line_strike',
          startIndex: i - 3,
          endIndex: i,
          confirmationLevel: Math.max(b1.high, b0.open),
          stopLossLevel: b0.low,
        });
      }

      // Bearish Three-Line Strike (Üç Çizgi Darbesi Ayı Devam — Greg Morris s.93)
      if (
        isBlack(b3) &&
        isBlack(b2) &&
        isBlack(b1) &&
        b2.close < b3.close &&
        b1.close < b2.close &&
        isWhite(b0) &&
        b0.open <= b1.close + tol &&
        b0.close > b3.open
      ) {
        matchesAtBar.push({
          patternId: 'morris_bearish_three_line_strike',
          startIndex: i - 3,
          endIndex: i,
          confirmationLevel: Math.min(b1.low, b0.open),
          stopLossLevel: b0.high,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 3-BAR PATTERNS (b2, b1, b0)
    // -----------------------------------------------------------------------
    if (b2 && b1) {
      // 16. Bullish Abandoned Baby (Terkedilmiş Bebek Boğa)
      const isAbandonedBaby =
        trend3 === 'down' &&
        isBlack(b2) &&
        getBody(b2) >= avgBody * 0.7 &&
        isDojiBar(b1) &&
        b1.high < b2.low &&
        b1.high < b0.low &&
        isWhite(b0) &&
        b0.close > b2.close + getBody(b2) * 0.3;

      if (isAbandonedBaby) {
        matchesAtBar.push({
          patternId: 'bullish_abandoned_baby',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 15. Bullish Morning Doji Star (Doji Sabah Yıldızı Boğa)
      if (
        !isAbandonedBaby &&
        trend3 === 'down' &&
        isBlack(b2) &&
        getBody(b2) >= avgBody * 0.75 &&
        isDojiBar(b1) &&
        getBodyTop(b1) <= b2.close + tol &&
        b1.low < b2.low &&
        isWhite(b0) &&
        b0.close >= b2.close + getBody(b2) * 0.35
      ) {
        matchesAtBar.push({
          patternId: 'bullish_morning_doji_star',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 14. Bullish Morning Star (Sabah Yıldızı Boğa)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        getBody(b2) >= avgBody * 0.75 &&
        !isDojiBar(b1) &&
        getBody(b1) <= avgBody * 0.55 &&
        getBodyTop(b1) <= b2.close + tol &&
        b1.low <= b2.low &&
        isWhite(b0) &&
        b0.close >= getBodyMid(b2)
      ) {
        matchesAtBar.push({
          patternId: 'bullish_morning_star',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 17. Bullish Tristar (Üç Yıldız Boğa)
      if (
        trend3 === 'down' &&
        isDojiBar(b2) &&
        isDojiBar(b1) &&
        isDojiBar(b0) &&
        b1.low <= b2.low &&
        b1.low <= b0.low
      ) {
        matchesAtBar.push({
          patternId: 'bullish_tristar',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 18. Bullish Downside Gap Two Rabbits (Aşağı Kopan İki Tavşan Boğa)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        getBody(b2) >= avgBody * 0.75 &&
        isWhite(b1) &&
        b1.open < b2.close - tol * 0.5 &&
        b1.close < b2.close &&
        isWhite(b0) &&
        b0.close > b1.close
      ) {
        matchesAtBar.push({
          patternId: 'bullish_downside_gap_two_rabbits',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 19. Bullish Unique Three River Bottom (Üçlü Vadi Boğa)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        isLongBody(b2) &&
        isBlack(b1) &&
        b1.open < b2.open &&
        b1.close > b2.close &&
        b1.low < b2.low &&
        getLowerWick(b1) >= getBody(b1) * 1.4 &&
        isWhite(b0) &&
        isShortBody(b0) &&
        b0.close < b1.close
      ) {
        matchesAtBar.push({
          patternId: 'bullish_unique_three_river_bottom',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 20. Bullish Three White Soldiers (Üç Beyaz Asker Boğa)
      if (
        trend3 === 'down' &&
        isWhite(b2) &&
        isWhite(b1) &&
        isWhite(b0) &&
        getBody(b2) >= avgBody * 0.65 &&
        getBody(b1) >= avgBody * 0.65 &&
        getBody(b0) >= avgBody * 0.65 &&
        b1.close > b2.close &&
        b0.close > b1.close &&
        b1.open >= b2.open - tol &&
        b1.open <= b2.close + tol &&
        b0.open >= b1.open - tol &&
        b0.open <= b1.close + tol &&
        getUpperWick(b0) <= getBody(b0) * 0.45
      ) {
        matchesAtBar.push({
          patternId: 'bullish_three_white_soldiers',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 21. Bullish Descent Block (Düşen Blok Boğa)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        isBlack(b1) &&
        isBlack(b0) &&
        b1.close < b2.close &&
        b0.close < b1.close &&
        getBody(b2) >= avgBody * 0.85 &&
        getBody(b0) < getBody(b2) * 0.85
      ) {
        matchesAtBar.push({
          patternId: 'bullish_descent_block',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: getBodyMid(b0),
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 35. Bearish Evening Star (Akşam Yıldızı Ayı — Trading Bible s.65)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        getBody(b2) >= avgBody * 0.9 &&
        isShortBody(b1) &&
        Math.min(b1.open, b1.close) >= b2.close - tol * 1.2 &&
        isBlack(b0) &&
        b0.close < getBodyMid(b2)
      ) {
        matchesAtBar.push({
          patternId: 'bible_evening_star',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.max(b2.high, b1.high, b0.high),
        });
      }

      // 36. Bullish Inside Bar False Breakout / Fakey (Boğa İç Bar Sahte Kırılım — Trading Bible s.138)
      if (
        getRange(b2) >= avgRange * 0.85 &&
        b1.high <= b2.high + tol * 0.3 &&
        b1.low >= b2.low - tol * 0.3 &&
        b0.low < b2.low - tol * 0.4 &&
        b0.close > b1.low &&
        b0.close >= getBodyMid(b2)
      ) {
        matchesAtBar.push({
          patternId: 'bible_bullish_inside_bar_fakey',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b2.high,
          stopLossLevel: b0.low,
        });
      }

      // 37. Bearish Inside Bar False Breakout / Fakey (Ayı İç Bar Boğa Tuzağı — Trading Bible s.138)
      if (
        getRange(b2) >= avgRange * 0.85 &&
        b1.high <= b2.high + tol * 0.3 &&
        b1.low >= b2.low - tol * 0.3 &&
        b0.high > b2.high + tol * 0.4 &&
        b0.close < b1.high &&
        b0.close <= getBodyMid(b2)
      ) {
        matchesAtBar.push({
          patternId: 'bible_bearish_inside_bar_fakey',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b2.low,
          stopLossLevel: b0.high,
        });
      }

      // --- GREG MORRIS 3-BAR REVERSALS & CONTINUATIONS ---
      // Three Inside Up (Üçlü İçten Yükseliş — Top-15, Greg Morris s.46)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        getBody(b2) >= avgBody * 0.85 &&
        isWhite(b1) &&
        b1.close < b2.open &&
        b1.open > b2.close &&
        isWhite(b0) &&
        b0.close > b2.open
      ) {
        matchesAtBar.push({
          patternId: 'morris_three_inside_up',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.min(b2.low, b1.low),
        });
      }

      // Three Outside Up (Üçlü Dıştan Yükseliş — Top-15, Greg Morris s.48)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        isWhite(b1) &&
        getBody(b1) > getBody(b2) * 1.05 &&
        b1.open <= b2.close + tol * 0.5 &&
        b1.close >= b2.open &&
        isWhite(b0) &&
        b0.close > b1.close
      ) {
        matchesAtBar.push({
          patternId: 'morris_three_outside_up',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b1.low,
        });
      }

      // Three Stars in the South (Güneydeki Üç Yıldız — Greg Morris s.50)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        getLowerWick(b2) >= getBody(b2) * 1.2 &&
        isBlack(b1) &&
        getBody(b1) < getBody(b2) &&
        b1.low > b2.low &&
        isBlack(b0) &&
        isShortBody(b0) &&
        b0.high <= b1.high + tol &&
        b0.low >= b1.low - tol
      ) {
        matchesAtBar.push({
          patternId: 'morris_three_stars_in_south',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.high,
          stopLossLevel: b2.low,
        });
      }

      // Stick Sandwich (Çubuk Sandviç — Greg Morris s.56)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        isWhite(b1) &&
        b1.open > b2.close &&
        isBlack(b0) &&
        b0.open > b1.close - tol &&
        Math.abs(b0.close - b2.close) <= tol * 1.3
      ) {
        matchesAtBar.push({
          patternId: 'morris_stick_sandwich',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: Math.max(b1.close, getBodyMid(b0)),
          stopLossLevel: Math.min(b2.low, b0.low),
        });
      }

      // Three Inside Down (Üçlü İçten Düşüş — Greg Morris s.46)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        getBody(b2) >= avgBody * 0.85 &&
        isBlack(b1) &&
        b1.open < b2.close &&
        b1.close > b2.open &&
        isBlack(b0) &&
        b0.close < b2.open
      ) {
        matchesAtBar.push({
          patternId: 'morris_three_inside_down',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.max(b2.high, b1.high),
        });
      }

      // Three Outside Down (Üçlü Dıştan Düşüş — Top-15, Greg Morris s.48)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        isBlack(b1) &&
        getBody(b1) > getBody(b2) * 1.05 &&
        b1.open >= b2.close - tol * 0.5 &&
        b1.close <= b2.open &&
        isBlack(b0) &&
        b0.close < b1.close
      ) {
        matchesAtBar.push({
          patternId: 'morris_three_outside_down',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b1.high,
        });
      }

      // Bearish Abandoned Baby (Terkedilmiş Bebek Ayı — Greg Morris s.43)
      const isBearishAbandoned =
        trend3 === 'up' &&
        isWhite(b2) &&
        getBody(b2) >= avgBody * 0.7 &&
        isDojiBar(b1) &&
        b1.low > b2.high &&
        b1.low > b0.high &&
        isBlack(b0) &&
        b0.close < b2.close - getBody(b2) * 0.3;

      if (isBearishAbandoned) {
        matchesAtBar.push({
          patternId: 'morris_bearish_abandoned_baby',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // Evening Doji Star (Doji Akşam Yıldızı — Greg Morris s.41)
      if (
        !isBearishAbandoned &&
        trend3 === 'up' &&
        isWhite(b2) &&
        getBody(b2) >= avgBody * 0.75 &&
        isDojiBar(b1) &&
        getBodyBottom(b1) >= b2.close - tol &&
        b1.high > b2.high &&
        isBlack(b0) &&
        b0.close <= getBodyMid(b2)
      ) {
        matchesAtBar.push({
          patternId: 'morris_evening_doji_star',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // Upside Gap Two Crows (Yukarı Boşluklu İki Karga — Greg Morris s.45)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        isLongBody(b2) &&
        isBlack(b1) &&
        b1.close > b2.close + tol * 0.25 &&
        isBlack(b0) &&
        b0.open > b1.open &&
        b0.close < b1.close &&
        b0.close > b2.close
      ) {
        matchesAtBar.push({
          patternId: 'morris_upside_gap_two_crows',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b2.close,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // Advance Block (İlerleyen Blok — Greg Morris s.52)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        isWhite(b1) &&
        isWhite(b0) &&
        b1.close > b2.close &&
        b0.close > b1.close &&
        getBody(b2) > getBody(b1) * 1.05 &&
        getBody(b1) >= getBody(b0) &&
        getUpperWick(b1) >= getBody(b1) * 0.55 &&
        getUpperWick(b0) >= getBody(b0) * 0.65
      ) {
        matchesAtBar.push({
          patternId: 'morris_advance_block',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b0.low,
          stopLossLevel: b0.high,
        });
      }

      // Deliberation / Stalled (Tereddüt — Greg Morris s.53)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        getBody(b2) >= avgBody * 0.8 &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.85 &&
        b1.close > b2.close &&
        isWhite(b0) &&
        getBody(b0) <= avgBody * 0.42 &&
        b0.open >= b1.close - tol * 1.1
      ) {
        matchesAtBar.push({
          patternId: 'morris_deliberation',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: getBodyMid(b1),
          stopLossLevel: b0.high,
        });
      }

      // Identical Three Crows & Three Black Crows (Üç Kara Karga — Top-15 #1, Greg Morris s.58 & s.68)
      if (
        trend3 === 'up' &&
        isBlack(b2) &&
        isBlack(b1) &&
        isBlack(b0) &&
        getBody(b2) >= avgBody * 0.65 &&
        getBody(b1) >= avgBody * 0.65 &&
        getBody(b0) >= avgBody * 0.65 &&
        b1.close < b2.close &&
        b0.close < b1.close &&
        getLowerWick(b0) <= getBody(b0) * 0.45
      ) {
        const isIdentical =
          Math.abs(b1.open - b2.close) <= tol * 1.1 && Math.abs(b0.open - b1.close) <= tol * 1.1;
        if (isIdentical) {
          matchesAtBar.push({
            patternId: 'morris_identical_three_crows',
            startIndex: i - 2,
            endIndex: i,
            confirmationLevel: b0.close,
            stopLossLevel: b1.high,
          });
        } else if (
          b1.open <= b2.open + tol &&
          b1.open >= b2.close - tol &&
          b0.open <= b1.open + tol &&
          b0.open >= b1.close - tol
        ) {
          matchesAtBar.push({
            patternId: 'morris_three_black_crows',
            startIndex: i - 2,
            endIndex: i,
            confirmationLevel: b0.close,
            stopLossLevel: b1.high,
          });
        }
      }

      // Upside Tasuki Gap (Yukarı Tasuki Boşluğu Devam — Greg Morris s.80)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        isWhite(b1) &&
        b1.open > b2.close + tol * 0.5 &&
        isBlack(b0) &&
        b0.open < b1.close &&
        b0.open > b1.open &&
        b0.close < b1.open &&
        b0.close > b2.close
      ) {
        matchesAtBar.push({
          patternId: 'morris_upside_tasuki_gap',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b1.close,
          stopLossLevel: b2.close,
        });
      }

      // Downside Tasuki Gap (Aşağı Tasuki Boşluğu Devam — Greg Morris s.80)
      if (
        trend3 === 'down' &&
        isBlack(b2) &&
        isBlack(b1) &&
        b1.open < b2.close - tol * 0.5 &&
        isWhite(b0) &&
        b0.open > b1.close &&
        b0.open < b1.open &&
        b0.close > b1.open &&
        b0.close < b2.close
      ) {
        matchesAtBar.push({
          patternId: 'morris_downside_tasuki_gap',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: b1.close,
          stopLossLevel: b2.close,
        });
      }

      // Side-by-Side White Lines (Yan Yana Beyaz Çizgiler Devam — Greg Morris s.82)
      if (
        trend3 === 'up' &&
        isWhite(b2) &&
        isWhite(b1) &&
        isWhite(b0) &&
        b1.open > b2.close + tol * 0.4 &&
        Math.abs(b0.open - b1.open) <= tol * 1.5 &&
        Math.abs(getBody(b0) - getBody(b1)) <= avgBody * 0.35
      ) {
        matchesAtBar.push({
          patternId: 'morris_side_by_side_white_bull',
          startIndex: i - 2,
          endIndex: i,
          confirmationLevel: Math.max(b1.high, b0.high),
          stopLossLevel: b2.high,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 2-BAR BULLISH PATTERNS (b1, b0)
    // -----------------------------------------------------------------------
    if (b1) {
      // 12. Bullish Kicking (Tepen Mumlar Boğa)
      if (isBlack(b1) && isMarubozuBar(b1) && isWhite(b0) && isMarubozuBar(b0) && b0.open >= b1.open - tol) {
        matchesAtBar.push({
          patternId: 'bullish_kicking',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 3. Bullish Engulfing (Yutan Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        isWhite(b0) &&
        getBody(b0) > getBody(b1) * 1.08 &&
        b0.open <= b1.close + tol * 0.5 &&
        b0.close >= b1.open &&
        (b0.open < b1.close || b0.close > b1.open)
      ) {
        matchesAtBar.push({
          patternId: 'bullish_engulfing',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 4. Bullish Harami (Hamile Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.85 &&
        isWhite(b0) &&
        b0.close < b1.open &&
        b0.open > b1.close
      ) {
        matchesAtBar.push({
          patternId: 'bullish_harami',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.max(b0.close, getBodyMid(b1)),
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 5. Bullish Harami Cross (Kros Hamile Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isDojiBar(b0) &&
        getBodyTop(b0) <= b1.open &&
        getBodyBottom(b0) >= b1.close
      ) {
        const conf = isShortBody(b1) ? b1.open : Math.max(b0.close, getBodyMid(b1));
        matchesAtBar.push({
          patternId: 'bullish_harami_cross',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: conf,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 6. Bullish Inverted Hammer (Ters Çekiç Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.6 &&
        getRange(b0) >= avgRange * 0.55 &&
        getUpperWick(b0) >= Math.max(getBody(b0) * 2, getRange(b0) * 0.58) &&
        getLowerWick(b0) <= getRange(b0) * 0.16
      ) {
        matchesAtBar.push({
          patternId: 'bullish_inverted_hammer',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: getBodyTop(b0) + getUpperWick(b0) / 2,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 7. Bullish Piercing Line (Delen Mumlar Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.8 &&
        isWhite(b0) &&
        (b0.open < b1.close - tol * 0.25 || (b0.open <= b1.close + tol * 0.2 && b0.low < b1.low - tol)) &&
        b0.close > getBodyMid(b1) &&
        b0.close < b1.open
      ) {
        matchesAtBar.push({
          patternId: 'bullish_piercing_line',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 8. Bullish Doji Star (Doji Yıldız Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.8 &&
        isDojiBar(b0) &&
        getBodyTop(b0) < b1.close - tol * 0.2
      ) {
        matchesAtBar.push({
          patternId: 'bullish_doji_star',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: (b1.close + getBodyTop(b0)) / 2,
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 9. Bullish Meeting Line (Değen Mumlar Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.75 &&
        isWhite(b0) &&
        getBody(b0) >= avgBody * 0.65 &&
        b0.open < b1.close - avgBody * 0.5 &&
        Math.abs(b0.close - b1.close) <= tol * 1.1
      ) {
        matchesAtBar.push({
          patternId: 'bullish_meeting_line',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 10. Bullish Homing Pigeon (Güvercin Yuvası Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        isLongBody(b1) &&
        isBlack(b0) &&
        b0.open < b1.open &&
        b0.close > b1.close
      ) {
        matchesAtBar.push({
          patternId: 'bullish_homing_pigeon',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.max(b0.close, getBodyMid(b1)),
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 11. Bullish Matching Low (Çakışan Dip Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isBlack(b0) &&
        Math.abs(b0.close - b1.close) <= tol
      ) {
        matchesAtBar.push({
          patternId: 'bullish_matching_low',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: getBodyMid(b1),
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 13. Bullish One White Soldier (Beyaz Asker Boğa)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isWhite(b0) &&
        b0.open > b1.close + tol * 0.25 &&
        b0.close > b1.open
      ) {
        matchesAtBar.push({
          patternId: 'bullish_one_white_soldier',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // ---------------------------------------------------------------------
      // 2-BAR BEARISH PATTERNS (b1, b0)
      // ---------------------------------------------------------------------
      // 33. Bearish Kicking (Tepen Mumlar Ayı)
      if (isWhite(b1) && isMarubozuBar(b1) && isBlack(b0) && isMarubozuBar(b0) && b0.open <= b1.open + tol) {
        matchesAtBar.push({
          patternId: 'bearish_kicking',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // 24. Bearish Engulfing (Yutan Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        isBlack(b0) &&
        getBody(b0) > getBody(b1) * 1.08 &&
        b0.open >= b1.close - tol * 0.5 &&
        b0.close <= b1.open &&
        (b0.open > b1.close || b0.close < b1.open)
      ) {
        matchesAtBar.push({
          patternId: 'bearish_engulfing',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // 25. Bearish Harami (Hamile Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.85 &&
        isBlack(b0) &&
        b0.open < b1.close &&
        b0.close > b1.open
      ) {
        matchesAtBar.push({
          patternId: 'bearish_harami',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.min(b0.close, getBodyMid(b1)),
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 26. Bearish Harami Cross (Kros Hamile Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isDojiBar(b0) &&
        getBodyTop(b0) <= b1.close &&
        getBodyBottom(b0) >= b1.open
      ) {
        const conf = isShortBody(b1) ? b1.open : Math.min(b0.close, getBodyMid(b1));
        matchesAtBar.push({
          patternId: 'bearish_harami_cross',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: conf,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 27. Bearish Shooting Star (Kayan Yıldız Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.55 &&
        getRange(b0) >= avgRange * 0.55 &&
        b0.high > b1.high &&
        getUpperWick(b0) >= Math.max(getBody(b0) * 2, getRange(b0) * 0.58) &&
        getLowerWick(b0) <= getRange(b0) * 0.16
      ) {
        matchesAtBar.push({
          patternId: 'bearish_shooting_star',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: getBodyBottom(b0),
          stopLossLevel: b0.high,
        });
      }

      // 28. Bearish Dark Cloud Cover (Kara Bulut Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.8 &&
        isBlack(b0) &&
        (b0.open > b1.close + tol * 0.25 || (b0.open >= b1.close - tol * 0.2 && b0.high > b1.high + tol)) &&
        b0.close < getBodyMid(b1) &&
        b0.close > b1.open
      ) {
        matchesAtBar.push({
          patternId: 'bearish_dark_cloud_cover',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // 29. Bearish Doji Star (Doji Yıldız Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.8 &&
        isDojiBar(b0) &&
        getBodyBottom(b0) > b1.close + tol * 0.2
      ) {
        matchesAtBar.push({
          patternId: 'bearish_doji_star',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: (b1.close + getBodyBottom(b0)) / 2,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 30. Bearish Meeting Line (Değen Mumlar Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.75 &&
        isBlack(b0) &&
        getBody(b0) >= avgBody * 0.65 &&
        b0.open > b1.close + avgBody * 0.5 &&
        Math.abs(b0.close - b1.close) <= tol * 1.1
      ) {
        matchesAtBar.push({
          patternId: 'bearish_meeting_line',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // 31. Bearish Descending Hawk (İnen Şahin Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        isLongBody(b1) &&
        isWhite(b0) &&
        b0.open > b1.open &&
        b0.close < b1.close
      ) {
        matchesAtBar.push({
          patternId: 'bearish_descending_hawk',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.min(b0.close, getBodyMid(b1)),
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 32. Bearish Matching High (Çakışan Tepe Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isWhite(b0) &&
        Math.abs(b0.close - b1.close) <= tol
      ) {
        matchesAtBar.push({
          patternId: 'bearish_matching_high',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: getBodyMid(b1),
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 34. Bearish One Black Crow (Kara Karga Ayı)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.65 &&
        isBlack(b0) &&
        b0.open < b1.close - tol * 0.25 &&
        b0.close < b1.open
      ) {
        matchesAtBar.push({
          patternId: 'bearish_one_black_crow',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // 38. Tweezer Bottom (Cımbız Dip Boğa — Trading Bible s.69)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        isWhite(b0) &&
        Math.abs(b1.low - b0.low) <= tol * 1.15 &&
        getRange(b1) >= avgRange * 0.6 &&
        getRange(b0) >= avgRange * 0.6 &&
        b0.close >= getBodyMid(b1)
      ) {
        matchesAtBar.push({
          patternId: 'bible_tweezer_bottom',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.max(b1.high, b0.close),
          stopLossLevel: Math.min(b1.low, b0.low),
        });
      }

      // 39. Tweezer Top (Cımbız Tepe Ayı — Trading Bible s.68)
      if (
        trend2 === 'up' &&
        isWhite(b1) &&
        isBlack(b0) &&
        Math.abs(b1.high - b0.high) <= tol * 1.15 &&
        getRange(b1) >= avgRange * 0.6 &&
        getRange(b0) >= avgRange * 0.6 &&
        b0.close <= getBodyMid(b1)
      ) {
        matchesAtBar.push({
          patternId: 'bible_tweezer_top',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: Math.min(b1.low, b0.close),
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // --- GREG MORRIS 2-BAR CONTINUATION PATTERNS ---
      // Bullish Separating Lines (Ayıran Çizgiler Boğa Devam — Greg Morris s.89)
      if (
        trend2 === 'up' &&
        isBlack(b1) &&
        getBody(b1) >= avgBody * 0.6 &&
        isWhite(b0) &&
        getBody(b0) >= avgBody * 0.75 &&
        Math.abs(b0.open - b1.open) <= tol * 1.1 &&
        getLowerWick(b0) <= getRange(b0) * 0.14
      ) {
        matchesAtBar.push({
          patternId: 'morris_bullish_separating_lines',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // Bearish Separating Lines (Ayıran Çizgiler Ayı Devam — Greg Morris s.89)
      if (
        trend2 === 'down' &&
        isWhite(b1) &&
        getBody(b1) >= avgBody * 0.6 &&
        isBlack(b0) &&
        getBody(b0) >= avgBody * 0.75 &&
        Math.abs(b0.open - b1.open) <= tol * 1.1 &&
        getUpperWick(b0) <= getRange(b0) * 0.14
      ) {
        matchesAtBar.push({
          patternId: 'morris_bearish_separating_lines',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }

      // In Neck Line (Boyun İçi Çizgisi Ayı Devam — Greg Morris s.98)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        isLongBody(b1) &&
        isWhite(b0) &&
        b0.open < b1.low &&
        b0.close >= b1.close &&
        b0.close <= b1.close + getBody(b1) * 0.12
      ) {
        matchesAtBar.push({
          patternId: 'morris_in_neck_line',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.low,
          stopLossLevel: getBodyMid(b1),
        });
      }

      // Thrusting Line (Saplama Çizgisi Ayı Devam: <%50 gövde — Greg Morris s.99)
      if (
        trend2 === 'down' &&
        isBlack(b1) &&
        isLongBody(b1) &&
        isWhite(b0) &&
        b0.open < b1.low - tol * 0.2 &&
        b0.close > b1.close + getBody(b1) * 0.13 &&
        b0.close < getBodyMid(b1) - tol * 0.2
      ) {
        matchesAtBar.push({
          patternId: 'morris_thrusting_line',
          startIndex: i - 1,
          endIndex: i,
          confirmationLevel: b0.low,
          stopLossLevel: getBodyMid(b1),
        });
      }
    }

    // -----------------------------------------------------------------------
    // 1-BAR PATTERNS (b0) — checked if a multi-bar pattern didn't already claim this exact bar
    // -----------------------------------------------------------------------
    if (matchesAtBar.length === 0) {
      // 40. Dragonfly Doji (Yusufçuk Doji Boğa — Trading Bible s.47)
      if (
        trend1 === 'down' &&
        getRange(b0) >= avgRange * 0.65 &&
        isDojiBar(b0) &&
        getLowerWick(b0) >= getRange(b0) * 0.68 &&
        getUpperWick(b0) <= getRange(b0) * 0.14
      ) {
        matchesAtBar.push({
          patternId: 'bible_dragonfly_doji',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.high,
          stopLossLevel: b0.low,
        });
      }

      // 41. Gravestone Doji (Mezar Taşı Doji Ayı — Trading Bible s.50)
      if (
        trend1 === 'up' &&
        getRange(b0) >= avgRange * 0.65 &&
        isDojiBar(b0) &&
        getUpperWick(b0) >= getRange(b0) * 0.68 &&
        getLowerWick(b0) <= getRange(b0) * 0.14
      ) {
        matchesAtBar.push({
          patternId: 'bible_gravestone_doji',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.low,
          stopLossLevel: b0.high,
        });
      }

      // 42. Bullish Pin Bar (Boğa Pin Bar Kuyruk Reddi — Trading Bible s.76)
      if (
        b1 &&
        getRange(b0) >= avgRange * 0.85 &&
        !isDojiBar(b0) &&
        b0.low < b1.low - tol * 0.4 &&
        getLowerWick(b0) >= getRange(b0) * 0.66 &&
        getBody(b0) <= getRange(b0) * 0.28 &&
        getUpperWick(b0) <= getRange(b0) * 0.12
      ) {
        matchesAtBar.push({
          patternId: 'bible_bullish_pin_bar',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.high,
          stopLossLevel: b0.low,
        });
      }

      // 43. Bearish Pin Bar (Ayı Pin Bar Kuyruk Reddi — Trading Bible s.78)
      if (
        b1 &&
        getRange(b0) >= avgRange * 0.85 &&
        !isDojiBar(b0) &&
        b0.high > b1.high + tol * 0.4 &&
        getUpperWick(b0) >= getRange(b0) * 0.66 &&
        getBody(b0) <= getRange(b0) * 0.28 &&
        getLowerWick(b0) <= getRange(b0) * 0.12
      ) {
        matchesAtBar.push({
          patternId: 'bible_bearish_pin_bar',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.low,
          stopLossLevel: b0.high,
        });
      }

      // Greg Morris Takuri Line (taguri — Alt gölge >= 3x gövde, üst gölgesiz derin dip yoklama, s.24)
      if (
        matchesAtBar.length === 0 &&
        trend1 === 'down' &&
        getRange(b0) >= avgRange * 0.65 &&
        !isDojiBar(b0) &&
        getLowerWick(b0) >= getBody(b0) * 3.0 &&
        getUpperWick(b0) <= getRange(b0) * 0.06
      ) {
        matchesAtBar.push({
          patternId: 'morris_takuri_line',
          startIndex: i,
          endIndex: i,
          confirmationLevel: getBodyTop(b0),
          stopLossLevel: b0.low,
        });
      }

      // 1. Bullish Hammer (Çekiç Boğa)
      if (
        matchesAtBar.length === 0 &&
        trend1 === 'down' &&
        getRange(b0) >= avgRange * 0.55 &&
        !isDojiBar(b0) &&
        getLowerWick(b0) >= getBody(b0) * 2.1 &&
        getLowerWick(b0) >= getRange(b0) * 0.58 &&
        getUpperWick(b0) <= getRange(b0) * 0.15
      ) {
        matchesAtBar.push({
          patternId: 'bullish_hammer',
          startIndex: i,
          endIndex: i,
          confirmationLevel: getBodyTop(b0),
          stopLossLevel: b0.low,
        });
      }

      // 2. Bullish Belt Hold (Belden Tutma Boğa)
      if (
        matchesAtBar.length === 0 &&
        trend1 === 'down' &&
        isWhite(b0) &&
        getBody(b0) >= avgBody * 1.15 &&
        getBody(b0) >= getRange(b0) * 0.78 &&
        getLowerWick(b0) <= getRange(b0) * 0.05 &&
        getUpperWick(b0) <= getRange(b0) * 0.18
      ) {
        matchesAtBar.push({
          patternId: 'bullish_belt_hold',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.low,
        });
      }

      // 22. Bearish Hanging Man (Asılı Adam Ayı)
      if (
        matchesAtBar.length === 0 &&
        b1 &&
        trend1 === 'up' &&
        getRange(b0) >= avgRange * 0.55 &&
        !isDojiBar(b0) &&
        getLowerWick(b0) >= getBody(b0) * 2.1 &&
        getLowerWick(b0) >= getRange(b0) * 0.58 &&
        getUpperWick(b0) <= getRange(b0) * 0.15
      ) {
        matchesAtBar.push({
          patternId: 'bearish_hanging_man',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.low + getLowerWick(b0) / 2,
          stopLossLevel: Math.max(b1.high, b0.high),
        });
      }

      // 23. Bearish Belt Hold (Belden Tutma Ayı)
      if (
        matchesAtBar.length === 0 &&
        trend1 === 'up' &&
        isBlack(b0) &&
        getBody(b0) >= avgBody * 1.15 &&
        getBody(b0) >= getRange(b0) * 0.78 &&
        getUpperWick(b0) <= getRange(b0) * 0.05 &&
        getLowerWick(b0) <= getRange(b0) * 0.18
      ) {
        matchesAtBar.push({
          patternId: 'bearish_belt_hold',
          startIndex: i,
          endIndex: i,
          confirmationLevel: b0.close,
          stopLossLevel: b0.high,
        });
      }
    }

    for (const raw of matchesAtBar) {
      const def = PATTERN_MAP[raw.patternId];
      if (!def) continue;

      let highBound = -Infinity;
      let lowBound = Infinity;
      for (let k = raw.startIndex; k <= raw.endIndex; k++) {
        if (candles[k].high > highBound) highBound = candles[k].high;
        if (candles[k].low < lowBound) lowBound = candles[k].low;
      }

      const lifecycle = evaluatePatternLifecycle(
        candles,
        raw.endIndex,
        def.direction,
        raw.confirmationLevel,
        raw.stopLossLevel,
        confirmBarCount
      );

      const role: PatternRole = def.patternType ?? 'reversal';
      const breakdown =
        raw.endIndex > raw.startIndex
          ? computePatternBreakdown(candles, raw.startIndex, raw.endIndex, def.direction, role)
          : undefined;

      detected.push({
        id: `${raw.patternId}_${candles[raw.endIndex].time}_${raw.endIndex}`,
        patternId: raw.patternId,
        englishName: def.englishName,
        turkishName: def.turkishName,
        japaneseName: def.japaneseName,
        direction: def.direction,
        patternType: role,
        sourceBook: def.sourceBook ?? 'Matriks',
        isTopPerformer: def.isTopPerformer,
        barCount: def.barCount,
        startIndex: raw.startIndex,
        endIndex: raw.endIndex,
        time: candles[raw.endIndex].time,
        confirmationLevel: raw.confirmationLevel,
        stopLossLevel: raw.stopLossLevel,
        highBound,
        lowBound,
        status: lifecycle.status,
        confirmedAtIndex: lifecycle.confirmedAtIndex,
        failedAtIndex: lifecycle.failedAtIndex,
        summary: def.summary,
        confirmationRule: def.confirmationRule,
        stopLossRule: def.stopLossRule,
        breakdown,
      });
    }
  }

  return detected;
}

export function detectPatterns(candles: Candle[], settings: PatternSettings): DetectedPattern[] {
  const startFrom =
    settings.barRegion === 'lastN' ? Math.max(0, candles.length - settings.lastNCount) : 0;

  const all = detectAllRawPatterns(candles, settings.confirmBarCount, startFrom);

  return all.filter(
    (p) =>
      settings.enabledPatterns[p.patternId] &&
      settings.showStatuses[p.status] &&
      settings.showRoles[p.patternType]
  );
}

export function createDefaultPatternSettings(): PatternSettings {
  const enabledPatterns: Record<string, boolean> = {};
  for (const p of PATTERNS_CATALOG) {
    enabledPatterns[p.id] = true;
  }
  return {
    enabledPatterns,
    confirmBarCount: 3,
    showStatuses: {
      not_confirmed: true,
      confirmed: true,
      confirmed_fail: true,
    },
    showRoles: {
      reversal: true,
      continuation: true,
    },
    onlyMorrisFiltered: false,
    barRegion: 'lastN',
    lastNCount: 500,
    colorMode: 'direction',
    candleStyle: 'modern',
    candlePower: false,
    showEMA10: true,
    showEMA20: true,
    showEMA50: false,
    showVolume: true,
    showSRZones: true,
    showSupplyDemand: true,
    showMA8_21: true,
    showTrendChannel: true,
    showGeometric: true,
    showFibonacci: false,
    showBollinger: false,
    useAdaptiveBollinger: false,
    showKeltner: false,
    showMACD: true,
    showMorrisFilter: false,
  };
}
