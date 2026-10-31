import type { TechniqueGuideItem } from '../types/market';

interface TechniqueSchematicProps {
  diagramType: TechniqueGuideItem['diagramType'];
  isDark?: boolean;
}

export function TechniqueSchematic({ diagramType, isDark = true }: TechniqueSchematicProps) {
  const strokeMain = isDark ? '#E2E8F0' : '#0F172A';
  const mutedText = isDark ? '#94A3B8' : '#475569';
  const gridStroke = isDark ? 'rgba(148,163,184,0.10)' : 'rgba(15,23,42,0.08)';

  return (
    <svg
      viewBox="0 0 300 144"
      className="w-full h-[144px] select-none rounded-md bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
      role="img"
      aria-label="Grafik okuma tekniği şeması"
    >
      {/* Subtle Grid */}
      {[36, 72, 108].map((y) => (
        <line key={y} x1={12} y1={y} x2={288} y2={y} stroke={gridStroke} strokeDasharray="2 3" />
      ))}

      {diagramType === 'sr_flip' && (
        <g>
          {/* S/R Zone Band */}
          <rect
            x={18}
            y={68}
            width={264}
            height={14}
            fill="rgba(56, 189, 248, 0.14)"
            stroke="#0284C7"
            strokeDasharray="3 2"
          />
          {/* Price Path bouncing as support (1) then breaking and retesting as resistance (2) */}
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
            points="24,32 62,72 98,38 134,72 158,48 186,112 218,79 258,122"
          />
          <circle cx={62} cy={72} r={3.5} fill="#16A34A" />
          <circle cx={134} cy={72} r={3.5} fill="#16A34A" />
          <circle cx={218} cy={79} r={3.5} fill="#DC2626" />
          <text x={82} y={96} className="text-[9px] font-mono fill-emerald-600 dark:fill-emerald-400">
            1. DESTEK BÖLGESİ
          </text>
          <text x={196} y={62} className="text-[9px] font-mono fill-red-600 dark:fill-red-400">
            2. DİRENÇ (ROL DEĞİŞİMİ)
          </text>
        </g>
      )}

      {diagramType === 'trendline_channel' && (
        <g>
          {/* Parallel Channel Upper Line */}
          <line
            x1={30}
            y1={76}
            x2={265}
            y2={20}
            stroke="#38BDF8"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          {/* Primary Trendline with 3 touches */}
          <line x1={30} y1={122} x2={265} y2={66} stroke="#16A34A" strokeWidth={2} />
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={1.8}
            points="35,120 68,67 112,102 152,47 195,82 238,27 262,54"
          />
          {/* 3 Validation Points */}
          <circle cx={35} cy={120} r={3.5} fill="#16A34A" />
          <circle cx={112} cy={102} r={3.5} fill="#16A34A" />
          <circle cx={195} cy={82} r={4} fill="#F59E0B" />
          <text x={175} y={102} className="text-[9px] font-mono fill-amber-600 dark:fill-amber-400">
            3. NOKTA DOĞRULAMA
          </text>
          <text x={32} y={32} className="text-[9px] font-mono fill-sky-600 dark:fill-sky-400">
            PARALEL KANAL
          </text>
        </g>
      )}

      {diagramType === 'gaps_island' && (
        <g>
          {/* Trend up with Breakaway, Runaway, Exhaustion + Island */}
          <rect x={44} y={96} width={10} height={22} fill="#16A34A" />
          {/* Breakaway Gap */}
          <rect x={58} y={84} width={45} height={10} fill="rgba(22,163,74,0.16)" />
          <rect x={68} y={66} width={10} height={18} fill="#16A34A" />
          <rect x={86} y={58} width={10} height={14} fill="#16A34A" />
          {/* Exhaustion Gap + Island Top */}
          <rect x={120} y={40} width={52} height={12} fill="rgba(245,158,11,0.18)" />
          <rect x={132} y={22} width={8} height={16} fill="#16A34A" />
          <rect x={146} y={24} width={8} height={14} fill="#DC2626" />
          {/* Downward Gap after Island */}
          <rect x={176} y={54} width={10} height={24} fill="#DC2626" />
          <rect x={194} y={76} width={10} height={26} fill="#DC2626" />
          <text x={24} y={82} className="text-[9px] font-mono fill-emerald-600 dark:fill-emerald-400">
            KOPUŞ / ÖLÇME
          </text>
          <text x={115} y={16} className="text-[9px] font-mono fill-amber-600 dark:fill-amber-400">
            ADA DÖNÜŞÜ &amp; TÜKENİŞ
          </text>
        </g>
      )}

      {diagramType === 'wedge_squeeze' && (
        <g>
          {/* Falling Wedge (Azalan Sıkışma) breaking upwards by H */}
          <line x1={38} y1={36} x2={196} y2={92} stroke="#DC2626" strokeWidth={1.8} />
          <line x1={38} y1={96} x2={196} y2={112} stroke="#16A34A" strokeWidth={1.8} />
          {/* Height H indicator */}
          <line x1={38} y1={36} x2={38} y2={96} stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={22} y={70} className="text-[10px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            H
          </text>
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={1.8}
            points="42,92 68,48 92,100 118,66 142,105 164,82 180,106 218,32 252,24"
          />
          {/* Projected H Target */}
          <line x1={196} y1={88} x2={196} y2={28} stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={204} y={58} className="text-[9px] font-mono fill-sky-600 dark:fill-sky-400">
            HEDEF (H)
          </text>
        </g>
      )}

      {diagramType === 'triangles' && (
        <g>
          {/* Symmetrical Triangle */}
          <line x1={36} y1={30} x2={198} y2={76} stroke="#DC2626" strokeWidth={1.8} />
          <line x1={36} y1={122} x2={198} y2={76} stroke="#16A34A" strokeWidth={1.8} />
          <line x1={36} y1={30} x2={36} y2={122} stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={20} y={80} className="text-[10px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            H
          </text>
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={1.8}
            points="40,116 70,40 100,102 128,56 154,88 175,70 218,20 256,18"
          />
          <text x={188} y={108} className="text-[9px] font-mono" fill={mutedText}>
            SİMETRİK ÜÇGEN KIRILIMI
          </text>
        </g>
      )}

      {diagramType === 'bollinger' && (
        <g>
          {/* Upper, Middle, Lower Bollinger Bands */}
          <path
            d="M 20,45 Q 80,38 140,52 T 275,18"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={1.6}
          />
          <path
            d="M 20,76 Q 80,72 140,74 T 275,52"
            fill="none"
            stroke="#F59E0B"
            strokeWidth={1.3}
            strokeDasharray="3 3"
          />
          <path
            d="M 20,108 Q 80,106 140,96 T 275,88"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={1.6}
          />
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={1.9}
            points="24,92 58,48 96,98 134,64 168,86 204,44 238,24 272,14"
          />
          <text x={170} y={126} className="text-[9px] font-mono fill-violet-600 dark:fill-violet-400">
            BANT DIŞI KOPUŞ = TREND GÜCÜ
          </text>
        </g>
      )}

      {diagramType === 'macd' && (
        <g>
          {/* Zero Axis */}
          <line x1={20} y1={82} x2={280} y2={82} stroke={mutedText} strokeWidth={1} />
          {/* Histogram Bars */}
          {[
            { x: 35, h: -18 },
            { x: 55, h: -14 },
            { x: 75, h: -8 },
            { x: 95, h: -3 },
            { x: 115, h: 6 },
            { x: 135, h: 16 },
            { x: 155, h: 26 },
            { x: 175, h: 32 },
            { x: 195, h: 28 },
            { x: 215, h: 20 },
          ].map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.h >= 0 ? 82 - b.h : 82}
              width={10}
              height={Math.abs(b.h)}
              fill={b.h >= 0 ? 'rgba(22,163,74,0.55)' : 'rgba(220,38,38,0.55)'}
            />
          ))}
          {/* MACD Line (12,26) & Signal Line (9) */}
          <path
            d="M 30,115 Q 90,108 115,82 T 230,28"
            fill="none"
            stroke="#38BDF8"
            strokeWidth={2}
          />
          <path
            d="M 30,102 Q 95,105 115,82 T 230,44"
            fill="none"
            stroke="#F97316"
            strokeWidth={1.8}
          />
          <circle cx={108} cy={88} r={4.5} fill="#16A34A" />
          <text x={118} y={108} className="text-[9px] font-mono fill-emerald-600 dark:fill-emerald-400">
            MACD (12,26,9) KESİŞİMİ
          </text>
        </g>
      )}

      {diagramType === 'fibonacci' && (
        <g>
          {[
            { y: 22, lbl: '0.0% (Tepe)' },
            { y: 46, lbl: '23.6%' },
            { y: 62, lbl: '38.2%' },
            { y: 76, lbl: '50.0%' },
            { y: 90, lbl: '61.8% (Altın Oran)' },
            { y: 122, lbl: '100.0% (Dip)' },
          ].map((lv, idx) => (
            <g key={idx}>
              <line
                x1={24}
                y1={lv.y}
                x2={276}
                y2={lv.y}
                stroke={idx === 4 ? '#F59E0B' : '#38BDF8'}
                strokeWidth={idx === 4 ? 1.5 : 1}
                strokeDasharray={idx === 0 || idx === 5 ? undefined : '3 3'}
              />
              <text
                x={274}
                y={lv.y - 3}
                textAnchor="end"
                className="text-[8.5px] font-mono"
                fill={idx === 4 ? '#F59E0B' : mutedText}
              >
                {lv.lbl}
              </text>
            </g>
          ))}
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
            points="32,122 135,22 188,90 245,30"
          />
          <circle cx={32} cy={122} r={3.5} fill="#38BDF8" />
          <circle cx={135} cy={22} r={3.5} fill="#38BDF8" />
          <circle cx={188} cy={90} r={4} fill="#F59E0B" />
        </g>
      )}

      {diagramType === 'hh_hl_impulse' && (
        <g>
          <polyline
            fill="none"
            stroke="#16A34A"
            strokeWidth={2.2}
            points="24,122 76,68 112,96 178,34 214,66 272,16"
          />
          {[
            { x: 76, y: 68, lbl: 'HH', c: '#16A34A', dy: -8 },
            { x: 112, y: 96, lbl: 'HL (Pullback)', c: '#38BDF8', dy: 14 },
            { x: 178, y: 34, lbl: 'HH', c: '#16A34A', dy: -8 },
            { x: 214, y: 66, lbl: 'HL (Alım)', c: '#F59E0B', dy: 14 },
          ].map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r={3.8} fill={pt.c} />
              <text
                x={pt.x}
                y={pt.y + pt.dy}
                textAnchor="middle"
                className="text-[8.5px] font-mono font-semibold"
                fill={pt.c}
              >
                {pt.lbl}
              </text>
            </g>
          ))}
          <text x={24} y={24} className="text-[8.5px] font-mono" fill={mutedText}>
            İTKİ (IMPULSE) + DÜZELTME (RETRACEMENT)
          </text>
        </g>
      )}

      {diagramType === 'choppy_vs_range' && (
        <g>
          {/* Left: Clean Ranging Market */}
          <line x1={16} y1={34} x2={136} y2={34} stroke="#DC2626" strokeWidth={1.5} />
          <line x1={16} y1={108} x2={136} y2={108} stroke="#16A34A" strokeWidth={1.5} />
          <polyline
            fill="none"
            stroke={strokeMain}
            strokeWidth={1.8}
            points="20,104 46,36 74,106 104,36 130,98"
          />
          <text x={76} y={128} textAnchor="middle" className="text-[8.5px] font-mono fill-emerald-600 dark:fill-emerald-400">
            TEMİZ YATAY (İŞLEM AÇ)
          </text>

          {/* Divider */}
          <line x1={150} y1={14} x2={150} y2={132} stroke={mutedText} strokeDasharray="3 3" />

          {/* Right: Choppy Market Whipsaw */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth={1.7}
            points="164,74 176,50 186,92 198,60 208,84 220,44 232,96 244,64 256,82 270,58 282,78"
          />
          <text x={222} y={128} textAnchor="middle" className="text-[8.5px] font-mono fill-red-600 dark:fill-red-400">
            CHOPPY (UZAK DUR!)
          </text>
        </g>
      )}

      {diagramType === 'top_down' && (
        <g>
          {/* Left Box: 4H / Daily Macro Structure */}
          <rect
            x={16}
            y={20}
            width={122}
            height={102}
            rx={4}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={1.3}
          />
          <rect x={22} y={84} width={110} height={12} fill="rgba(22,163,74,0.20)" />
          <polyline fill="none" stroke={strokeMain} strokeWidth={1.8} points="28,108 66,44 96,88 124,52" />
          <text x={24} y={34} className="text-[8.5px] font-mono fill-sky-600 dark:fill-sky-400">
            1. ÜST GRAFİK (4S / 1G)
          </text>

          {/* Arrow */}
          <line x1={144} y1={72} x2={160} y2={72} stroke="#F59E0B" strokeWidth={2} />

          {/* Right Box: 1H / 15m Sniper Trigger */}
          <rect
            x={164}
            y={20}
            width={120}
            height={102}
            rx={4}
            fill="none"
            stroke="#16A34A"
            strokeWidth={1.3}
          />
          <rect x={170} y={84} width={108} height={12} fill="rgba(22,163,74,0.20)" />
          {/* Pin Bar on HTF Support */}
          <line x1={222} y1={58} x2={222} y2={106} stroke="#16A34A" strokeWidth={2} />
          <rect x={216} y={62} width={12} height={10} fill="#16A34A" />
          <text x={172} y={34} className="text-[8.5px] font-mono fill-emerald-600 dark:fill-emerald-400">
            2. ALT GRAFİK TETİK
          </text>
          <text x={224} y={117} textAnchor="middle" className="text-[8px] font-mono fill-emerald-600 dark:fill-emerald-400">
            PIN BAR GİRİŞ
          </text>
        </g>
      )}

      {diagramType === 'pinbar_50_entry' && (
        <g>
          {/* Support Zone */}
          <rect x={20} y={96} width={260} height={14} fill="rgba(22,163,74,0.16)" />
          {/* Pin Bar */}
          <line x1={108} y1={34} x2={108} y2={118} stroke="#16A34A" strokeWidth={2.2} />
          <rect x={100} y={38} width={16} height={16} fill="#16A34A" rx={1} />
          {/* Close Aggressive Entry */}
          <line x1={116} y1={38} x2={265} y2={38} stroke="#38BDF8" strokeWidth={1.3} strokeDasharray="3 2" />
          <text x={264} y={33} textAnchor="end" className="text-[8.5px] font-mono fill-sky-600 dark:fill-sky-400">
            AGRESİF GİRİŞ (KAPANIŞ)
          </text>
          {/* 50% Retracement Limit Entry */}
          <line x1={108} y1={76} x2={265} y2={76} stroke="#F59E0B" strokeWidth={1.6} strokeDasharray="4 2" />
          <text x={264} y={71} textAnchor="end" className="text-[8.5px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
            %50 LİMİT GİRİŞ (YÜKSEK R:R)
          </text>
          {/* Stop Loss below tail */}
          <line x1={96} y1={124} x2={265} y2={124} stroke="#DC2626" strokeWidth={1.4} />
          <text x={264} y={134} textAnchor="end" className="text-[8.5px] font-mono fill-red-600 dark:fill-red-400">
            STOP LOSS (KUYRUK ALTI)
          </text>
        </g>
      )}

      {diagramType === 'confluence_sniper' && (
        <g>
          {/* S/R Zone */}
          <rect x={20} y={82} width={260} height={14} fill="rgba(22,163,74,0.16)" />
          {/* Dynamic 21 MA curve */}
          <path d="M 22,118 Q 115,104 168,88 T 278,44" fill="none" stroke="#38BDF8" strokeWidth={1.8} />
          {/* Fib 61.8% line */}
          <line x1={22} y1={89} x2={278} y2={89} stroke="#F59E0B" strokeWidth={1.2} strokeDasharray="3 3" />
          {/* Price + Pin Bar at Confluence */}
          <polyline fill="none" stroke={strokeMain} strokeWidth={1.7} points="28,112 104,28 168,89 242,20" />
          <circle cx={168} cy={89} r={6} fill="rgba(245,158,11,0.28)" stroke="#F59E0B" strokeWidth={1.6} />
          <text x={168} y={118} textAnchor="middle" className="text-[8.5px] font-mono font-semibold fill-amber-600 dark:fill-amber-400">
            SNIPER KESİŞİM (TREND + S/R + MA21 + %61.8)
          </text>
        </g>
      )}

      {diagramType === 'supply_demand' && (
        <g>
          {/* Supply Zone Top */}
          <rect x={24} y={20} width={252} height={18} fill="rgba(220,38,38,0.16)" stroke="#DC2626" strokeDasharray="3 2" />
          <text x={270} y={32} textAnchor="end" className="text-[8.5px] font-mono fill-red-600 dark:fill-red-400">
            KURUMSAL ARZ (SUPPLY)
          </text>
          {/* Demand Zone Bottom */}
          <rect x={24} y={102} width={252} height={18} fill="rgba(22,163,74,0.16)" stroke="#16A34A" strokeDasharray="3 2" />
          <text x={270} y={114} textAnchor="end" className="text-[8.5px] font-mono fill-emerald-600 dark:fill-emerald-400">
            KURUMSAL TALEP (DEMAND)
          </text>
          {/* Explosive Rally from Base & First Retest */}
          <rect x={44} y={106} width={10} height={10} fill="#94A3B8" />
          <rect x={58} y={66} width={12} height={42} fill="#16A34A" />
          <rect x={74} y={36} width={12} height={32} fill="#16A34A" />
          <polyline fill="none" stroke={strokeMain} strokeWidth={1.8} points="90,38 134,106 184,30" />
          <circle cx={134} cy={106} r={4} fill="#16A34A" />
        </g>
      )}

      {diagramType === 'inside_bar_fakey' && (
        <g>
          {/* Mother Bar */}
          <line x1={86} y1={36} x2={86} y2={104} stroke="#DC2626" strokeWidth={1.8} />
          <rect x={78} y={44} width={16} height={52} fill="#DC2626" />
          {/* Inside Bar */}
          <line x1={114} y1={52} x2={114} y2={88} stroke="#16A34A" strokeWidth={1.6} />
          <rect x={107} y={58} width={14} height={24} fill="#16A34A" />
          {/* Mother High/Low Box */}
          <rect x={72} y={36} width={54} height={68} fill="none" stroke="#38BDF8" strokeDasharray="3 2" />
          {/* False Breakout Pin (Stop Hunt) */}
          <line x1={146} y1={48} x2={146} y2={128} stroke="#16A34A" strokeWidth={2.2} />
          <rect x={139} y={52} width={14} height={18} fill="#16A34A" />
          {/* Breakout Rally */}
          <rect x={170} y={24} width={14} height={32} fill="#16A34A" />
          <text x={146} y={138} textAnchor="middle" className="text-[8.5px] font-mono fill-amber-600 dark:fill-amber-400">
            SAHTE KIRILIM (STOP AVI / FAKEY)
          </text>
        </g>
      )}

      {diagramType === 'risk_reward_mm' && (
        <g>
          {/* Reward Box (3R Green) */}
          <rect x={48} y={20} width={204} height={66} fill="rgba(22,163,74,0.18)" stroke="#16A34A" />
          {/* Risk Box (1R Red) */}
          <rect x={48} y={86} width={204} height={28} fill="rgba(220,38,38,0.20)" stroke="#DC2626" />
          <text x={150} y={56} textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            ÖDÜL HEDEFİ (+3R = +%6 Büyüme)
          </text>
          <text x={150} y={104} textAnchor="middle" className="text-[9.5px] font-mono font-bold fill-red-600 dark:fill-red-400">
            MAKS RİSK (-1R = Kasa %2)
          </text>
          <text x={150} y={132} textAnchor="middle" className="text-[8.5px] font-mono" fill={mutedText}>
            MİNİMUM 1:2 R:R KURALI · %40 BAŞARI İLE KÂRLILIK
          </text>
        </g>
      )}

      {diagramType === 'morris_breakdown' && (
        <g>
          {/* Left: 3-Bar Morning Star */}
          <rect x={22} y={24} width={118} height={94} rx={4} fill="none" stroke="#38BDF8" strokeDasharray="3 2" />
          <line x1={46} y1={34} x2={46} y2={84} stroke="#DC2626" strokeWidth={1.6} />
          <rect x={40} y={38} width={12} height={42} fill="#DC2626" />
          <line x1={78} y1={82} x2={78} y2={112} stroke={strokeMain} strokeWidth={1.6} />
          <rect x={72} y={88} width={12} height={8} fill="#F59E0B" />
          <line x1={110} y1={42} x2={110} y2={88} stroke="#16A34A" strokeWidth={1.6} />
          <rect x={104} y={46} width={12} height={38} fill="#16A34A" />
          <text x={81} y={132} textAnchor="middle" className="text-[8.5px] font-mono" fill={mutedText}>
            3 MUMLU SABAH YILDIZI
          </text>

          {/* Reduction Arrow */}
          <line x1={148} y1={70} x2={176} y2={70} stroke="#F59E0B" strokeWidth={2.2} />
          <polygon points="176,65 186,70 176,75" fill="#F59E0B" />

          {/* Right: Reduced Single Paper Umbrella / Hammer */}
          <rect x={196} y={24} width={84} height={94} rx={4} fill="rgba(22,163,74,0.08)" stroke="#16A34A" />
          <line x1={238} y1={34} x2={238} y2={112} stroke="#16A34A" strokeWidth={2.4} />
          <rect x={226} y={38} width={24} height={14} fill="#16A34A" rx={1} />
          <text x={238} y={132} textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            TEK MUM: ÇEKİÇ (DESTEKLİYOR)
          </text>
        </g>
      )}

      {diagramType === 'morris_continuation_necks' && (
        <g>
          {/* Reference Long Black Candle */}
          <rect x={28} y={28} width={18} height={64} fill="#DC2626" />
          {/* 50% Midpoint Line */}
          <line x1={22} y1={60} x2={280} y2={60} stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 2" />
          <text x={278} y={55} textAnchor="end" className="text-[8.5px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
            %50 GÖVDE ORTA ÇİZGİSİ
          </text>
          {/* On-Neck */}
          <rect x={76} y={92} width={14} height={22} fill="#16A34A" opacity={0.7} />
          <text x={83} y={128} textAnchor="middle" className="text-[7.5px] font-mono fill-red-600 dark:fill-red-400">
            ON-NECK
          </text>
          {/* In-Neck */}
          <rect x={128} y={88} width={14} height={26} fill="#16A34A" opacity={0.8} />
          <text x={135} y={128} textAnchor="middle" className="text-[7.5px] font-mono fill-red-600 dark:fill-red-400">
            IN-NECK
          </text>
          {/* Thrusting (<50% = Bearish Continuation) */}
          <rect x={180} y={68} width={14} height={44} fill="#16A34A" opacity={0.85} />
          <text x={187} y={128} textAnchor="middle" className="text-[7.5px] font-mono fill-red-600 dark:fill-red-400">
            THRUST (&lt;%50 AYI)
          </text>
          {/* Piercing (>50% = Bullish Reversal) */}
          <rect x={238} y={44} width={16} height={68} fill="#16A34A" />
          <text x={246} y={128} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            PIERCING (&gt;%50 BOĞA)
          </text>
        </g>
      )}

      {diagramType === 'sakata_five_methods' && (
        <g>
          {/* San-zan / San-pe / San-ku / San-po Rising Three Methods */}
          <rect x={36} y={36} width={16} height={68} fill="#16A34A" />
          <rect x={68} y={48} width={12} height={20} fill="#DC2626" />
          <rect x={92} y={58} width={12} height={20} fill="#DC2626" />
          <rect x={116} y={68} width={12} height={20} fill="#DC2626" />
          <rect x={144} y={18} width={18} height={76} fill="#16A34A" />
          <rect x={32} y={34} width={134} height={72} fill="none" stroke="#38BDF8" strokeDasharray="3 2" />
          <text x={180} y={42} className="text-[8.5px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            SAKATA 5 YÖNTEMİ:
          </text>
          <text x={180} y={58} className="text-[8px] font-mono" fill={strokeMain}>
            1. San-zan (Üç Dağ)
          </text>
          <text x={180} y={71} className="text-[8px] font-mono" fill={strokeMain}>
            2. San-sen (Üç Nehir)
          </text>
          <text x={180} y={84} className="text-[8px] font-mono" fill={strokeMain}>
            3. San-ku (Üç Boşluk)
          </text>
          <text x={180} y={97} className="text-[8px] font-mono" fill={strokeMain}>
            4. San-pei (Üç Asker)
          </text>
          <text x={180} y={110} className="text-[8px] font-mono fill-emerald-600 dark:fill-emerald-400">
            5. San-po (Dinlenme)
          </text>
        </g>
      )}

      {diagramType === 'shinne_hatte_8' && (
        <g>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n, idx) => {
            const x = 24 + idx * 26;
            const y = 112 - idx * 11;
            const isWarn = n >= 8;
            return (
              <g key={n}>
                <rect
                  x={x}
                  y={y}
                  width={14}
                  height={16}
                  fill={isWarn ? '#F59E0B' : '#16A34A'}
                  rx={1}
                />
                <text
                  x={x + 7}
                  y={y - 4}
                  textAnchor="middle"
                  className="text-[8px] font-mono font-bold"
                  fill={isWarn ? '#F59E0B' : '#16A34A'}
                >
                  #{n}
                </text>
              </g>
            );
          })}
          {/* Reversal Crows after 8th record high */}
          <rect x={238} y={34} width={14} height={36} fill="#DC2626" />
          <rect x={258} y={62} width={14} height={38} fill="#DC2626" />
          <text x={150} y={136} textAnchor="middle" className="text-[8.5px] font-mono font-semibold fill-amber-600 dark:fill-amber-400">
            SHINNE HATTE: 8–10 YENİ ZİRVE SONRASI ALIMI DURDUR!
          </text>
        </g>
      )}

      {diagramType === 'morris_ema10_rules' && (
        <g>
          {/* EMA 10 Curve */}
          <path
            d="M 20,34 Q 90,74 148,96 T 278,46"
            fill="none"
            stroke="#EC4899"
            strokeWidth={2.2}
          />
          {/* Price Candles below EMA10 -> Hammer -> Uptrend above EMA10 */}
          <rect x={44} y={54} width={10} height={24} fill="#DC2626" />
          <rect x={76} y={76} width={10} height={24} fill="#DC2626" />
          {/* Hammer below EMA 10 */}
          <line x1={122} y1={98} x2={122} y2={130} stroke="#16A34A" strokeWidth={2.2} />
          <rect x={116} y={100} width={12} height={10} fill="#16A34A" />
          {/* Rally above EMA 10 */}
          <rect x={188} y={56} width={12} height={26} fill="#16A34A" />
          <rect x={228} y={30} width={12} height={28} fill="#16A34A" />
          <text x={24} y={24} className="text-[8.5px] font-mono font-semibold fill-pink-600 dark:fill-pink-400">
            MORRIS EMA(10) KISA VADELİ TREND REFERANSI
          </text>
          <text x={122} y={139} textAnchor="middle" className="text-[8px] font-mono fill-emerald-600 dark:fill-emerald-400">
            KAPANIŞ &lt; EMA10 = DÜŞÜŞ TRENDİ ONAYLI
          </text>
        </g>
      )}

      {diagramType === 'morris_stat_ranking' && (
        <g>
          {[
            { y: 22, w: 215, lbl: '1. Three Black Crows (Üç Kara Karga)', c: '#DC2626' },
            { y: 44, w: 202, lbl: '2. Three White Soldiers (Üç Beyaz Asker)', c: '#16A34A' },
            { y: 66, w: 188, lbl: '3. Three Inside Up (Üçlü İçten Yükseliş)', c: '#16A34A' },
            { y: 88, w: 176, lbl: '4. Three Outside Down / Up', c: '#38BDF8' },
            { y: 110, w: 164, lbl: '5. Dark Cloud Cover (Kara Bulut)', c: '#DC2626' },
          ].map((bar, i) => (
            <g key={i}>
              <rect x={20} y={bar.y} width={bar.w} height={15} rx={2} fill={bar.c} opacity={0.22} stroke={bar.c} />
              <text x={26} y={bar.y + 11} className="text-[8.5px] font-mono font-semibold" fill={strokeMain}>
                {bar.lbl}
              </text>
            </g>
          ))}
        </g>
      )}

      {diagramType === 'morris_filtering_candlepower' && (
        <g>
          {/* Top Half: CandlePower variable-width volume candles */}
          <line x1={48} y1={18} x2={48} y2={62} stroke="#DC2626" strokeWidth={1.4} />
          <rect x={45} y={24} width={6} height={30} fill="#DC2626" />
          <line x1={82} y1={32} x2={82} y2={68} stroke="#DC2626" strokeWidth={1.4} />
          <rect x={78} y={36} width={8} height={24} fill="#DC2626" />
          {/* Wide High-Volume CandlePower Bullish Engulfing */}
          <line x1={128} y1={14} x2={128} y2={70} stroke="#16A34A" strokeWidth={2} />
          <rect x={114} y={18} width={28} height={46} fill="#16A34A" rx={1} />
          <text x={152} y={38} className="text-[8.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            CANDLEPOWER (GENİŞ = HACİM)
          </text>

          {/* Divider */}
          <line x1={16} y1={78} x2={284} y2={78} stroke={mutedText} strokeDasharray="2 2" />

          {/* Bottom Half: Stochastic %D Pre-Signal < 20 Zone */}
          <rect x={20} y={112} width={260} height={20} fill="rgba(22,163,74,0.18)" />
          <line x1={20} y1={112} x2={280} y2={112} stroke="#16A34A" strokeDasharray="3 2" />
          <path d="M 24,88 Q 76,126 128,122 T 264,86" fill="none" stroke="#38BDF8" strokeWidth={2} />
          <circle cx={128} cy={122} r={4.5} fill="#F59E0B" />
          <text x={140} y={126} className="text-[8px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
            %D &lt; 20 ÖN-SİNYAL FİLTRESİ (+%50 VERİM)
          </text>
        </g>
      )}

      {diagramType === 'bb_squeeze_walk' && (
        <g>
          {/* Shaded BB Squeeze -> Expansion Envelope */}
          <path
            d="M 18,46 Q 68,62 118,64 Q 168,26 226,18 L 280,22 L 280,108 L 226,122 Q 168,116 118,86 Q 68,88 18,104 Z"
            fill="rgba(139,92,246,0.11)"
          />
          {/* Upper Band */}
          <path
            d="M 18,46 Q 68,62 118,64 Q 168,26 226,18 L 280,22"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={1.8}
          />
          {/* Middle SMA 20 */}
          <path
            d="M 18,75 Q 68,75 118,75 Q 170,58 226,48 L 280,46"
            fill="none"
            stroke="#8B5CF6"
            strokeDasharray="3 3"
            strokeWidth={1.3}
          />
          {/* Lower Band (expands down, then hooks up at 226..280) */}
          <path
            d="M 18,104 Q 68,88 118,86 Q 168,116 226,122 L 280,104"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth={1.8}
          />
          {/* Squeeze Bracket */}
          <rect
            x={72}
            y={59}
            width={52}
            height={32}
            fill="none"
            stroke="#F59E0B"
            strokeDasharray="3 2"
            rx={3}
          />
          <text x={98} y={53} textAnchor="middle" className="text-[8px] font-mono font-bold fill-amber-600 dark:fill-amber-400">
            BB SQUEEZE
          </text>
          {/* Walking the Band Candles */}
          <rect x={144} y={46} width={8} height={22} fill="#16A34A" />
          <rect x={168} y={32} width={8} height={20} fill="#16A34A" />
          <rect x={192} y={22} width={8} height={18} fill="#16A34A" />
          <rect x={216} y={17} width={8} height={16} fill="#16A34A" />
          <text x={184} y={13} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            BANDI YÜRÜMEK (SATMA!)
          </text>
          <text x={246} y={134} textAnchor="middle" className="text-[7.5px] font-mono fill-violet-600 dark:fill-violet-400">
            ALT BANT BÜKÜLMESİ
          </text>
        </g>
      )}

      {diagramType === 'bb_w_m_pushes' && (
        <g>
          {/* Left Side: W-Bottom at Lower Band */}
          <path d="M 18,96 Q 55,118 96,114 T 136,88" fill="none" stroke="#8B5CF6" strokeWidth={1.5} />
          <polyline
            points="22,62 48,122 68,88 92,108 126,56"
            fill="none"
            stroke="#16A34A"
            strokeWidth={2.2}
          />
          <circle cx={48} cy={122} r={3.5} fill="#DC2626" />
          <circle cx={92} cy={108} r={3.5} fill="#16A34A" />
          <text x={74} y={136} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            W-DİP (2. DİP BANT İÇİNDE)
          </text>

          <line x1={148} y1={18} x2={148} y2={132} stroke={mutedText} strokeDasharray="3 3" />

          {/* Right Side: Classic M-Top / 3 Pushes at Upper Band */}
          <path d="M 162,48 Q 205,22 246,28 T 284,56" fill="none" stroke="#8B5CF6" strokeWidth={1.5} />
          <polyline
            points="164,86 192,20 214,56 242,32 278,94"
            fill="none"
            stroke="#DC2626"
            strokeWidth={2.2}
          />
          <circle cx={192} cy={20} r={3.5} fill="#16A34A" />
          <circle cx={242} cy={32} r={3.5} fill="#DC2626" />
          <text x={222} y={15} textAnchor="middle" className="text-[8px] font-mono font-bold fill-red-600 dark:fill-red-400">
            KLASİK M-TEPE / 3 İTİŞ
          </text>
        </g>
      )}

      {diagramType === 'bb_bbma_50ema' && (
        <g>
          {/* Bollinger Channel */}
          <path d="M 18,22 Q 110,24 185,78 T 282,104" fill="none" stroke="#8B5CF6" opacity={0.55} strokeWidth={1.3} />
          <path d="M 18,68 Q 110,72 185,122 T 282,134" fill="none" stroke="#8B5CF6" opacity={0.55} strokeWidth={1.3} />
          {/* Middle Bollinger Band (20 SMA - Green/Violet) */}
          <path d="M 18,44 Q 95,46 160,92 T 282,100" fill="none" stroke="#10B981" strokeWidth={2.2} />
          {/* 50 EMA (Amber/White Reference Line) */}
          <path d="M 18,58 Q 105,54 175,80 T 282,112" fill="none" stroke="#F59E0B" strokeWidth={2.2} />
          {/* Bearish BBMA Crossover Point */}
          <circle cx={112} cy={56} r={5} fill="#DC2626" />
          <text x={112} y={40} textAnchor="middle" className="text-[8px] font-mono font-bold fill-red-600 dark:fill-red-400">
            BBMA KESİŞİMİ (GİRİŞ)
          </text>
          {/* Opposite Crossover Exit Point */}
          <circle cx={238} cy={104} r={4.5} fill="#38BDF8" />
          <text x={232} y={92} textAnchor="middle" className="text-[8px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            TERS KESİŞİM (ÇIKIŞ)
          </text>
          <text x={22} y={134} className="text-[7.5px] font-mono fill-amber-600 dark:fill-amber-400">
            50 EMA × ORTA BANT (20 SMA)
          </text>
        </g>
      )}

      {diagramType === 'bb_rsi_middle_cross' && (
        <g>
          {/* Upper Price + BB Pane */}
          <path d="M 20,22 Q 110,32 195,20 L 280,18" fill="none" stroke="#8B5CF6" strokeWidth={1.3} />
          <path d="M 20,52 Q 110,58 195,46 L 280,42" fill="none" stroke="#8B5CF6" strokeDasharray="3 2" strokeWidth={1.5} />
          <path d="M 20,80 Q 110,84 195,74 L 280,68" fill="none" stroke="#8B5CF6" strokeWidth={1.3} />

          {/* Candle 1 outside Lower BB */}
          <rect x={76} y={76} width={9} height={18} fill="#DC2626" />
          {/* Reversal Candle closing ABOVE Middle BB */}
          <rect x={124} y={42} width={11} height={26} fill="#16A34A" />
          <circle cx={129} cy={46} r={4} fill="#16A34A" />
          <text x={144} y={43} className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            ORTA BANT ÜSTÜ AL!
          </text>
          {/* Stop Loss below Swing Low */}
          <line x1={68} y1={98} x2={142} y2={98} stroke="#DC2626" strokeDasharray="2 2" strokeWidth={1.4} />
          <text x={105} y={106} textAnchor="middle" className="text-[7.5px] font-mono fill-red-600 dark:fill-red-400">
            SWING DİP STOP
          </text>

          {/* Lower RSI(14) < 30 Leading Pane */}
          <line x1={20} y1={112} x2={280} y2={112} stroke={mutedText} strokeDasharray="2 2" />
          <path d="M 24,116 L 80,136 L 130,122 L 245,113" fill="none" stroke="#38BDF8" strokeWidth={1.8} />
          <circle cx={80} cy={136} r={3.5} fill="#F59E0B" />
          <text x={156} y={136} className="text-[7.5px] font-mono font-semibold fill-amber-600 dark:fill-amber-400">
            ÖNCÜ RSI &lt; 30 + HEDEF: ÜST BANT
          </text>
        </g>
      )}

      {diagramType === 'williams_eq5_eq6_reentry' && (
        <g>
          {/* Upper & Lower BB Curves */}
          <path d="M 18,34 Q 105,22 188,28 T 282,42" fill="none" stroke="#8B5CF6" strokeWidth={1.6} />
          <path d="M 18,72 Q 105,66 188,68 T 282,76" fill="none" stroke="#8B5CF6" strokeDasharray="3 3" strokeWidth={1.1} />
          <path d="M 18,108 Q 105,114 188,106 T 282,110" fill="none" stroke="#8B5CF6" strokeWidth={1.6} />

          {/* Eq 5: Price outside lower band at t-1, crosses back inside at t */}
          <polyline
            points="24,84 56,126 84,96 146,48 182,16 212,42 268,84"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
          />
          <circle cx={56} cy={126} r={3.5} fill="#94A3B8" />
          <circle cx={84} cy={96} r={5} fill="#16A34A" />
          <text x={84} y={86} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            DENKLEM 5 AL (İÇE DÖNÜŞ)
          </text>

          {/* Eq 6: Price outside upper band at t-1, crosses back inside at t */}
          <circle cx={182} cy={16} r={3.5} fill="#94A3B8" />
          <circle cx={212} cy={42} r={5} fill="#DC2626" />
          <text x={214} y={56} textAnchor="middle" className="text-[8px] font-mono font-bold fill-red-600 dark:fill-red-400">
            DENKLEM 6 SAT
          </text>
          <text x={150} y={136} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
            P(t-1) &lt; BB_low &amp; P(t) &gt; BB_low
          </text>
        </g>
      )}

      {diagramType === 'williams_ma_optimization' && (
        <g>
          {/* Profit vs Moving Average Window Bar Spectrum (Appendix A style) */}
          <line x1={24} y1={116} x2={280} y2={116} stroke={mutedText} strokeWidth={1.2} />
          {[
            { x: 32, h: 24, lbl: '10', opt: false },
            { x: 62, h: 38, lbl: '14', opt: false },
            { x: 92, h: 42, lbl: '20', opt: false },
            { x: 122, h: 78, lbl: 'N*=34', opt: true },
            { x: 158, h: 64, lbl: '50', opt: false },
            { x: 188, h: 30, lbl: '75', opt: false },
            { x: 218, h: 46, lbl: '100', opt: false },
            { x: 248, h: 28, lbl: '200', opt: false },
          ].map((b, idx) => (
            <g key={idx}>
              <rect
                x={b.x}
                y={116 - b.h}
                width={b.opt ? 24 : 18}
                height={b.h}
                rx={2}
                fill={b.opt ? '#10B981' : '#6366F1'}
                opacity={b.opt ? 0.9 : 0.45}
              />
              <text
                x={b.x + (b.opt ? 12 : 9)}
                y={128}
                textAnchor="middle"
                className={`text-[7.5px] font-mono ${b.opt ? 'font-bold fill-emerald-600 dark:fill-emerald-400' : 'fill-slate-500'}`}
              >
                {b.lbl}
              </text>
            </g>
          ))}
          <text x={150} y={22} textAnchor="middle" className="text-[8.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            VARLIĞA ÖZGÜ OPTİMAL PENCERE · IDEAL MA = (CYCLE / 2) + 1
          </text>
        </g>
      )}

      {diagramType === 'williams_kurtosis_moments' && (
        <g>
          <line x1={20} y1={118} x2={280} y2={118} stroke={mutedText} strokeWidth={1.2} />
          {/* Dashed Normal Bell Curve (Kurtosis = 3) */}
          <path
            d="M 28,117 Q 95,114 122,68 Q 150,28 178,68 Q 205,114 272,117"
            fill="none"
            stroke="#94A3B8"
            strokeDasharray="3 3"
            strokeWidth={1.6}
          />
          {/* Solid Leptokurtic Fat-Tail Distribution (Kurtosis > 3) */}
          <path
            d="M 24,104 Q 96,108 132,58 Q 150,14 168,58 Q 204,108 276,104"
            fill="rgba(245,158,11,0.14)"
            stroke="#F59E0B"
            strokeWidth={2.2}
          />
          {/* +-2 Sigma Vertical Markers */}
          <line x1={68} y1={42} x2={68} y2={118} stroke="#DC2626" strokeDasharray="2 2" />
          <line x1={232} y1={42} x2={232} y2={118} stroke="#DC2626" strokeDasharray="2 2" />
          <text x={50} y={96} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-red-600 dark:fill-red-400">
            KALIN KUYRUK
          </text>
          <text x={250} y={96} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-red-600 dark:fill-red-400">
            OUTLIER &gt;2σ
          </text>
          <text x={150} y={134} textAnchor="middle" className="text-[8px] font-mono font-semibold fill-amber-600 dark:fill-amber-400">
            4. MOMENT KURTOSIS &gt; 3.0 (LEPTOKURTİK DAĞILIM)
          </text>
        </g>
      )}

      {diagramType === 'williams_15rules_divergence' && (
        <g>
          {/* Left: StdDev Scaling Ladder */}
          <rect x={18} y={24} width={108} height={96} rx={4} fill="none" stroke={mutedText} opacity={0.45} />
          <text x={72} y={39} textAnchor="middle" className="text-[8px] font-mono font-bold fill-violet-600 dark:fill-violet-400">
            KURAL #11 σ ÖLÇEK
          </text>
          <text x={28} y={60} className="text-[8px] font-mono" fill={strokeMain}>
            N = 10  →  1.9 σ
          </text>
          <text x={28} y={80} className="text-[8px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            N = 20  →  2.0 σ
          </text>
          <text x={28} y={100} className="text-[8px] font-mono" fill={strokeMain}>
            N = 50  →  2.1 σ
          </text>

          {/* Right: Peak 1 Outside Band + Peak 2 Higher Nominal Price Inside Band */}
          <path d="M 142,46 Q 190,34 238,20 L 282,36" fill="none" stroke="#8B5CF6" strokeWidth={1.7} />
          <polyline
            points="146,88 182,28 206,66 238,24 276,94"
            fill="none"
            stroke="#DC2626"
            strokeWidth={2}
          />
          <circle cx={182} cy={28} r={3.8} fill="#F59E0B" />
          <circle cx={238} cy={24} r={4.2} fill="#DC2626" />
          <text x={212} y={15} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-red-600 dark:fill-red-400">
            1.DIŞTA (%B&gt;1) → 2.İÇTE (%B&lt;1) SAT!
          </text>
          <text x={212} y={132} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-500">
            KURAL #5: CO-LINEARITY YASAK
          </text>
        </g>
      )}

      {diagramType === 'williams_envelopes_vs_bb' && (
        <g>
          {/* Fixed +-3% Envelope (rigid parallel dashed lines) */}
          <path d="M 18,38 L 120,34 L 280,28" fill="none" stroke="#94A3B8" strokeDasharray="4 3" strokeWidth={1.2} />
          <path d="M 18,108 L 120,104 L 280,98" fill="none" stroke="#94A3B8" strokeDasharray="4 3" strokeWidth={1.2} />

          {/* Dynamic StdDev Bollinger + 20 SMA First Pullback Support */}
          <path d="M 18,52 Q 95,18 175,38 T 280,18" fill="none" stroke="#8B5CF6" strokeWidth={1.8} />
          <path d="M 18,74 Q 95,66 175,58 T 280,44" fill="none" stroke="#10B981" strokeWidth={1.8} />
          <path d="M 18,96 Q 95,114 175,78 T 280,72" fill="none" stroke="#8B5CF6" strokeWidth={1.8} />

          {/* Price bouncing on 1st correction off 20 SMA */}
          <polyline
            points="22,94 68,46 106,66 164,34 205,54 268,24"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
          />
          <circle cx={106} cy={66} r={4.5} fill="#10B981" />
          <text x={112} y={82} className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            İLK DÜZELTME DESTEĞİ = DOĞRU MA
          </text>
          <text x={24} y={132} className="text-[7.5px] font-mono fill-slate-500">
            SABİT ±%3 ZARF vs DİNAMİK σ BANDI
          </text>
        </g>
      )}

      {diagramType === 'keltner_atr_anatomy' && (
        <g>
          {/* Smooth Keltner ATR Channel (Orange) */}
          <path
            d="M 18,52 L 105,50 Q 155,46 205,28 L 282,16"
            fill="none"
            stroke="#F97316"
            strokeWidth={2}
          />
          <path
            d="M 18,74 L 105,72 Q 155,68 205,50 L 282,38"
            fill="none"
            stroke="#F59E0B"
            strokeDasharray="3 2"
            strokeWidth={1.6}
          />
          <path
            d="M 18,96 L 105,94 Q 155,90 205,72 L 282,60"
            fill="none"
            stroke="#F97316"
            strokeWidth={2}
          />
          {/* Bollinger Squeeze compressed inside flat Keltner on the left */}
          <path
            d="M 22,60 L 102,59"
            fill="none"
            stroke="#8B5CF6"
            strokeDasharray="2 2"
            strokeWidth={1.3}
          />
          <path
            d="M 22,86 L 102,85"
            fill="none"
            stroke="#8B5CF6"
            strokeDasharray="2 2"
            strokeWidth={1.3}
          />
          {/* Price breaking out and crawling Upper Keltner */}
          <polyline
            points="22,76 48,68 74,77 102,70 132,48 164,44 198,30 234,26 274,17"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
          />
          <text x={62} y={114} textAnchor="middle" className="text-[8px] font-mono font-bold fill-violet-600 dark:fill-violet-400">
            TTM SQUEEZE (BB&lt;KC)
          </text>
          <text x={218} y={96} textAnchor="middle" className="text-[8px] font-mono font-bold fill-orange-600 dark:fill-orange-400">
            20 EMA ± 2×ATR(14) CRAWL
          </text>
        </g>
      )}

      {diagramType === 'keltner_adx_breakout' && (
        <g>
          {/* Upper Pane: Flat Keltner then Breakout Close above Upper KC */}
          <path d="M 18,36 L 150,36 L 220,26 L 282,18" fill="none" stroke="#F97316" strokeWidth={1.8} />
          <path d="M 18,56 L 150,56 L 220,46 L 282,38" fill="none" stroke="#F59E0B" strokeDasharray="3 2" strokeWidth={1.3} />
          <path d="M 18,76 L 150,76 L 220,68 L 282,60" fill="none" stroke="#F97316" strokeWidth={1.8} />
          <polyline
            points="22,62 56,48 92,64 128,52 158,30 196,22 238,26 276,14"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
          />
          <circle cx={158} cy={30} r={4.5} fill="#16A34A" />
          <text x={156} y={18} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            ÜST KC KIRILIM AL
          </text>

          {/* Lower Sub-Pane: ADX(14) crossing above 20 */}
          <line x1={18} y1={92} x2={282} y2={92} stroke={mutedText} strokeOpacity={0.35} />
          <line x1={18} y1={116} x2={282} y2={116} stroke="#10B981" strokeDasharray="3 2" strokeWidth={1.2} />
          <polyline
            points="22,128 85,126 135,123 158,113 205,98 276,94"
            fill="none"
            stroke="#10B981"
            strokeWidth={2}
          />
          <circle cx={158} cy={113} r={3.5} fill="#10B981" />
          <text x={24} y={112} className="text-[7.5px] font-mono fill-emerald-600 dark:fill-emerald-400">
            ADX = 20 EŞİĞİ
          </text>
          <text x={232} y={134} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            ADX(14) &gt; 20 GÜÇ ONAYI
          </text>
        </g>
      )}

      {diagramType === 'keltner_rsi2_range' && (
        <g>
          {/* Flat Horizontal Keltner Envelopes */}
          <line x1={18} y1={24} x2={282} y2={24} stroke="#F97316" strokeWidth={1.8} />
          <line x1={18} y1={52} x2={282} y2={52} stroke="#F59E0B" strokeDasharray="4 2" strokeWidth={1.5} />
          <line x1={18} y1={80} x2={282} y2={80} stroke="#F97316" strokeWidth={1.8} />
          {/* Protective Stop below Lower Keltner */}
          <line x1={96} y1={90} x2={210} y2={90} stroke="#DC2626" strokeDasharray="3 2" strokeWidth={1.3} />
          <polyline
            points="24,48 68,40 112,68 156,50 202,30 248,46"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2}
          />
          <circle cx={112} cy={68} r={4.5} fill="#16A34A" />
          <circle cx={202} cy={30} r={4.5} fill="#0EA5E9" />
          <text x={242} y={92} className="text-[7.5px] font-mono font-bold fill-red-600 dark:fill-red-400">
            STOP (ALT KC ALTI)
          </text>

          {/* 2-Period RSI (10 / 90) Sub-pane */}
          <line x1={18} y1={104} x2={282} y2={104} stroke="#0EA5E9" strokeDasharray="2 2" />
          <line x1={18} y1={130} x2={282} y2={130} stroke="#16A34A" strokeDasharray="2 2" />
          <polyline
            points="24,116 68,107 112,135 156,115 202,100 248,118"
            fill="none"
            stroke="#A855F7"
            strokeWidth={1.8}
          />
          <text x={112} y={142} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            AL: RSI(2)&lt;10
          </text>
          <text x={202} y={101} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            TP: RSI(2)&gt;90
          </text>
        </g>
      )}

      {diagramType === 'keltner_stochrsi_pullback' && (
        <g>
          {/* Upward Sloping Keltner Channel */}
          <line x1={18} y1={56} x2={282} y2={14} stroke="#F97316" strokeWidth={1.8} />
          <line x1={18} y1={78} x2={282} y2={36} stroke="#F59E0B" strokeDasharray="4 2" strokeWidth={1.6} />
          <line x1={18} y1={100} x2={282} y2={58} stroke="#F97316" strokeWidth={1.8} />

          {/* Price hugs upper band, pulls back to 20 EMA middle band, resumes up */}
          <polyline
            points="24,72 64,48 98,42 142,58 192,28 242,20 276,16"
            fill="none"
            stroke={strokeMain}
            strokeWidth={2.1}
          />
          <circle cx={142} cy={58} r={4.8} fill="#16A34A" />
          <text x={144} y={74} textAnchor="middle" className="text-[8px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400">
            20 EMA PULLBACK AL
          </text>

          {/* StochRSI Oversold Bullish Cross */}
          <line x1={18} y1={124} x2={282} y2={124} stroke="#16A34A" strokeDasharray="2 2" />
          <polyline
            points="24,114 92,104 134,132 152,122 212,102 274,104"
            fill="none"
            stroke="#38BDF8"
            strokeWidth={1.8}
          />
          <circle cx={142} cy={127} r={3.8} fill="#16A34A" />
          <text x={150} y={140} textAnchor="middle" className="text-[7.5px] font-mono font-bold fill-sky-600 dark:fill-sky-400">
            STOCH RSI (≤20) YUKARI KESİŞİM
          </text>
        </g>
      )}
    </svg>
  );
}
