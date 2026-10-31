export interface Candle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type MarketCategory = 'crypto' | 'bist' | 'forex';
export type MarketSource = 'binance' | 'yahoo';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface MarketInstrument {
  id: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  category: MarketCategory;
  source: MarketSource;
  decimals: number;
  currency: string;
}

export type PatternDirection = 'bullish' | 'bearish';
export type PatternRole = 'reversal' | 'continuation';
export type PatternStatus = 'not_confirmed' | 'confirmed' | 'confirmed_fail';
export type PatternSourceBook = 'Matriks' | 'Trading Bible' | 'Greg Morris';

export interface SchematicBar {
  open: number;
  high: number;
  low: number;
  close: number;
  inBox?: boolean;
}

export interface PatternDefinition {
  id: string;
  englishName: string;
  turkishName: string;
  japaneseName?: string; // Romanji name from Greg Morris
  direction: PatternDirection;
  patternType?: PatternRole; // Default 'reversal'
  barCount: 1 | 2 | 3 | 4 | 5;
  pdfPage: number;
  sourceBook?: PatternSourceBook;
  isTopPerformer?: boolean; // Greg Morris Chapter 7 consistent Top-15 performer
  summary: string;
  confirmationRule: string;
  stopLossRule: string;
  schematic: {
    bars: SchematicBar[];
    confirmY: number;
    stopY: number;
  };
}

export interface PatternBreakdownInfo {
  open: number;
  high: number;
  low: number;
  close: number;
  bodyPct: number;
  upperWickPct: number;
  lowerWickPct: number;
  isBullish: boolean;
  isDoji: boolean;
  reducedLabel: string;
  alignment: 'supports' | 'conflicts' | 'neutral';
  explanation: string;
}

export interface MorrisFilterStatus {
  isFilteredSignal: boolean; // True when pattern fires in RSI / Stochastic / %B pre-signal zone
  ema10Aligned: boolean;
  rsiAtSignal: number | null;
  stochDAtSignal: number | null;
  bollingerPctBAtSignal: number | null;
  triggerSummary: string;
}

export interface SetupConfluencePlan {
  confluenceScore: number; // 0..5
  confluenceFactors: string[];
  aggressiveEntry: number; // Close of signal bar
  conservativeEntry: number; // 50% retracement of signal bar range (Bible p.93-95)
  protectiveStop: number;
  nextTargetPrice: number;
  rrAggressive: number;
  rrConservative: number;
  meetsTwoToOneRule: boolean;
  isCounterTrendWarning: boolean;
  isChoppyMarketWarning: boolean;
}

export interface DetectedPattern {
  id: string;
  patternId: string;
  englishName: string;
  turkishName: string;
  japaneseName?: string;
  direction: PatternDirection;
  patternType: PatternRole;
  sourceBook: PatternSourceBook;
  isTopPerformer?: boolean;
  barCount: 1 | 2 | 3 | 4 | 5;
  startIndex: number;
  endIndex: number;
  time: number;
  confirmationLevel: number;
  stopLossLevel: number;
  highBound: number;
  lowBound: number;
  status: PatternStatus;
  confirmedAtIndex: number | null;
  failedAtIndex: number | null;
  summary: string;
  confirmationRule: string;
  stopLossRule: string;
  breakdown?: PatternBreakdownInfo;
  morrisFilter?: MorrisFilterStatus;
  confluencePlan?: SetupConfluencePlan;
}

export interface CandleAnatomy {
  index: number;
  candle: Candle;
  prevCandle: Candle | null;
  bodySize: number;
  bodyPct: number;
  upperWick: number;
  upperWickPct: number;
  lowerWick: number;
  lowerWickPct: number;
  totalRange: number;
  changeAbs: number;
  changePct: number;
  isBullish: boolean;
  isBearish: boolean;
  isDoji: boolean;
  isMarubozu: boolean;
  candleTypeLabel: string;
  pressureLabel: string;
  trendLabel: 'Yükseliş Eğilimi' | 'Düşüş Eğilimi' | 'Yatay Denge';
  volumeRatio: number;
  readingNotes: string[];
}

// ============================================================================
// GRAFİK OKUMA, TRADING BIBLE & GREG MORRIS YAPI TİPLERİ
// ============================================================================

