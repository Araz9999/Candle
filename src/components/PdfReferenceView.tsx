import { useState } from 'react';
import { BookOpen, Download, FileText } from 'lucide-react';

interface ReferenceDoc {
  id: string;
  kind: 'pdf' | 'web_guide';
  title: string;
  description: string;
  url: string;
  downloadName?: string;
}

const DOCUMENTS: ReferenceDoc[] = [
  {
    id: 'matriks_mum',
    kind: 'pdf',
    title: '01. Matriks Mum Formasyonlar (26s)',
    description:
      '21 Boğa ve 13 Ayı mum formasyonu, teyit seviyeleri, stoploss kuralları ve onay yaşam döngüsü.',
    url: '/assets/aistudio/_mum-formasyonlar__1__4664f1c4.pdf',
    downloadName: 'Matriks_Mum_Formasyonlar.pdf',
  },
  {
    id: 'grafik_okuma',
    kind: 'pdf',
    title: '02. Grafik Okuma Teknikleri (10s)',
    description:
      'Destek/Direnç bölgeleri, Trend çizgileri ve kanalları, Boşluklar, Sıkışma ve Üçgen formasyonları, Bollinger, MACD (12,26,9) ve Fibonacci.',
    url: '/assets/aistudio/pdf-grafik-okuma-teknikleri-mum-grafigi_compress__1__1ed0b621.pdf',
    downloadName: 'Grafik_Okuma_Teknikleri_Mum_Grafigi.pdf',
  },
  {
    id: 'candlestick_bible',
    kind: 'pdf',
    title: '03. Candlestick Trading Bible (168s)',
    description:
      'Munehisa Homma Price Action felsefesi: Piyasa Yapısı (HH/HL & Choppy Filtre), Top-Down Analizi, Arz/Talep Bölgeleri, Pin Bar %50 Giriş, Inside Bar Fakey ve 1:2 R:R Sermaye Yönetimi.',
    url: '/assets/aistudio/the-candlestick-trading-bible-_KohanFx.com___1__bbd52e4b.pdf',
    downloadName: 'The_Candlestick_Trading_Bible.pdf',
  },
  {
    id: 'greg_morris',
    kind: 'pdf',
    title: '04. Greg Morris — Candlestick Charting (155s)',
    description:
      'Dönüş ve Devam formasyonları, Tek Muma İndirgeme (Pattern Breakdown), Sakata Beş Yöntemi, EMA(10) trend, S&P 100 istatistiksel sıralama, Stokastik %D / RSI(14) Mum Filtreleme ve CandlePower hacim grafiği.',
    url: '/assets/aistudio/Greg_Morris_-_Candlestick_Charting_Explained_09a9179c.pdf',
    downloadName: 'Greg_Morris_Candlestick_Charting_Explained.pdf',
  },
  {
    id: 'bollinger_strategy',
    kind: 'pdf',
    title: '05. Bollinger Bands Strategy (7s)',
    description:
      'John Bollinger volatilite döngüsü (Squeeze & Expansion), Bandı Yürümek (Walking the Band), W-Dip / M-Tepe / 3 İtiş yapıları, 50 EMA BBMA Kesişim Sistemi ve RSI(30/70) + Orta Bant Kapanış Stratejisi.',
    url: '/assets/aistudio/Bollinger-Bands-Trading-Strategy_936ab92c.pdf',
    downloadName: 'Bollinger_Bands_Trading_Strategy.pdf',
  },
  {
    id: 'williams_sfu_bollinger',
    kind: 'pdf',
    title: '06. Empirical Optimization of BB — SFU (72s)',
    description:
      'Oliver D. Williams (Simon Fraser University) yüksek lisans tezi: Denklem 5 & 6 Bant İçi Geri Dönüş (Re-Entry) kuralı, N=1..300 varlığa özgü periyot optimizasyonu, Döngü formülü (L/2+1), 3. & 4. Moment (Kurtosis kalın kuyruk) analizi ve Bollinger’ın 15 kuralı.',
    url: '/assets/aistudio/etd2519_a1b07159.pdf',
    downloadName: 'Williams_Empirical_Optimization_of_Bollinger_Bands_SFU.pdf',
  },
  {
    id: 'keltner_trading_strategy',
    kind: 'web_guide',
    title: '07. Keltner Trading Strategy (Web)',
    description:
      'Casey Stubbs (Trading Strategy Guides) Keltner Kanalı rehberi: 20 EMA ± 2 ATR(14) formülü, Bollinger ile farkı, ADX(>20) Kırılım Sistemi, 2-Periyot RSI(10/90) Yatay Piyasa Sistemi ve Güçlü Trend 20 EMA Pullback + StochRSI Sistemi.',
    url: 'https://tradingstrategyguides.com/keltner-trading-strategy/',
  },
  {
    id: 'cci_50_trading',
    kind: 'pdf',
    title: '08. The 50 CCI Trading (38s)',
    description:
      'Buzz / Traders Haven: 34 EMA (Cyan/Kahve) ve 50 CCI Sistemi, 50 CCI Sıfır Hattı = Düz 50 EMA, 14 EMA = 14 CCI Sıfır Çizgisi, 204 EMA (6:1 Üst Zaman Dilimi 34 EMA Eşdeğeri), Setup 1 (5034 Dönüş), Setup 2 (5034z İlk Düzeltme / ZLR) ve Setup 3 (50140 Güçlü Trend Devam).',
    url: '/assets/aistudio/anintroductiontosuccessfultradingusingthe50cci_6841fff8.pdf',
    downloadName: 'An_Introduction_To_Successful_Trading_Using_The_50_CCI.pdf',
  },
  {
    id: 'courtney_capital_strategy',
    kind: 'pdf',
    title: '09. Courtney Capital (31s)',
    description:
      'Courtney Capital Private Wealth (Neville Chester): "My Favourite Trading Strategy" — Slow Stochastic (13, 8, 4) ve Commodity Channel Index (CCI 20) dual osilatör sistemi. George Lane hız yasası, 0.015 katsayılı CCI formülü, eşzamanlı (coincidental) trend kopuşları vs öncü uyumsuzluklar (divergence), Neville Chester\'ın "Trendde Aşırı Alım/Satımı Yok Say (Ignore)" kuralı ve kusursuz çift teyitli tetik çizgisi giriş modeli.',
    url: '/assets/aistudio/Neville-Friday-8-Feb-2013_eb6c6fc0.pdf',
    downloadName: 'Courtney_Capital_My_Favourite_Trading_Strategy.pdf',
  },
];