export interface SupportResistanceZone {
  id: string;
  centerPrice: number;
  lowBound: number;
  highBound: number;
  touches: number;
  role: 'support' | 'resistance';
  polarityFlipped: boolean;
  lastTouchIndex: number;
}

export interface SupplyDemandZone {
  id: string;
  kind: 'demand' | 'supply';
  turkishLabel: string;
  lowBound: number;
  highBound: number;
  originIndex: number;
  departureStrength: number;
  fresh: boolean;
}

export interface SwingStructureTag {
  index: number;
  price: number;
  tag: 'HH' | 'HL' | 'LH' | 'LL';
  kind: 'high' | 'low';
}

export interface MarketRegimeInfo {
  regime: 'uptrend' | 'downtrend' | 'ranging' | 'choppy';
  turkishTitle: string;
  wavePhase: 'impulsive' | 'retracement' | 'range_boundary' | 'range_middle' | 'choppy_noise';
  waveLabel: string;
  actionAdvice: string;
  swingTags: SwingStructureTag[];
}

export interface TopDownSummary {
  higherTimeframe: Timeframe;
  higherTimeframeLabel: string;
  htfRegime: 'uptrend' | 'downtrend' | 'ranging' | 'choppy';
  htfRegimeLabel: string;
  htfLastCandleBullish: boolean;
  nearHtfResistance: boolean;
  nearHtfSupport: boolean;
  htfKeyResistance: number | null;
  htfKeySupport: number | null;
  alignmentNote: string;
}

export interface TrendChannelInfo {
  direction: 'uptrend' | 'downtrend' | 'horizontal';
  label: string;
  startIndex: number;
  endIndex: number;
  primaryStartPrice: number;
  primaryEndPrice: number;
  channelStartPrice: number;
  channelEndPrice: number;
  touchCount: number;
  isValidatedByThreePoints: boolean;
  isSteepWarning: boolean;
}

export type GeometricStructureType =
  | 'symmetrical_triangle'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'rising_wedge'
  | 'falling_wedge';

export interface GeometricStructure {
  type: GeometricStructureType;
  turkishName: string;
  bias: 'bullish' | 'bearish' | 'neutral_breakout';
  startIndex: number;
  endIndex: number;
  upperStartPrice: number;
  upperEndPrice: number;
  lowerStartPrice: number;
  lowerEndPrice: number;
  mouthHeight: number;
  projectedTargetUp: number;
  projectedTargetDown: number;
  breakoutState: 'forming' | 'broken_up' | 'broken_down';
  description: string;
}

export type GapType = 'breakaway' | 'runaway' | 'exhaustion' | 'island_reversal';

export interface GapSignal {
  index: number;
  time: number;
  type: GapType;
  turkishName: string;
  direction: 'bullish' | 'bearish';
  gapLow: number;
  gapHigh: number;
  note: string;
}

export interface FibonacciLevel {
  ratio: number;
  label: string;
  price: number;
}

export interface FibonacciGrid {
  trendMode: 'uptrend' | 'downtrend';
  swingStartIndex: number;
  swingEndIndex: number;
  swingLow: number;
  swingHigh: number;
  levels: FibonacciLevel[];
  nearestSupport: FibonacciLevel | null;
  nearestResistance: FibonacciLevel | null;
}

export interface BollingerPoint {
  middle: number | null;
  upper: number | null;
  lower: number | null;
  pctB: number | null; // Bollinger %B (Morris Chapter 8)
  bandWidthPct: number | null; // (Upper - Lower) / Middle * 100 (Squeeze vs Expansion)
}

export interface BollingerStrategySummary {
  bandWidthPct: number | null;
  volatilityRegime: 'squeeze' | 'expanding' | 'walking_upper' | 'walking_lower' | 'normal';
  volatilityLabel: string;
  walkingBandWarning: string | null;
  oppositeBandExhaustionWarning: string | null;
  bandPattern: {
    kind: 'w_bottom' | 'm_top' | 'three_pushes_high';
    label: string;
    barIndex: number;
  } | null;
  bbmaSignal: {
    state: 'bullish_cross' | 'bearish_cross' | 'bullish_trend' | 'bearish_trend' | 'neutral';
    label: string;
    crossIndex: number | null;
    crossPrice: number | null;
    barsSinceCross: number | null;
  };
  rsiBbSetup: {
    state: 'buy_triggered' | 'sell_triggered' | 'buy_armed' | 'sell_armed' | 'none';
    label: string;
    triggerIndex: number | null;
    entryPrice: number | null;
    stopLoss: number | null;
    targetPrice: number | null;
  };
}

export interface EmpiricalBollingerOptimization {
  skewness: number; // 3rd Moment of Returns (Williams Table 3, p.23)
  kurtosis: number; // 4th Moment of Returns (Normal = 3.0; >3 = Fat-Tail Outlier Prone)
  tailProfileLabel: string;
  outside2SigmaPct: number; // Empirical % of bars piercing +-2 sigma vs 5% normal assumption
  dominantCycleBars: number; // Estimated Cycle Length L
  cycleSuggestedMa: number; // Equation 1 (p.7): Cycle Length / 2 + 1
  optimalWindowN: number; // Winning MA window N* across empirical backtest (Table 4 / Appendix A)
  scaledStdDevD: number; // Bollinger Rule #11 (p.17): 1.9 at 10 -> 2.0 at 20 -> 2.1 at 50
  cycleTermLabel: string; // Table 1 (p.16) Market Cycle classification
  optimalWinReturnPct: number;
  default20ReturnPct: number;
  windowSpectrum: Array<{
    n: number;
    d: number;
    returnPct: number;
    trades: number;
  }>;
  eq5Eq6Signal: {
    state: 'buy_reentry' | 'sell_reentry' | 'none';
    label: string;
    barIndex: number | null;
    price: number | null;
  };
  bandDivergence: {
    kind: 'bullish_divergence' | 'bearish_divergence';
    label: string;
    barIndex: number;
  } | null;
}

export interface KeltnerPoint {
  middle: number | null; // 20-period EMA
  upper: number | null; // 20 EMA + 2 * ATR(14)
  lower: number | null; // 20 EMA - 2 * ATR(14)
  atr: number | null; // Wilder ATR(14)
}

export interface KeltnerStrategySummary {
  channelState: 'bull_crawl' | 'bear_crawl' | 'flat_range' | 'uptrend' | 'downtrend';
  channelLabel: string;
  adx14: number | null;
  adxRising: boolean;
  rsi2: number | null;
  stochRsiK: number | null;
  stochRsiD: number | null;
  ttmSqueezeActive: boolean; // Bollinger Bands inside Keltner Channels (Volatility Compression)
  breakoutSignal: {
    state: 'buy_breakout' | 'sell_breakout' | 'none';
    label: string;
    barIndex: number | null;
    price: number | null;
  };
  rangeRsi2Signal: {
    state: 'buy_range' | 'sell_range' | 'none';
    label: string;
    barIndex: number | null;
    entryPrice: number | null;
    stopLoss: number | null;
    targetNote: string;
  };
  pullbackStochRsiSignal: {
    state: 'buy_pullback' | 'sell_pullback' | 'none';
    label: string;
    barIndex: number | null;
    price: number | null;
  };
}

export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export interface StochasticPoint {
  pctK: number | null; // %K(14)
  pctD: number | null; // %D(3)
}

export interface SakataMorrisSummary {
  ema10Trend: 'uptrend' | 'downtrend' | 'flat';
  ema10Label: string;
  newPriceRecordCount: number; // Shinne Hatte (N new highs or N new lows)
  newPriceRecordDirection: 'highs' | 'lows' | 'none';
  shinneHatteWarning: string | null;
  threeGapsExhaustion: boolean; // San-ku (Three Gaps)
  preSignalState: 'buy_zone' | 'sell_zone' | 'neutral';
  preSignalLabel: string;
}

export interface TechnicalStructureAnalysis {
  marketRegime: MarketRegimeInfo;
  supplyDemandZones: SupplyDemandZone[];
  ema10: Array<number | null>;
  ema50: Array<number | null>;
  ma8: Array<number | null>;
  ma21: Array<number | null>;
  rsi14: Array<number | null>;
  stochastic: StochasticPoint[];
  sakataMorris: SakataMorrisSummary;
  bollingerStrategy: BollingerStrategySummary;
  bollingerOptimization: EmpiricalBollingerOptimization;
  keltner: KeltnerPoint[];
  keltnerStrategy: KeltnerStrategySummary;
  zones: SupportResistanceZone[];
  trendChannel: TrendChannelInfo | null;
  geometricStructure: GeometricStructure | null;
  gaps: GapSignal[];
  fibonacci: FibonacciGrid | null;
  bollinger: BollingerPoint[];
  adaptiveBollinger: BollingerPoint[];
  bollingerStatus: string;
  macd: MacdPoint[];
  macdStatus: {
    state: 'bullish_cross' | 'bearish_cross' | 'bullish_momentum' | 'bearish_momentum' | 'neutral';
    label: string;
    barsSinceCross: number | null;
  };
}