export function PdfReferenceView() {
  const [selectedDocId, setSelectedDocId] = useState<string>(DOCUMENTS[0].id);
  const activeDoc = DOCUMENTS.find((d) => d.id === selectedDocId) || DOCUMENTS[0];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-6 flex flex-col h-[calc(100vh-65px)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full">
            {DOCUMENTS.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedDocId(doc.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedDocId === doc.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>

          <div className="hidden 2xl:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate max-w-xl">{activeDoc.description}</span>
          </div>
        </div>

        {activeDoc.kind === 'pdf' ? (
          <a
            href={activeDoc.url}
            download={activeDoc.downloadName}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Seçili PDF İndir</span>
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 whitespace-nowrap shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
            <span>Web Kaynak Özeti</span>
          </span>
        )}
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]">
        {activeDoc.kind === 'pdf' ? (
          <iframe
            key={activeDoc.url}
            src={activeDoc.url}
            title={activeDoc.title}
            className="w-full h-full border-0 bg-white dark:bg-slate-900"
          />
        ) : (
          <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
            <div className="pb-5 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-mono text-orange-600 dark:text-orange-400">
                KAYNAK 07 · TRADING STRATEGY GUIDES · CASEY STUBBS
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Keltner Trading Strategy — Three Proven Ways for Success
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
                Referans Adresi: {activeDoc.url}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl pt-1">
                Bu teknik rehber; Chester Keltner tarafından geliştirilen ve 20-periyot Üstel Hareketli
                Ortalama (20 EMA) ile Ortalama Gerçek Aralık (ATR 14) tabanlı volatilite zarflarını
                kullanan Keltner Kanalı’nın kırılım, yatay konsolidasyon ve güçlü trend geri çekilmesi
                (pullback) ortamlarında nasıl uygulanacağını kurallı olarak tanımlar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  1. Keltner Kanalı Formülü &amp; İdeal Parametreler
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">Orta Bant:</strong>{' '}
                    <span className="font-mono">20-Periyot EMA</span> (Üstel Hareketli Ortalama)
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">Üst Zarf (Upper Envelope):</strong>{' '}
                    <span className="font-mono">20 EMA + (2 × ATR 14)</span>
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">Alt Zarf (Lower Envelope):</strong>{' '}
                    <span className="font-mono">20 EMA - (2 × ATR 14)</span>
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">Bollinger Bandı’ndan Farkı:</strong>{' '}
                    Bollinger <span className="font-mono">20 SMA ± 2σ</span> (standart sapma) kullandığı için
                    ani mum boyu sıçramalarında aşırı genişler; Keltner ise{' '}
                    <span className="font-mono">ATR</span> kullandığından daha pürüzsüz bir kanal çizer.
                    Bollinger Bantları Keltner içine sıkıştığında <strong>TTM Volatilite Sıkışması</strong> oluşur.
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  2. Trend vs Yatay Piyasa Okuması (~%70 Konsolidasyon)
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-emerald-700 dark:text-emerald-400">Güçlü Boğa / Ayı Trendi:</strong>{' '}
                    Kanal net biçimde yukarı (veya aşağı) eğim kazanır; fiyat Üst (veya Alt) Keltner
                    bandına yapışarak sürünür (crawl) ve düzeltmelerde genellikle karşı banda inmeden{' '}
                    <span className="font-mono">20 EMA</span> orta bandından döner.
                  </li>
                  <li>
                    <strong className="text-sky-700 dark:text-sky-400">Yatay Piyasa (Ranging):</strong>{' '}
                    Piyasa zamanının yaklaşık %70’inde yatay kalır; Keltner zarfları düz/yatay bir hal
                    alır ve fiyat dış bantlara ulaşmakta zorlanarak orta bant etrafında salınır.
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-2.5">
                <div className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400">
                  KANITLANMIŞ YÖNTEM #1
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Keltner Kırılımı + ADX (14) &gt; 20 Sistemi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Yatay konsolidasyondan çıkan patlayıcı trendleri yakalarken sahte kırılımları ADX trend
                  gücü eşiği ile filtreler:
                </p>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                  <li>Keltner zarfları önce düz/yatay seyretmelidir (<span className="font-mono">ADX &lt; 20</span> konsolidasyon).</li>
                  <li>Mum kapanışı Üst Keltner Bandı üzerinde (AL) veya Alt Bant altında (SAT) gerçekleşir.</li>
                  <li>Aynı anda <span className="font-mono">ADX(14) &gt; 20</span> üzerine çıkarak yükselmelidir.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-2.5">
                <div className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400">
                  KANITLANMIŞ YÖNTEM #2
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Yatay Keltner + 2-Periyot RSI (10 / 90)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Yatay piyasalarda fiyat dış bantlara değmeden döndüğü için ultra-hızlı 2 periyotluk RSI
                  aşırı uçlarıyla işlem açılır:
                </p>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                  <li>Keltner kanalı yatay/düz olmalıdır.</li>
                  <li>
                    <strong>AL:</strong> Fiyat <span className="font-mono">20 EMA</span> orta bandın altına kırar ve{' '}
                    <span className="font-mono">RSI(2) &lt; 10</span> olur (SAT için orta bant üstü +{' '}
                    <span className="font-mono">RSI(2) &gt; 90</span>).
                  </li>
                  <li>
                    <strong>Stop &amp; Kar Al:</strong> Koruyucu stop Alt (veya Üst) Keltner Bandı’nın dışına
                    gizlenir; <span className="font-mono">RSI(2)</span> karşı uca (90 / 10) ulaştığında kar alınır.
                  </li>
                </ol>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-2.5">
                <div className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400">
                  KANITLANMIŞ YÖNTEM #3
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Güçlü Trend 20 EMA Pullback + StochRSI
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Güçlü trendlerde dış bandı kovalamak yerine orta bant düzeltmesinden düşük riskli
                  yeniden katılım sağlar:
                </p>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                  <li>Fiyat yakın geçmişte dış Keltner bandında sürünerek güçlü trendi kanıtlamalıdır.</li>
                  <li>Fiyat <span className="font-mono">20 EMA</span> orta bandına doğru sağlıklı düzeltme (pullback) yapar.</li>
                  <li>
                    <span className="font-mono">Stochastic RSI</span> aşırı satım (<span className="font-mono">≤ 20</span>)
                    bölgesinden yukarı kesişim (<span className="font-mono">%K &gt; %D</span>) yaptığında AL (düşüşte{' '}
                    <span className="font-mono">≥ 80</span> aşağı kesişimde SAT) tetiklenir.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