export type ChartOverlayKey =
  | 'showSRZones'
  | 'showSupplyDemand'
  | 'showMA8_21'
  | 'showTrendChannel'
  | 'showGeometric'
  | 'showFibonacci'
  | 'showBollinger'
  | 'useAdaptiveBollinger'
  | 'showKeltner'
  | 'showMACD'
  | 'showMorrisFilter';

export interface TechniqueGuideItem {
  id: string;
  sourceBook:
    | 'Grafik Okuma'
    | 'Trading Bible'
    | 'Greg Morris'
    | 'Bollinger Stratejisi'
    | 'Ampirik Optimizasyon (SFU)'
    | 'Keltner Stratejisi';
  category:
    | 'Seviye & Trend'
    | 'Formasyon & Boşluk'
    | 'İndikatör & Fibonacci'
    | 'Price Action & Piyasa Yapısı'
    | 'Giriş Taktikleri & Risk Yönetimi'
    | 'Sakata Yöntemi & Kantitatif Filtreleme';
  title: string;
  subtitle: string;
  pdfPage: string;
  overlayKey?: ChartOverlayKey;
  summary: string;
  rules: string[];
  diagramType:
    | 'sr_flip'
    | 'trendline_channel'
    | 'gaps_island'
    | 'wedge_squeeze'
    | 'triangles'
    | 'bollinger'
    | 'macd'
    | 'fibonacci'
    | 'hh_hl_impulse'
    | 'choppy_vs_range'
    | 'top_down'
    | 'pinbar_50_entry'
    | 'confluence_sniper'
    | 'supply_demand'
    | 'inside_bar_fakey'
    | 'risk_reward_mm'
    | 'morris_breakdown'
    | 'morris_continuation_necks'
    | 'sakata_five_methods'
    | 'shinne_hatte_8'
    | 'morris_ema10_rules'
    | 'morris_stat_ranking'
    | 'morris_filtering_candlepower'
    | 'bb_squeeze_walk'
    | 'bb_w_m_pushes'
    | 'bb_bbma_50ema'
    | 'bb_rsi_middle_cross'
    | 'williams_eq5_eq6_reentry'
    | 'williams_ma_optimization'
    | 'williams_kurtosis_moments'
    | 'williams_15rules_divergence'
    | 'williams_envelopes_vs_bb'
    | 'keltner_atr_anatomy'
    | 'keltner_adx_breakout'
    | 'keltner_rsi2_range'
    | 'keltner_stochrsi_pullback';
}

export interface PatternSettings {
  enabledPatterns: Record<string, boolean>;
  confirmBarCount: number;
  showStatuses: Record<PatternStatus, boolean>;
  showRoles: Record<PatternRole, boolean>;
  onlyMorrisFiltered: boolean;
  barRegion: 'lastN' | 'all';
  lastNCount: number;
  colorMode: 'direction' | 'status';
  candleStyle: 'modern' | 'matriks';
  candlePower: boolean; // Greg Morris Chapter 9 Volume-Width Candlesticks
  showEMA10: boolean; // Greg Morris Chapter 6 Short-Term Trend EMA(10)
  showEMA20: boolean;
  showEMA50: boolean;
  showVolume: boolean;
  // Grafik Okuma, Trading Bible, Greg Morris, Bollinger Optimizasyon & Keltner Katmanları
  showSRZones: boolean;
  showSupplyDemand: boolean;
  showMA8_21: boolean;
  showTrendChannel: boolean;
  showGeometric: boolean;
  showFibonacci: boolean;
  showBollinger: boolean;
  useAdaptiveBollinger: boolean; // Williams SFU Optimal (N*, D*) Bollinger Channel
  showKeltner: boolean; // Keltner Channel (20 EMA ± 2 ATR) — Stubbs 3-Way Strategy
  showMACD: boolean;
  showMorrisFilter: boolean; // RSI(14) & Stochastic %D(14,3) Pre-Signal Pane
}
