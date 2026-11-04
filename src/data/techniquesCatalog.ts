import type { TechniqueGuideItem } from '../types/market';

export const TECHNIQUES_CATALOG: TechniqueGuideItem[] = [
  // =========================================================================
  // BUZZ / TRADERS HAVEN — 50 CCI & 34 EMA STRATEJİSİ (4 MODÜL)
  // =========================================================================
  {
    id: 'cci_50_34_anatomy',
    sourceBook: '50 CCI Stratejisi',
    category: 'İndikatör & Fibonacci',
    title: '50 CCI & 34 EMA Sistemi Anatomisi ve İndikatör Eşdeğerlikleri',
    subtitle: '34 EMA Eğimi, 50 CCI Sıfır Çizgisi = Düz 50 EMA, 14 EMA = 14 CCI ve 204 EMA (6:1 HTF)',
    pdfPage: '50 CCI s. 1–9, 32–38',
    overlayKey: 'showCCI50',
    diagramType: 'cci_50_34_anatomy',
    summary:
      "Buzz ve Traders Haven tarafından geliştirilen sistemde; 34 EMA ana dinamik denge ve trend filtresidir (Cyan: yükseliş, Kahverengi/Kırmızı: düşüş). 50 CCI, eğimsiz düz bir 50 EMA'ya eşdeğerdir ve sıfır çizgisi geçişi fiyatın 50 EMA'yı kırmasıyla birebir örtüşür. 14 EMA kesişimi 14 CCI sıfır hattını, 204 EMA ise 6 kat büyük üst zaman diliminin (3000v / 500v) 34 EMA dengesini temsil eder.",
    rules: [
      '34 EMA Renk & Eğim Disiplini: 34 EMA yukarı eğimliyken cyan (boğa), aşağı eğimliyken koyu kahverengi/kırmızı (ayı) renge bürünür. Fiyat ve 34 EMA aynı yöndeyken ters yönde kontrat açılmaz.',
      "50 CCI Sıfır Çizgisi = Düz 50 EMA: 50 CCI'ın sıfır çizgisini yukarı kesip yeşil histogram üretmesi, fiyatın düz 50 EMA üzerine yerleştiğini gösterir. Sıfır altı kırmızı histogram ayı bölgesidir.",
      "204 EMA ve Chop Filtresi: 204 EMA, 6:1 oranındaki üst zaman diliminin 34 EMA'sıdır (örn. 500v grafikte 3000v 34 EMA). 14 CCI ±100 bandı içine sıkışıp 14 EMA düzleştiğinde piyasa testerededir (chop); kırılımlardan kaçınılmalıdır.",
    ],
  },
  {
    id: 'cci_5034_reversal',
    sourceBook: '50 CCI Stratejisi',
    category: 'Seviye & Trend',
    title: 'Setup 1: "5034" Trend Dönüş Kesişimi (Reversal Trade)',
    subtitle: "Fiyatın 34 EMA'yı ve 50 CCI'ın Sıfır Çizgisini Aynı Anda Kırarak Kapanması",
    pdfPage: '50 CCI s. 10–19',
    overlayKey: 'showCCI50',
    diagramType: 'cci_5034_reversal',
    summary:
      '5034 kurulumu, tükenen bir trendin ardından yeni bir trendin doğuşunu haber veren ana dönüş formasyonudur. Genellikle bir destek/direnç seviyesi testi veya 50 CCI üzerinde "Shamu" (çift dip/tepe) yapısıyla olgunlaşır. Tetikleyici kural: Fiyatın 34 EMA\'yı kırıp üzerinde/altında kapanması ve AYNI ANDA 50 CCI\'ın sıfır çizgisini kırarak histogram rengini değiştirmesidir.',
    rules: [
      "Alış Tetikleyicisi (5034 Buy): Düşüş trendi sonrası fiyatın 34 EMA üzerine çıkıp kapanması + 50 CCI göstergesinin sıfır çizgisini yukarı kırarak yeşil renk alması. Bar kapanışında işleme girilir.",
      "Satış Tetikleyicisi (5034 Sell): Yükseliş trendi sonrası fiyatın 34 EMA altına inip kapanması + 50 CCI göstergesinin sıfır çizgisini aşağı kırarak kırmızı renk alması. Bar kapanışında satış açılır.",
      "Zorunlu İki Şart: Fiyat 34 EMA'yı kırdığı halde 50 CCI sıfırı geçememişse veya 50 CCI sıfırı kestiği halde fiyat 34 EMA'yı kıramamışsa işlem GEÇERSİZDİR; her iki teyit eşzamanlı olmalıdır.",
    ],
  },
  {
    id: 'cci_5034z_pullback',
    sourceBook: '50 CCI Stratejisi',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Setup 2: "5034z" İlk Düzeltme Girişi (ZLR — Zero Line Reject)',
    subtitle: '5034 Dönüşü Sonrası 34 EMA Denge Testi ve 14 CCI Sıfır Çizgisi Reddi Kancası',
    pdfPage: '50 CCI s. 20–26',
    overlayKey: 'showCCI50',
    diagramType: 'cci_5034z_pullback',
    summary:
      "5034 dönüşünü kaçıranlar veya trend yönünde ek pozisyon almak isteyenler için en yüksek olasılıklı ilk geri çekilme taktiğidir. 5034 patlamasından sonra (genellikle 5–8 bar sürer) piyasa dengelenmek üzere 34 EMA'ya geri çekilir. Bu esnada 14 CCI sıfır hattına yaklaşır ve sıfır çizgisinden sekerek kanca (ZLR - Zero Line Reject) oluşturur.",
    rules: [
      '5034 Önkoşulu: Bu kurulum yalnızca yakın geçmişte başarılı bir 5034 dönüşü gerçekleşmiş ve 50 CCI sıfırın trend tarafında kaldığı (yeşil/kırmızı) durumlarda aranır.',
      "34 EMA Denge Bölgesi: Fiyat geri çekilerek 34 EMA çizgisine dokunur veya çok yakınına gelir; 34 EMA dinamik destek/direnç işlevi görerek fiyatı savurur.",
      '14 CCI ZLR Kancası: 14 CCI sıfır çizgisi bandında (yaklaşık -35..+35) yönünü tekrar ana trende çevirerek keskin bir "kanca" yapar. Kanca tamamlandığı an trend yönünde işleme girilir.',
    ],
  },
  {
    id: 'cci_50140_continuation',
    sourceBook: '50 CCI Stratejisi',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Setup 3: "50140" Güçlü Trend Yeniden Girişi (V-Pullback Re-Entry)',
    subtitle: 'Derin Düzeltme Sonrası 14 CCI Sıfır Kırılımı ve Üst Zaman Dilimi ZLR Büyütmesi',
    pdfPage: '50 CCI s. 27–31',
    overlayKey: 'showCCI50',
    diagramType: 'cci_50140_continuation',
    summary:
      "Oturmuş ve güçlü bir trendde (50 CCI sıfırdan oldukça uzak, ±50 veya ±100 seviyelerine yakınken) fiyatın 14 EMA'yı delip 34 EMA'ya doğru daha derin bir V-düzeltmesi yapmasıyla oluşur. Bu esnada 14 CCI derin karşıt bölgeye (±75..200) çekilir. Düzeltme bittiğinde 14 CCI sıfır çizgisini ana trend yönünde tekrar kırdığında ve fiyat 14 EMA üzerine kapandığında muazzam bir trend devam girişi sağlanır.",
    rules: [
      'Oturmuş Trend Şartı: 5034 ve 5034z aşamaları geride kalmış, 50 CCI trend yönünde güçlü pozitif/negatif bölgede kalmaya devam etmelidir.',
      '14 CCI Derin Düzeltmesi: 14 CCI karşıt aşırı bölgeye (-75..-200 veya +75..+200) savrulur; fakat 50 CCI sıfırın ters tarafına geçmez (spread rengini korur).',
      "14 CCI Sıfır Kırılımı (Zero Cross): 14 CCI sıfır çizgisini trend yönünde tekrar kesip kapandığı an (fiyatın 14 EMA'yı geri kazanmasıyla) işleme girilir. Bu kurulum, üst zaman dilimindeki bir ZLR'nin mikroskobik büyütmesidir.",
    ],
  },
  // =========================================================================
  // CASEY STUBBS (TRADING STRATEGY GUIDES) — KELTNER TRADING STRATEGY (4 MODÜL)
  // =========================================================================
  {
    id: 'keltner_atr_channel_anatomy',
    sourceBook: 'Keltner Stratejisi',
    category: 'İndikatör & Fibonacci',
    title: 'Keltner Kanalı Anatomisi (20 EMA ± 2 ATR) ve Bollinger Farkı',
    subtitle: 'Standart Sapma Yerine Ortalama Gerçek Aralık (ATR) ile Pürüzsüz Volatilite Zarfı',
    pdfPage: 'TSG Keltner Rehberi · Bölüm 1–2',
    overlayKey: 'showKeltner',
    diagramType: 'keltner_atr_anatomy',
    summary:
      'Chester Keltner tarafından geliştirilen ve Linda Raschke / Casey Stubbs kurallarıyla modernize edilen Keltner Kanalı; merkezde 20 periyot Üstel Hareketli Ortalama (20 EMA), dış zarflarda ise ±2 × ATR(14) kullanır. Standart sapma kullanan Bollinger’a kıyasla ani fiyat iğnelerine aşırı tepki vermez ve trend eğimini çok daha pürüzsüz gösterir.',
    rules: [
      'İdeal Parametre Seti: Orta Bant = 20 EMA, Üst Zarf = 20 EMA + (2 × ATR 14), Alt Zarf = 20 EMA - (2 × ATR 14). Piyasa zamanının yaklaşık %70’inde yatay konsolidasyonda, %30’unda yönlü trendde kalır.',
      'Güçlü Trend İmzası (Band Crawl): Kanal yukarı/aşağı eğimliyken fiyat dış zarfa yapışarak sürünür (hug/crawl); sağlıklı düzeltmeler genellikle karşı banda inmeden 20 EMA orta bandında sonlanır.',
      'TTM Volatilite Sıkışması (BB < KC): Bollinger Bantları daralarak tamamen Keltner Kanalı’nın içine girdiğinde piyasa barut fıçısı gibi enerji biriktirir; zarf dışına ilk kapanış patlayıcı trend başlatır.',
    ],
  },
  {
    id: 'keltner_adx20_breakout',
    sourceBook: 'Keltner Stratejisi',
    category: 'Seviye & Trend',
    title: 'Kanıtlanmış Yöntem #1: Keltner Kırılımı + ADX (14) > 20 Güç Filtresi',
    subtitle: 'Yatay Konsolidasyondan Patlayıcı Trende Geçişte Sahte Kırılımları Eleme',
    pdfPage: 'TSG Keltner Rehberi · Yöntem #1',
    overlayKey: 'showKeltner',
    diagramType: 'keltner_adx_breakout',
    summary:
      'Keltner dış bandının her delinmesi gerçek bir trend başlatmaz. Sahte kırılımlardan (false breakout) korunmak için önce Keltner zarflarının yataylaşması (konsolidasyon) beklenir, ardından dış bant kırılımı ADX(14) göstergesinin 20 eşiğini yukarı kesmesiyle doğrulanır.',
    rules: [
      'Adım 1 — Yatay Zarf Hazırlığı: Keltner üst ve alt bantları düzleşerek yatay bir kanal oluşturmalı (ADX < 20 düşük trend gücü / birikim evresi).',
      'Adım 2 — Dış Bant Kapanışı: Alış için mum kapanışı Üst Keltner Bandı’nın üzerinde; satış için Alt Keltner Bandı’nın altında gerçekleşmelidir.',
      'Adım 3 — ADX > 20 Onayı: Kırılım anında ADX(14) çizgisi 20 seviyesinin üzerine çıkmalı ve yukarı eğimli olmalıdır; ADX 20 altında kalıyorsa kırılım zayıftır.',
    ],
  },
  {
    id: 'keltner_rsi2_range_system',
    sourceBook: 'Keltner Stratejisi',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Kanıtlanmış Yöntem #2: Yatay Keltner + 2-Periyot RSI (10 / 90) Sistemi',
    subtitle: 'Yatay Piyasalarda Orta Bant Altı Aşırı Uç Girişi ve Dış Bant Arkası Koruyucu Stop',
    pdfPage: 'TSG Keltner Rehberi · Yöntem #2',
    overlayKey: 'showKeltner',
    diagramType: 'keltner_rsi2_range',
    summary:
      'Piyasanın yatay seyrettiği (~%70) dönemlerde fiyat dış Keltner bantlarına ulaşmakta zorlanır ve 20 EMA etrafında salınır. Bu ortamda ultra-hassas 2 periyotluk RSI (90 / 10 eşikleri) kullanılarak kısa vadeli aşırı satım/alım geri dönüşleri yakalanır.',
    rules: [
      'Alış Kurulumu (Buy Range): Keltner bantları yatayken fiyat Orta Bandın (20 EMA) altına iner ve aynı anda 2-Periyot RSI 10 seviyesinin altına (< 10) düşerse AL sinyali doğar.',
      'Satış Kurulumu (Sell Range): Keltner bantları yatayken fiyat Orta Bandın (20 EMA) üzerine çıkar ve 2-Periyot RSI 90 seviyesinin üzerine (> 90) tırmanırsa SAT sinyali doğar.',
      'Dış Zarf Stopu & Kar Al: Koruyucu stoploss doğrudan Alt (veya Üst) Keltner Bandı’nın dış tarafına gizlenir; 2-Periyot RSI karşı uca (alışta ≥ 90, satışta ≤ 10) ulaştığında kar alınır.',
    ],
  },
  {
    id: 'keltner_stochrsi_pullback',
    sourceBook: 'Keltner Stratejisi',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Kanıtlanmış Yöntem #3: Güçlü Trend 20 EMA Pullback + StochRSI Kesişimi',
    subtitle: 'Trend Yönünde Orta Bant Dinamik Desteğinden Düşük Riskli Yeniden Katılım',
    pdfPage: 'TSG Keltner Rehberi · Yöntem #3',
    overlayKey: 'showKeltner',
    diagramType: 'keltner_stochrsi_pullback',
    summary:
      'Fiyatın dış Keltner bandına yapışarak güçlü bir trend başlattığı durumlarda tepeden kovalamak yerine, fiyatın 20 EMA (Orta Bant) değer bölgesine geri çekilmesi (pullback) ve Stochastic RSI göstergesinin aşırı bölgeden kesişim üretmesi beklenir.',
    rules: [
      'Trend Ön-Koşulu: Fiyat yakın geçmişte Üst Keltner Bandı boyunca tırmanmış (veya düşüşte Alt Bantta sürünmüş) ve kanal net biçimde eğim kazanmış olmalıdır.',
      '20 EMA Değer Bölgesi Testi: Yükseliş trendinde düzeltme dalgası Keltner Orta Bandı’na (20 EMA) kadar geri çekilmeli ancak Alt Keltner Bandı’nı kırmamalıdır.',
      'Stochastic RSI Tetikleyicisi: Fiyat 20 EMA bölgesindeyken StochRSI aşırı satım (≤ 20) bölgesinde yukarı kesişim (%K > %D) yaptığında trend yönünde AL işlemi açılır (düşüşte ≥ 80 aşağı kesişim SAT).',
    ],
  },

  // =========================================================================
  // OLIVER D. WILLIAMS (SFU, 2006) — EMPIRICAL OPTIMIZATION OF BOLLINGER BANDS (5 MODÜL)
  // =========================================================================
  {
    id: 'williams_eq5_eq6_reentry',
    sourceBook: 'Ampirik Optimizasyon (SFU)',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Denklem 5 & 6: Bant Dışından İçe Dönüş (Re-Entry) İşlem Kuralı',
    subtitle: 'Aşırı Bölgede Kalma Süresi Belirsizliğini Çözen Ampirik Kesişim Denklemi',
    pdfPage: 'Williams SFU s. 30 – 31 (Tez s. 20 – 21)',
    overlayKey: 'showBollinger',
    diagramType: 'williams_eq5_eq6_reentry',
    summary:
      'Oliver Williams’ın 3.362 işlem günü üzerinde test ettiği temel kurala göre, bir varlığın aşırı alım (> +2σ) veya aşırı satım (< -2σ) bölgesinde ne kadar süre kalacağı öngörülemez. Bu nedenle pozisyon fiyat bant dışındayken değil, ekstrem bölgeden çıkıp bandın içine geri döndüğü anda açılır.',
    rules: [
      'Denklem 5 — Alım Kuralı (Buy Re-Entry): P(t-1) < BB_low(t-1) ve P(t) > BB_low(t). Fiyat bir önceki barda alt bandın altındayken mevcut barda alt bandı aşağıdan yukarı keserek kanal içine döndüğünde AL sinyali üretilir.',
      'Denklem 6 — Satım Kuralı (Sell Re-Entry): P(t-1) > BB_up(t-1) ve P(t) < BB_up(t). Fiyat bir önceki barda üst bandın üzerindeyken mevcut barda üst bandı yukarıdan aşağı delerek kanal içine döndüğünde SAT sinyali üretilir.',
      'Rasyonel Ardışık İşlem Disiplini: Aynı yönde üst üste iki alım veya iki satım biriktirilmez; açılan her pozisyon karşıt kural gerçekleştiğinde rasyonel kar/nakit dengesiyle kapatılır.',
    ],
  },
  {
    id: 'williams_asset_specific_ma',
    sourceBook: 'Ampirik Optimizasyon (SFU)',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Varlığa Özgü Optimal Periyot (N*) ve Döngü Formülü (L/2 + 1)',
    subtitle: 'Tek Bir Sabit 20 Periyodun Tüm Piyasalarda Geçerli Olmadığının Ampirik Kanıtı',
    pdfPage: 'Williams SFU s. 4, 17, 26, 33 – 36',
    overlayKey: 'useAdaptiveBollinger',
    diagramType: 'williams_ma_optimization',
    summary:
      'DOW 30 bileşenlerinde N = 1’den 300’e kadar kurulan 300×30 getiri matrisi ve korelasyon/p-değeri testleri (Tablo 4–8), sabit 20 günlük ortalamanın her enstrüman için optimal olmadığını kanıtlar. Her varlığın kendi iş/fiyat döngüsüne (Cycle) uygun optimal penceresi (N*) hesaplanmalıdır.',
    rules: [
      'Denklem 1 — İdeal Ortalama Uzunluğu: Ideal MA = (Döngü Uzunluğu / 2) + 1 formülüyle varlığın baskın tepe-dip döngüsüne göre teorik merkez pencere bulunur.',
      'Tablo 1 — Piyasa Döngüsü Sınıfları (Achelis): Çok Kısa Vade 5–13 bar, Kısa Vade 14–25 bar, Minör Orta Vade 26–49 bar, Orta Vade 50–100 bar ve Uzun Vade 100–200 bar.',
      'Ampirik Optimizasyon: 10 periyottan kısa ortalamalar güvenilmezdir; her enstrüman için geçmiş fiyat serisi üzerinde N* pencere taraması yapılarak o varlığa özgü en yüksek getirili Bollinger periyodu seçilmelidir.',
    ],
  },
  {
    id: 'williams_kurtosis_fat_tails',
    sourceBook: 'Ampirik Optimizasyon (SFU)',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Getiri Dağılımı 3. & 4. Momentler: Çarpıklık ve Kalın Kuyruk (Kurtosis > 3)',
    subtitle: 'Normal Dağılım (%95 Kapsama) Varsayımının Sınırları ve Uç Değer (Outlier) Riski',
    pdfPage: 'Williams SFU s. 11 – 12, 27, 32 – 33',
    overlayKey: 'showBollinger',
    diagramType: 'williams_kurtosis_moments',
    summary:
      'Teorik normal dağılımda ±2 standart sapma fiyat hareketlerinin %95’ini kapsar (Çarpıklık = 0, Basıklık/Kurtosis = 3). Ancak Williams’ın Tablo 3 moment analizleri, finansal getirilerde 4. momentin (Kurtosis) sistematik olarak 3’ten büyük (5.4 – 70.9) yani "kalın kuyruklu (leptokurtik)" olduğunu gösterir.',
    rules: [
      'Kalın Kuyruk (Leptokurtik) Gerçeği: Kurtosis > 3 olan enstrümanlar normal dağılıma göre çok daha sık "uç fiyat sıçraması (outlier)" üretir; dolayısıyla ±2σ dışına taşmalar beklenen %5’ten daha sık yaşanır.',
      'Bollinger Kural #13: Standart sapma hesabı küçük örneklemde (ör. 20 bar) istatistiksel normallik garantisi vermez; bant temaslarını mutlak olasılık tavanı sanmak yerine göreceli çerçeve olarak okuyun.',
      'Ex-Post Risk vs Tracking Error: Portföy/varlık riskini ölçerken kıyas endeks sapması (tracking error) yerine ortalama etrafındaki gerçek tarihsel varyans ve kuyruk kalınlığı baz alınmalıdır.',
    ],
  },
  {
    id: 'williams_15_bollinger_rules',
    sourceBook: 'Ampirik Optimizasyon (SFU)',
    category: 'İndikatör & Fibonacci',
    title: 'John Bollinger’ın 15 Kuralı, Standart Sapma Ölçekleme ve Uyumsuzluk',
    subtitle: 'Periyot Değiştikçe D Çarpanının (1.9 / 2.0 / 2.1) Ayarlanması ve Çoklu Doğrusallık Yasağı',
    pdfPage: 'Williams SFU s. 24 – 27 (Tez s. 14 – 17)',
    overlayKey: 'useAdaptiveBollinger',
    diagramType: 'williams_15rules_divergence',
    summary:
      'Tezde derlenen John Bollinger’ın 15 temel ilkesi; periyot değiştirildiğinde standart sapma çarpanının nasıl ölçekleneceğini, aynı kategorideki indikatörlerin neden birlikte kullanılmaması gerektiğini (co-linearity) ve bant içi uyumsuzluğu tanımlar.',
    rules: [
      'Kural #11 — Eşzamanlı Standart Sapma Ölçekleme: Ortalama periyodu uzatıldığında σ çarpanı artırılmalı (20 periyotta 2.0 iken 50 periyotta 2.1), kısaltıldığında ise düşürülmelidir (10 periyotta 1.9).',
      'Kural #4 & #5 — Çoklu Doğrusallıktan (Co-Linearity) Kaçınma: Volatilite ve trend zaten Bollinger Bandı’nın içinde yer alır; onay için aynı kategoriden iki indikatör değil bağımsız Momentum (RSI/%D) veya Hacim göstergesi seçilmelidir.',
      'Nominal Yeni Zirvede Göreceli Satış Sinyali (s.24): İlk tepe bant dışında (%B > 1) oluştuktan sonra ikinci tepe fiyatta nominal yeni zirve yapsa bile bant içinde (%B < 1) kalıyor ve indikatör uyumsuzluk veriyorsa güçlü SAT sinyalidir.',
    ],
  },
  {
    id: 'williams_envelopes_centerline',
    sourceBook: 'Ampirik Optimizasyon (SFU)',
    category: 'Seviye & Trend',
    title: 'Hurst & Bomar Zarflarından Bollinger’a Evrim ve Merkez Hat Desteği',
    subtitle: 'Sabit % Zarfların Zayıflığı, İlk Düzeltme Desteği Testi ve Merkez Çizgi Gecikmesi',
    pdfPage: 'Williams SFU s. 14 – 22, 28 – 29',
    overlayKey: 'showBollinger',
    diagramType: 'williams_envelopes_vs_bb',
    summary:
      'J.H. Hurst’ün döngü zarfları ve Marc Chaikin’in verinin %85’ini kapsayan ±%3 Bomar bantları volatilite değişimlerine uyum sağlayamazken, Bollinger standart sapma dönüşümüyle dinamik genişlik sunar. Doğru periyot, dipten ilk yükselişin düzeltmesine destek olan ortalamadır.',
    rules: [
      'Doğru Ortalama Seçim Testi (s.22): Dipten başlayan ilk yükseliş dalgasının geri çekilmesinde ortalama kırılıyorsa periyot çok kısadır; fiyat ortalamaya hiç değmeden dönüyorsa periyot çok uzundur.',
      'Güçlü Trend Kanalı ve Uyarı Kırılımı (s.27–28): Güçlü yükseliş trendinde fiyat Üst Bant ile 20 SMA (orta çizgi) arasında salınır; fiyatın orta çizginin altına inmesi aşağı yönlü trend dönüşü uyarısıdır.',
      'Merkez Hat Gecikmesi (Nortel & Microsoft Vakaları, s.28–29): Güçlü düşüşte tekil merkez hat kesişimleri sahte alım üretebilir veya dip dönüşlerinde merkez hat onayı geç gelebilir; bu yüzden mum formasyonları ve trend analiziyle birlikte okunmalıdır.',
    ],
  },

  // =========================================================================
  // BOLLINGER BANDS TRADING STRATEGY — HOWTOTRADE (4 MODÜL)
  // =========================================================================
  {
    id: 'bb_volatility_squeeze_walk',
    sourceBook: 'Bollinger Stratejisi',
    category: 'İndikatör & Fibonacci',
    title: 'Bollinger Daralması (Squeeze), Genişleme ve Bandı Yürümek',
    subtitle: '20 SMA ± 2 Standart Sapma Volatilite Döngüsü ve Karşı Bant Uyarısı',
    pdfPage: 'Bollinger Stratejisi s. 3 – 4',
    overlayKey: 'showBollinger',
    diagramType: 'bb_squeeze_walk',
    summary:
      'John Bollinger tarafından 1980’lerde geliştirilen bantlar (20 SMA merkez hattı ve ±2 standart sapma kanalı), piyasa volatilitesi arttığında genişler ve düştüğünde daralır. Bantların aşırı sıkışması (Bollinger Squeeze) büyük bir fiyat patlamasının habercisidir.',
    rules: [
      'Bollinger Squeeze (Daralma): Bant genişliği (BandWidth) son periyotların en dar seviyesine indiğinde düşük volatilite birikir; ardından üst veya alt bandın kırılmasıyla sert bir yönlü hareket başlar.',
      'Bandı Yürümek (Walking the Band): Güçlü trendlerde fiyat üst veya alt banda defalarca temas ederek ya da bandı delerek ilerleyebilir; tek başına bant teması kesinlikle otomatik AL/SAT dönüş sinyali değildir.',
      'Karşı Bant Yorulma Sinyali: Güçlü yükseliş trendinde ters yöne (aşağı) açılan alt bandın yön değiştirip içe bükülmesi, volatilite genişlemesinin ve mevcut trendin sonuna yaklaşıldığını işaret eder.',
    ],
  },
  {
    id: 'bb_band_patterns_mistakes',
    sourceBook: 'Bollinger Stratejisi',
    category: 'Formasyon & Boşluk',
    title: 'Bant Üzeri W-Dip, M-Tepe, 3 İtiş ve 3 Kritik Hata Filtresi',
    subtitle: 'Bant Temaslarını Piyasa Bağlamı ve Yapısal Formasyonlarla Okuma',
    pdfPage: 'Bollinger Stratejisi s. 4 – 5',
    overlayKey: 'showBollinger',
    diagramType: 'bb_w_m_pushes',
    summary:
      'Üst veya alt banda ilk temasta aceleyle ters işlem açmak en yaygın hatadır. Karlı işlem için bant temaslarında "Çift Dip (W-Bottom)", "Klasik M-Tepe" veya "Zirveye Üç İtiş (Three Pushes to High)" yapıları ile genel piyasa bağlamı aranmalıdır.',
    rules: [
      'Yapısal Dönüş Onayı: Alt bant dışında oluşan ilk dibin ardından ikinci dibin bant içinde kalması "W-Dip (Double Bottom)"; üst bantta ikinci tepenin bant içinde kalarak zayıflaması "Klasik M-Tepe" veya "Üçlü Zirve İtişi" teyididir.',
      'Hata 1 & 2 — İzole Temas ve Bağlam İhmali: Üst bant kırılımı trend piyasasında güçlü devam anlamı taşırken yatay (range) piyasada sahte kalabilir; destek/direnç ve ana trend yönü göz ardı edilmemelidir.',
      'Hata 3 — Tek Başına Kullanım: Bollinger Bandı gecikmeli (lagging) bir volatilite göstergesidir; mutlaka Hareketli Ortalamalar (50 EMA) veya öncü momentum osilatörleri (RSI) ile birleştirilmelidir.',
    ],
  },
  {
    id: 'bb_bbma_50ema_strategy',
    sourceBook: 'Bollinger Stratejisi',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'BBMA Stratejisi: Bollinger Orta Bandı ve 50 EMA Kesişimi',
    subtitle: 'Trend Dönüşü ve Devamını Yakalayan Çift Ortalama Kesişim Sistemi',
    pdfPage: 'Bollinger Stratejisi s. 5 – 6',
    overlayKey: 'showBollinger',
    diagramType: 'bb_bbma_50ema',
    summary:
      '"BBMA" stratejisi grafiğe Bollinger Bantları (20 SMA merkez hattı) ile birlikte 50 periyotluk Üssel Hareketli Ortalama (50 EMA) eklenerek uygulanır. İki dinamik denge hattının kesişimi net giriş ve çıkış kuralları üretir.',
    rules: [
      'Kurulum: Grafiğe standart Bollinger Bandı (20, 2) ve 50 EMA çizgisi birlikte eklenir.',
      'Giriş Kuralı (BBMA Crossover): Orta Bollinger Bandı (20 SMA) ile 50 EMA yukarı yönlü kesiştiğinde AL (Long), aşağı yönlü kesiştiğinde (50 EMA orta bandın üzerine çıktığında) SAT (Short) pozisyonu açılır.',
      'Çıkış Kuralı: Fiyat hareketi devam ettiği sürece trend sürülür; iki ortalama ters yönde yeniden kesiştiğinde (Opposite Crossover) pozisyon kapatılır.',
    ],
  },
  {
    id: 'bb_rsi_middle_band_strategy',
    sourceBook: 'Bollinger Stratejisi',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Öncü RSI (30/70) + Bollinger Orta Bant Kırılım Stratejisi',
    subtitle: 'Bant Dışı Aşırı Alım/Satım Sonrası Orta Bant Kapanış Onayı ve Swing Stop',
    pdfPage: 'Bollinger Stratejisi s. 6 – 7',
    overlayKey: 'showBollinger',
    diagramType: 'bb_rsi_middle_cross',
    summary:
      'Öncü (leading) bir momentum göstergesi olan RSI(14) ile gecikmeli (lagging) volatilite kanalı Bollinger Bantlarını birleştirerek erken giriş tuzaklarını eler ve yüksek R:R oranlı dönüşleri yakalar.',
    rules: [
      'Adım 1 — Aşırı Bölge ve Bant Dışı Taşma: Fiyatın Bollinger bantlarının dışına taşması (alt bant altı veya üst bant üstü) ve aynı anda RSI(14) göstergesinin 30 altı (aşırı satım) veya 70 üstü (aşırı alım) bölgesine girmesi beklenir.',
      'Adım 2 — Orta Bant Kapanış Tetikleyicisi: Hemen bant dışında girilmez; AL işlemi için fiyatın dönüp Orta Bollinger Bandı (20 SMA) üzerinde mum kapatması, SAT için orta bandın altında kapatması beklenir.',
      'Adım 3 — Zarar Kes ve Hedef: Stop-Loss emri son Swing Dip seviyesinin birkaç kademe altına (SAT için Swing Tepe üstüne) konur; Kar Al (Target) olarak karşı aşırı alım/satım bölgesi (karşı Bollinger Bandı) hedeflenir.',
    ],
  },

  // =========================================================================
  // GREG MORRIS — CANDLESTICK CHARTING EXPLAINED (7 MODÜL)
  // =========================================================================
  {
    id: 'morris_pattern_breakdown',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Tek Muma İndirgeme Analizi (Pattern Breakdown / Reduction)',
    subtitle: 'Çoklu Mum Formasyonunun İçsel Gücünü Test Etme Yöntemi',
    pdfPage: 'Morris s. 13, 21, 29 – 184',
    diagramType: 'morris_breakdown',
    summary:
      'Greg Morris her çoklu mum formasyonunu tek bir bileşik muma indirger: İlk mumun açılışı, formasyon boyunca görülen en yüksek/en düşük fiyat ve son mumun kapanışı birleştirilir. Elde edilen tek mum formasyon yönünü destekliyorsa ek teyit gerekmez; çelişiyorsa teyit zorunludur.',
    rules: [
      'Destekleyen İndirgeme Örneği: Yutan Boğa (Bullish Engulfing), Delen Mumlar (Piercing) ve Sabah Yıldızı (Morning Star) tek muma indirgendiğinde doğrudan bir "Çekiç (Paper Umbrella)" üretir ve yükselişi tam destekler.',
      'Tam Güçlü Devam İndirgemesi: Üç Beyaz Asker ve Yükselen Üç Yöntem (Rising Three Methods) uzun bir "Beyaz Marubozu" mumuna indirgenir.',
      'Çelişen İndirgeme Uyarısı: Ters Çekiç, Güvercin Yuvası, Doji Yıldız ve Üç Çizgi Vuruşu (Three-Line Strike) tek muma indirgendiğinde formasyon yönüyle çelişen bir gövde verir; bu nedenle ertesi barın kapanış teyidi mutlaka beklenmelidir.',
    ],
  },
  {
    id: 'morris_continuation_vs_reversal',
    sourceBook: 'Greg Morris',
    category: 'Formasyon & Boşluk',
    title: 'Devam (Continuation) Formasyonları ve Boyun Hatları Ayrımı',
    subtitle: 'On Neck, In Neck ve Thrusting ile Delen Mumlar (Piercing) Farkı',
    pdfPage: 'Morris s. 46 – 47, 141 – 186',
    diagramType: 'morris_continuation_necks',
    summary:
      'Sakata felsefesine göre devam formasyonları piyasanın "dinlenme ve nefes alma (savaştan mola)" evreleridir. Özellikle düşüş trendinde tepki veren beyaz mumun önceki siyah gövdenin %50 orta noktasını geçip geçememesi dönüş ile devamı birbirinden ayırır.',
    rules: [
      'Boyun Hatları (Ayı Devam): İkinci beyaz mum önceki siyah mumun en düşüğünde kapanırsa On Neck (Ate Kubi), kapanışına yakın kapanırsa In Neck (Iri Kubi), gövde içine girip %50 orta noktasını aşamazsa Thrusting (Sashikomi) olur — üçü de başarısız tepkidir ve düşüşün devam edeceğini gösterir!',
      'Gerçek Dönüş Şartı: İkinci beyaz mum ancak önceki siyah gövdenin %50 orta noktasının ÜZERİNDE kapanırsa Delen Mumlar (Piercing Line) boğa dönüşü sayılır.',
      'Tasuki, Mat Hold ve Three-Line Strike: Trend yönündeki boşluğun kapanmaması (Tasuki Gap) veya üç asker sonrası tek barlık kar satışı silkelemesi (Three-Line Strike) ana trende ekleme fırsatıdır.',
    ],
  },
  {
    id: 'morris_sakata_five_methods',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Munehisa Honma ve Sakata’nın Beş Yöntemi (Fuurin Kazan)',
    subtitle: 'San-zan, San-sen, San-ku, San-pei ve San-poh İlkeleri',
    pdfPage: 'Morris s. 187 – 198, 290',
    diagramType: 'sakata_five_methods',
    summary:
      '1750’lerde Sakata pirinç borsasında işlem yapan Munehisa Honma’nın 160 kuralından doğan Sakata Beş Yöntemi, Japon mum analizinin temel omurgasını ve "3" sayısının piyasa döngüsündeki yerini tanımlar.',
    rules: [
      'San-zan (Üç Dağ) & San-sen (Üç Nehir): Üçlü tepe / Üç Buddha Tepesi (Omuz-Baş-Omuz) ve üçlü dip / üç nehir dönüş yapılarıdır.',
      'San-ku (Üç Boşluk): Dip dönüşünden sonra trend yönünde oluşan 1. boşluk yeni alım gücünü, 2. boşluk ek alımları, 3. boşluk ise panik kapamaları gösterir; Sakata kuralı "3. boşlukta kar al / sat" der.',
      'San-pei (Üç Asker) & San-poh (Üç Yöntem): San-pei kararlı yürüyüşü (Üç Beyaz Asker / Üç Kara Karga) ve bunun yorulma türevlerini (Advance Block, Deliberation); San-poh ise "Al, sat ve dinlen" (Rising/Falling Three Methods) ilkesini temsil eder.',
    ],
  },
  {
    id: 'morris_shinne_hatte_formations',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Sekiz Yeni Fiyat Rekoru (Shinne Hatte) ve Geniş Mum Yapıları',
    subtitle: 'Aşırı Uzamış Hareketlerde 8–10 Rekor Sayımı, Kule ve Tava Dipler',
    pdfPage: 'Morris s. 199 – 208',
    diagramType: 'shinne_hatte_8',
    summary:
      'Japon analizinde tekil 1–5 barlık formasyonların ötesinde, trendin aşırı uzadığını ve olgunlaştığını gösteren çok barlı yapısal mum formasyonları kullanılır.',
    rules: [
      'Eight New Price Lines (Shinne Hatte): Fiyat art arda 8 (bazı kaynaklarda 10 veya 12) yeni tepe rekoru kırdığında alıcı enerjisi aşırı gerilmiştir; kar alınmalı veya koruyucu stop daraltılmalıdır.',
      'Tower Top & Tower Bottom (Kule Tepe/Dip): Uzun gövdeli mumlarla sert inen/çıkan piyasanın küçük geçiş barları sonrası karşıt renkte uzun kule mumlarıyla yön değiştirmesidir.',
      'Fry Pan Bottom (Tava Dip) & Dumpling Top (Mantı Tepe): Küçük gövdeli mumlarla yuvarlanan dip/tepe oluşumunun boşluklu (gap) bir mumla kırılması güçlü trend başlatır.',
    ],
  },
  {
    id: 'morris_ema10_identification',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: '10 Periyot Üstel Ortalama (EMA 10) ve Tanımlama Matematiği',
    subtitle: 'Subjektifliği Kaldıran Kısa Vadeli Trend ve Tolerans Kuralları',
    pdfPage: 'Morris s. 209 – 221',
    diagramType: 'morris_ema10_rules',
    summary:
      'Mum formasyonları kısa vadeli (1–10 bar) yatırımcı psikolojisini ölçer; bir formasyonun geçerli olması için hemen öncesindeki kısa vadeli trendin matematiksel olarak net tanımlanması şarttır.',
    rules: [
      'EMA (10) Kısa Vade Trend Kuralı: Morris’in geniş veri testlerine göre kısa vadeli trendi en hızlı ve güvenilir belirleyen yöntem 10 periyotluk Üstel Hareketli Ortalamadır (Kapanış > EMA10 = Yükseliş, Kapanış < EMA10 = Düşüş).',
      'Uzun/Kısa Gün ve Doji Esnekliği: Uzun mum son 5–10 bar gövde ortalamasının %130 üzeri olmalı; Doji için açılış-kapanış farkına toplam aralığın %1–%3’ü kadar esneklik tanınmalıdır.',
      'Şemsiye (Hammer / Takuri) Oranı: Alt gölge gövdenin en az 2 katı (Takuri için 3 katı), üst gölge ise toplam yüksek-düşük aralığının en fazla %5–%10’u olmalıdır.',
    ],
  },
  {
    id: 'morris_statistical_ranking',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'İstatistiksel Güvenilirlik Sıralaması (S&P 100 ve Vadeli Testleri)',
    subtitle: '82.000+ Bar Verisinde En İstikrarlı İlk 15 Formasyon',
    pdfPage: 'Morris s. 223 – 240',
    diagramType: 'morris_stat_ranking',
    summary:
      'Greg Morris 62 mum formasyonunu S&P 100 hisseleri ve 41 vadeli kontrat üzerinde 3, 5 ve 7 barlık tahmin aralıklarıyla test etmiştir. Newton’un 1. Yasası gereği devam formasyonları mevcut trend avantajını aşmak zorundadır.',
    rules: [
      'En İstikrarlı 6 Dönüş Formasyonu (Tüm Aralıklarda İlk 15): Three Black Crows (Üç Kara Karga), Three White Soldiers (Üç Beyaz Asker), Three Inside Up, Three Outside Down, Dark Cloud Cover (Kara Bulut) ve Three Outside Up.',
      'Kısa vs Orta Vade Uzmanlığı: Identical Three Crows ve Morning Doji Star 3 barlık kısa vadede zirvede yer alırken; Matching Low ve Side-by-Side White Lines 7 barlık pencerede güçlenir.',
      'Harami İyileştirmesi: Tek başına Harami tüm sinyallerin büyük kısmını üretir; Morris’in geliştirdiği 3. gün onaylı "Three Inside Up / Down" ve "Three Outside Up / Down" başarı oranını belirgin biçimde yükseltir.',
    ],
  },
  {
    id: 'morris_filtering_and_candlepower',
    sourceBook: 'Greg Morris',
    category: 'Sakata Yöntemi & Kantitatif Filtreleme',
    title: 'Mum Filtreleme (Pre-Signal Area) ve CandlePower Hacim Grafiği',
    subtitle: 'Stokastik %D & RSI(14) Ön-Sinyal Filtresi + Hacim Genişlikli Mumlar',
    pdfPage: 'Morris s. 241 – 276',
    overlayKey: 'showMorrisFilter',
    diagramType: 'morris_filtering_candlepower',
    summary:
      'Uzun trendler erken (premature) ters mum sinyalleri üretir. Morris’in "Candlestick Filtering" yöntemi, mum formasyonlarını yalnızca osilatör aşırı alım/satım "Ön-Sinyal Alanı (Pre-Signal Area)" içindeyken kabul eder.',
    rules: [
      'Ön-Sinyal Alanı (Pre-Signal Filtering): Stokastik %D(14) < 20, Wilder RSI(14) < 30–35 veya Bollinger %B < 0 bölgesindeyken yalnızca BOĞA mumları; %D > 80, RSI > 65–70 veya %B > 100 bölgesindeyken yalnızca AYI mumları filtrelenir.',
      'Kanıtlanmış Performans Farkı: S&P 100 testinde %D(20/80) ile filtrelenen mumlar işlem sayısını %63 azaltırken işlem başı ortalama kazancı %50 artırmıştır (komisyon ve hatalı sinyalleri eler).',
      'CandlePower (Hacim-Genişlikli Mum): Her mumun yatay gövde kalınlığı o barın işlem hacmiyle orantılı çizilir; geniş gövdeli Yutan Boğa veya yüksek hacimli Sabah Yıldızı kurumsal katılımı anında görünür kılar.',
    ],
  },

  // =========================================================================
  // THE CANDLESTICK TRADING BIBLE — PRICE ACTION, CONFLUENCE & RİSK YÖNETİMİ
  // =========================================================================
  {
    id: 'bible_hh_hl_impulse',
    sourceBook: 'Trading Bible',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Trend Piyasası: HH/HL ile İtki (Impulsive) ve Düzeltme (Retracement)',
    subtitle: 'Profesyoneller İtki Başlangıcında Girer, Düzeltmede Tuzaklanmaz',
    pdfPage: 'Bible s. 51 – 60',
    overlayKey: 'showSupplyDemand',
    diagramType: 'hh_hl_impulse',
    summary:
      'Yükseliş trendi ardışık Daha Yüksek Tepeler (HH) ve Daha Yüksek Dipler (HL); düşüş trendi ise Daha Düşük Tepeler (LH) ve Daha Düşük Dipler (LL) dizisidir. Trend iki dalgadan oluşur: trend yönündeki güçlü İtki (Impulsive) ve ters yöndeki Düzeltme (Retracement).',
    rules: [
      'Altın Kural: Asla bir düzeltme (pullback) hareketinin başında trend yönünde işleme girme; amatörler burada stop avına yakalanır.',
      'En doğru giriş yeri, düzeltme dalgasının önceki swing noktasına (destek olmaya başlayan eski direnç) ulaşıp Pin Bar / Engulfing üreterek yeni İtki Dalgasını başlattığı andır.',
      'Piyasa yapısını belirlerken küçük zaman dilimleri (5dk) yerine her zaman 4S ve Günlük (1G) grafikleri baz al.',
    ],
  },
  {
    id: 'bible_ranging_vs_choppy',
    sourceBook: 'Trading Bible',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Yatay Bant (Ranging) ve Gürültülü (Choppy) Piyasa Ayrımı',
    subtitle: 'Piyasaların %70 Yatay Seyri vs İşlem Yapılmaz Gürültü Filtresi',
    pdfPage: 'Bible s. 63 – 69, 125 – 129',
    overlayKey: 'showSRZones',
    diagramType: 'choppy_vs_range',
    summary:
      'Fiyat HH/HL üretmeyi bırakıp net tanımlanabilen yatay destek ve direnç (en az 2 üst, 2 alt temas) arasında gidip geliyorsa Yatay (Ranging) piyasadır. Sınırlar belirsiz ve mumlar iç içe geçmişse Gürültülü (Choppy) piyasadır.',
    rules: [
      'Yatay Piyasada 3 İşlem Yöntemi: (1) Sadece bant sınırlarından (destek/direnç + Bollinger sahte kırılım onayı ile) dönüş, (2) Gerçek kırılım, (3) Kırılım sonrası geri çekilme (Pullback - ikinci şans).',
      'Asla yatay bandın ortasında işlem açma; tüm fırsatlar alt ve üst sınırlardadır.',
      'Choppy (Gürültülü) Piyasa Kuralı: Günlük grafikte uzaklaştığında temiz destek-direnç sınırları çizemiyorsan ekranı kapat ve piyasadan uzak dur.',
    ],
  },
  {
    id: 'bible_top_down_analysis',
    sourceBook: 'Trading Bible',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Çoklu Zaman Dilimi ve Yukarıdan Aşağıya (Top-Down) Analiz',
    subtitle: 'Üst Zaman Dilimi Duvarına Karşı İşlem Açmama Disiplini',
    pdfPage: 'Bible s. 70 – 78',
    diagramType: 'top_down',
    summary:
      'Tek bir zaman dilimine bakarak işlem açmak düşük olasılıklı sinyallere yakalanmaya yol açar. Önce büyük resmi (Haftalık/Günlük) okuyup kurumsal yönü ve ana dönüş seviyelerini belirlemek, sonra giriş zaman dilimine (4S/1S) inmek gerekir.',
    rules: [
      '4S grafikte işlem yapıyorsan önce Günlük/Haftalık grafiğe; 1S grafikte işlem yapıyorsan önce Günlük grafiğe bak.',
      'Üst Zaman Dilimi Hakimiyeti: 1S/1G grafikte harika bir alım Pin Barı oluşsa bile tam üzerinde Haftalık/Günlük ana direnç varsa o alım sinyali başarısız olmaya mahkumdur ("Risky to Buy Through The Level").',
      'Trend tersi (Counter-Trend) işlemler yalnızca fiyat üst zaman dilimi kanıtlanmış dönüş noktasındayken ve alt zaman diliminde sahte kırılım/Pin Bar onayı verdiğinde yapılır.',
    ],
  },
  {
    id: 'bible_pinbar_tactics',
    sourceBook: 'Trading Bible',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Pin Bar Stratejisi: Agresif Kapanış vs %50 Geri Çekilme Girişi',
    subtitle: 'Kuyruk Reddi Psikolojisi ve 1:5+ Risk/Ödül Taktikleri',
    pdfPage: 'Bible s. 81 – 95',
    overlayKey: 'showMA8_21',
    diagramType: 'pinbar_50_entry',
    summary:
      'Pin Bar, çok küçük bir gövde ve en az 2 kat uzun red kuyruğundan oluşur. Tek başına her yerde oluşabilir; yalnızca ana trend yönünde ve önemli bir seviyede (Destek/Direnç, 21 MA veya Fib %50-%61.8) oluştuğunda yüksek olasılıklıdır.',
    rules: [
      'Agresif Giriş Seçeneği: Pin Bar kapanır kapanmaz işleme girilir, stop-loss uzun kuyruğun ucuna konur; hareketi kaçırmamayı sağlar.',
      'Konservatif (%50 Retracement) Giriş Seçeneği: Fiyatın Pin Bar toplam boyunun %50 orta noktasına geri çekilmesi beklenir; stop mesafesini yarıya indirerek 1:5 üzeri Risk/Ödül oranı sunar (bazen fiyat geri çekilmeden gidebilir).',
      'Statik yatay seviye bulunamayan güçlü trendlerde 8 ve 21 Hareketli Ortalamalar dinamik destek/direnç olarak kullanılır.',
    ],
  },
  {
    id: 'bible_sniper_confluence',
    sourceBook: 'Trading Bible',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Sniper Yaklaşımı: 4 Faktörlü Kesişim (Confluence) Sistemi',
    subtitle: 'Çoklu Teknik Kanıtların Aynı Fiyat Noktasında Birleşmesi',
    pdfPage: 'Bible s. 79 – 80, 96 – 102, 117 – 124',
    overlayKey: 'showMA8_21',
    diagramType: 'confluence_sniper',
    summary:
      'Confluence (Kesişim), birden fazla bağımsız teknik aracın aynı bölgede aynı yönü işaret etmesidir. Çok işlem açmak yerine "Sniper" gibi en az 2–4 faktörün birleştiği kurulumları beklemek başarı oranını katlar.',
    rules: [
      '1. Faktör — Trend: Piyasa net bir yükseliş (HH/HL) veya düşüş (LH/LL) trendinde mi?',
      '2. Faktör — Yatay Seviye / Rol Değişimi: Kırılan direncin desteğe (veya desteğin dirence) dönüştüğü kilit alan mı?',
      '3. Faktör — Dinamik Ortalama & Trend Çizgisi: 8 ve 21 periyotluk hareketli ortalama veya ana trend çizgisi bölgeden geçiyor mu?',
      '4. Faktör — Fibonacci (%50 ve %61.8) + Mum Sinyali: Düzeltme %50–%61.8 altın oran bölgesinde Pin Bar, Engulfing veya Inside Bar üretti mi?',
    ],
  },
  {
    id: 'bible_supply_demand',
    sourceBook: 'Trading Bible',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Kurumsal Arz (Supply) ve Talep (Demand) Bölgeleri',
    subtitle: 'Banka ve Kurumların Bekleyen Emir Bıraktığı Sert Çıkış Alanları',
    pdfPage: 'Bible s. 130 – 132',
    overlayKey: 'showSupplyDemand',
    diagramType: 'supply_demand',
    summary:
      'Arz ve talep bölgeleri standart destek-dirençten daha güçlüdür; büyük banka ve fonların bekleyen (pending) emirlerinin bulunduğu başlangıç üsleridir.',
    rules: [
      '1. Kriter — Çıkış Gücü (Strength of Move): Fiyatın bölgeden çok hızlı ve geniş gövdeli mumlarla ayrılması kurumsal izi kanıtlar.',
      '2. Kriter — İyi Kar Alanı (Profit Zone): Karşıt engele kadar en az 1:2 veya 1:3 tatmin edici Risk/Ödül boşluğu bulunmalıdır.',
      '3. Kriter — Büyük Zaman Dilimi: 4S ve Günlük grafikteki arz/talep bölgelerinde oluşan Engulfing veya Pin Bar en yüksek başarıyı verir.',
    ],
  },
  {
    id: 'bible_inside_bar_fakey',
    sourceBook: 'Trading Bible',
    category: 'Formasyon & Boşluk',
    title: 'Inside Bar (İç Bar) ve Sahte Kırılım (Stop Loss Hunting / Fakey)',
    subtitle: 'Piyasa Yapıcıların Stop Avı Manipülasyonunu Lehine Çevirmek',
    pdfPage: 'Bible s. 137 – 157',
    diagramType: 'inside_bar_fakey',
    summary:
      'İç Bar (Ana Mum + tamamen içinde kalan Bebek Mum) piyasanın duraksadığını gösterir. Kurumsal oyuncular genellikle amatörlerin ana mum dışındaki stop emirlerini avlayıp (likidite yaratıp) fiyatı ters yöne sürer.',
    rules: [
      'Trend Devam Kırılımı: Güçlü trendlerde kilit seviyede oluşan İç Bar kırılımıyla trende katılınır; stop ana mumun arkasına konur.',
      'Sahte Kırılım (Stop Avı / Fakey): Fiyat iç bar ve kilit seviyeyi dışarı kırar gibi yapıp hızla geri dönerek tekrar ana mum (mother bar) aralığı içine kapanırsa tuzak tamamlanmıştır.',
      'Özellikle %50–%61.8 Fibonacci düzeltmesinde veya yatay bant sınırında oluşan İç Bar Sahte Kırılımı çok yüksek R:R (örn. 1:4+) fırsatları sunar.',
    ],
  },
  {
    id: 'bible_money_management',
    sourceBook: 'Trading Bible',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Sermaye Yönetimi, Pozisyon Büyüklüğü ve Min. 1:2 R:R Kuralı',
    subtitle: '%30 Kazanma Oranıyla Bile Karlı Kalmanın Matematiği',
    pdfPage: 'Bible s. 133 – 136, 162 – 166',
    diagramType: 'risk_reward_mm',
    summary:
      'Başarılı yatırımcılar ile kaybedenleri ayıran "kalenin anahtarı" para yönetimidir. İşlemleri pip/puan olarak değil, riske edilen net para tutarı ve Risk/Ödül (R:R) oranıyla yönetmek zorunludur.',
    rules: [
      '%1 – %2 Sermaye Riski Kuralı: Tek bir işlemde toplam bakiyenin asla %2’sinden fazlasını (yeni başlayanlar için %1) riske etme.',
      'Minimum 1:2 / 1:3 R:R Kuralı: Potansiyel karı riskin en az 2 katı olmayan sinyalleri pas geç (1:3 R:R ile 10 işlemin 7’sini kaybetsen bile net karda kalırsın).',
      'Zihinsel Stop Yasağı: Asla "zihinsel stop" kullanma; emri açarken koruyucu fiziksel Stop-Loss ve Kar Al (sonraki destek/direnç) seviyelerini sisteme gir ve duygularını devre dışı bırak.',
    ],
  },

  // =========================================================================
  // GRAFİK OKUMA TEKNİKLERİ — 9 MODÜL
  // =========================================================================
  {
    id: 'sr_zones_flip',
    sourceBook: 'Grafik Okuma',
    category: 'Seviye & Trend',
    title: 'Destek / Direnç Bölgeleri ve Rol Değişimi',
    subtitle: 'Bölgesel Fiyat Tepkisi & S/R Polarity Flip',
    pdfPage: 'Grafik Okuma s. 2 – 3',
    overlayKey: 'showSRZones',
    diagramType: 'sr_flip',
    summary:
      'Destek, fiyatın daha aşağı inmekte zorlandığı ve alıcıların devreye girdiği alandır; direnç ise yukarı geçilmesi zor satıcılı alandır. Bu seviyeleri tek bir rakam yerine bir "bölge" olarak okumak gerekir.',
    rules: [
      'Destek ve direnç seviyeleri kırılmaz değildir; kırıldıklarında hacimli ve sert fiyat hareketleri doğururlar.',
      'Rol Değişimi Kuralı: Geçmişte destek görevi görmüş bir bölge aşağı kırıldığında gelecekte direnç olarak çalışır; kırılan bir direnç ise geri çekilmelerde destek görevini üstlenir.',
      'Bir bölge ne kadar çok kez test edilip korunursa piyasa hafızasındaki önemi o kadar artar.',
    ],
  },
  {
    id: 'trendlines_three_points',
    sourceBook: 'Grafik Okuma',
    category: 'Seviye & Trend',
    title: 'Trend Çizgileri ve 3 Nokta Doğrulaması',
    subtitle: 'Yükseliş, Düşüş ve Yatay Trend Tespiti',
    pdfPage: 'Grafik Okuma s. 3 – 5',
    overlayKey: 'showTrendChannel',
    diagramType: 'trendline_channel',
    summary:
      'Trend çizgileri paritenin ana yönelimini gösterir. Önemli olan trendi zorlama olmadan grafiğe uygun çizmektir; yükseliş, düşüş ve yatay olmak üzere üç ana yön vardır.',
    rules: [
      'Yükseliş trend çizgisi için en düşük iki dip noktası teğet birleştirilir; düşüş trend çizgisi için en yüksek iki tepe noktası birleştirilir.',
      'Kesin Doğrulama Kuralı: İki nokta aday bir çizgi oluşturur; çizginin kesin bir trend çizgisi sayılabilmesi için 3. bir temas noktası tarafından doğrulanması gerekir.',
      'Eğim Kuralı: Trend çizgisi dikleştikçe sürdürülebilirliği azalır ve kırılma ihtimali artar; makul açıyla denendikçe sağlamlığını kanıtlar.',
    ],
  },
  {
    id: 'trend_channels',
    sourceBook: 'Grafik Okuma',
    category: 'Seviye & Trend',
    title: 'Paralel Trend Kanalları',
    subtitle: 'Kanal İçi Alış ve Satış Bölgeleri',
    pdfPage: 'Grafik Okuma s. 5',
    overlayKey: 'showTrendChannel',
    diagramType: 'trendline_channel',
    summary:
      'Ana trend çizgisine paralel ikinci bir çizgi çekilerek elde edilen fiyat koridorudur. Hem dinamik destek hem de dinamik direnç sınırlarını aynı anda gösterir.',
    rules: [
      'Yükseliş trend kanalında alt trend çizgisine paralel çizgi, aradaki en yakın yüksek tepe noktasından geçecek şekilde yerleştirilir.',
      'Düşüş trend kanalında üst düşüş çizgisine paralel çizgi, en yakındaki düşük dip noktasından geçirilir.',
      'Kanal alt bandı potansiyel tepki/alım, kanal üst bandı ise kar realizasyonu ve direnç bölgesi olarak izlenir.',
    ],
  },
  {
    id: 'price_gaps_island',
    sourceBook: 'Grafik Okuma',
    category: 'Formasyon & Boşluk',
    title: 'Fiyat Boşlukları (Gap) ve Ada Dönüşü',
    subtitle: 'Kopuş, Kaçış (Ölçme), Tükeniş ve Ada Formasyonu',
    pdfPage: 'Grafik Okuma s. 6',
    diagramType: 'gaps_island',
    summary:
      'Ardışık barlar arasında işlem geçmeyen fiyat boşlukları, bulundukları trend evresine göre hareketin başlangıcını, devam mesafesini veya sonlandığını haber verir.',
    rules: [
      'Kopuş Boşluğu (Breakaway): Önemli bir hareketin sonunda veya sıkışma formasyonundan çıkarken oluşur; yeni ve güçlü bir dalganın başlangıcıdır.',
      'Kaçış / Ölçme Boşluğu (Runaway): Güçlü bir trendin ortasında meydana gelir; trendin ne kadar daha devam edeceğini ölçmekte kullanılır.',
      'Tükeniş Boşluğu (Exhaustion) ve Ada Dönüşü: Trend sonunda görülür; iki boşluk arasında yalnız kalan mum kümesi "Ada Formasyonu" oluşturarak sert dönüş sinyali üretir.',
    ],
  },
  {
    id: 'wedge_squeeze',
    sourceBook: 'Grafik Okuma',
    category: 'Formasyon & Boşluk',
    title: 'Sıkışma Formasyonları (Artan ve Azalan Sıkışma)',
    subtitle: 'Karar Aşaması ve Sıkışma Yönünün Etkisi',
    pdfPage: 'Grafik Okuma s. 6 – 7',
    overlayKey: 'showGeometric',
    diagramType: 'wedge_squeeze',
    summary:
      'Trend içinde piyasanın duraksadığını ve yeni yönüne karar vermek üzere olduğunu anlatır. Sonucu belirleyen şey önceki trend değil, sıkışmanın hangi yönde olduğudur.',
    rules: [
      'Artan Sıkışma (Yükselen Takoz): Hem yükseliş hem düşüş trendinde yukarı eğimli daralan yapıdır; genellikle aşağı yönlü kırılım ve düşüş üretir.',
      'Azalan Sıkışma (Alçalan Takoz): Destek bölgesine yaklaşırken aşağı eğimli daralan yapıdır; hem düşüş hem yükseliş trendinde yukarı yönlü patlama potansiyeli taşır.',
      'Kırılım sonrası sıkışmanın başladığı en geniş ağız yüksekliği (H) kadar fiyat hareketi beklenir.',
    ],
  },
  {
    id: 'triangle_patterns',
    sourceBook: 'Grafik Okuma',
    category: 'Formasyon & Boşluk',
    title: 'Üçgen Formasyonları (Simetrik, Yükselen, Alçalan)',
    subtitle: 'Daralan Volatilite ve En Geniş Nokta (H) Hedefi',
    pdfPage: 'Grafik Okuma s. 8',
    overlayKey: 'showGeometric',
    diagramType: 'triangles',
    summary:
      'Tepe ve dip dalgalarının birbirine yaklaşmasıyla oluşan üç temel sıkışma geometrisidir: Simetrik Üçgen, Yükselen Üçgen ve Alçalan Üçgen.',
    rules: [
      'Simetrik Üçgen: Yükselmelerin (alçalan tepeler) ve düşüşlerin (yükselen dipler) birbirine yaklaşmasıyla oluşur; kırılım yönünde üçgenin en geniş noktası (H) kadar hareket üretir.',
      'Yükselen Üçgen: Yatay bir direnç seviyesi ile yükselen dip seviyelerinin kesişmesiyle oluşur; direnç kırılımı veya sahte beklenti sonrası sert kırılım yönü yakından izlenmelidir.',
      'Alçalan Üçgen: Yatay bir destek bölgesi ile alçalan tepelerin kesişmesi sonucu oluşur; destek kırılımında üçgen yüksekliği kadar düşüş hedeflenir.',
    ],
  },
  {
    id: 'bollinger_bands',
    sourceBook: 'Grafik Okuma',
    category: 'İndikatör & Fibonacci',
    title: 'Bollinger Bandı Dinamikleri ve Bant Reddi Onayı',
    subtitle: 'Yatay Piyasada Sahte Kırılım Onayı & Bant Dışı Kopuş',
    pdfPage: 'Grafik Okuma s. 9 · Bible s. 106 – 108',
    overlayKey: 'showBollinger',
    diagramType: 'bollinger',
    summary:
      'Fiyatlar normal koşullarda alt ve üst Bollinger Bandı arasında hareket eder. Yatay piyasalarda alt/üst banttan + yatay destek/dirençten birlikte red yiyen Pin Bar en yüksek onaylı dönüş sinyalidir.',
    rules: [
      'Bant içi seyirde üst bant direnç, alt bant destek ve orta bant (20 periyot ortalama) denge ekseni olarak çalışır.',
      'Yatay Piyasada Pin Bar Onayı (Bible): Pin Bar hem yatay destek/dirençten hem de Bollinger üst/alt bandından sahte kırılım (false breakout) ile red yiyorsa tereddütsüz onay sinyalidir.',
      'Bant Dışı Hareket Kuralı: Fiyat güçlü hacimle bant dışına taşar ve bant ağzı açılırsa trend yönünde güçlü momentum başlar.',
    ],
  },
  {
    id: 'macd_12_26_9',
    sourceBook: 'Grafik Okuma',
    category: 'İndikatör & Fibonacci',
    title: 'MACD (12, 26, 9) Trend Başlangıcı',
    subtitle: 'Hareketli Ortalamaların Yakınsama ve Iraksaması',
    pdfPage: 'Grafik Okuma s. 9',
    overlayKey: 'showMACD',
    diagramType: 'macd',
    summary:
      '12 barlık ve 26 barlık üstel hareketli ortalamalar arasındaki farkı (MACD çizgisi) ve bunun 9 barlık sinyal ortalamasını izleyerek yeni trend başlangıçlarını tespit eder.',
    rules: [
      'Standart (12, 26, 9) kurulumunda iki fiyat ortalaması arasındaki değişim hızı ve sinyal çizgisiyle kesişimi ölçülür.',
      'Trend Başlangıcı Kuralı: MACD çizgisinin sinyal çizgisini aşağıdan yukarı kesmesi yeni bir yükseliş trendi başlangıcını, yukarıdan aşağı kesmesi ise düşüş başlangıcını işaret eder.',
      'Histogram çubuklarının sıfır ekseni üzerindeki büyüklüğü mevcut trend momentumunun gücünü doğrular.',
    ],
  },
  {
    id: 'fibonacci_retracement',
    sourceBook: 'Grafik Okuma',
    category: 'İndikatör & Fibonacci',
    title: 'Fibonacci Düzeltme Seviyeleri (%50 ve %61.8 Altın Bölge)',
    subtitle: 'Yükseliş ve Düşüş Trendinde Kurumsal Düzeltme Seviyeleri',
    pdfPage: 'Grafik Okuma s. 9 – 10 · Bible s. 120 – 121, 154 – 155',
    overlayKey: 'showFibonacci',
    diagramType: 'fibonacci',
    summary:
      'Ana trend dalgalarının büyük çoğunluğu %50 ve %61.8 Fibonacci seviyelerine kadar düzeltme yapar. Bu bölgede oluşan Pin Bar, Engulfing veya İç Bar Sahte Kırılımı en karlı giriş noktalarını üretir.',
    rules: [
      'Yükseliş Trendinde Çizim: Görülen en düşük dip noktasından, ulaşılan en yüksek tepe noktasına doğru çekilir.',
      'Düşüş Trendinde Çizim: Görülen en yüksek tepe noktasından, inilen en düşük dip noktasına doğru çekilir.',
      '%50 ve %61.8 Altın Kesişim: Profesyonel yatırımcıların en yoğun izlediği geri çekilme alanıdır; yatay rol değişimi seviyesiyle çakıştığında Sniper giriş bölgesi oluşturur.',
    ],
  },
  {
    id: 'courtney_dual_oscillator_system',
    sourceBook: 'Courtney Capital',
    category: 'Giriş Taktikleri & Risk Yönetimi',
    title: 'Courtney Dual Osilatör Sistemi (Slow Stoch 13,8,4 & CCI 20)',
    subtitle: 'Neville Chester / Courtney Capital — İki Göstergeli Kusursuz Giriş Modeli',
    pdfPage: 'Courtney Capital s. 3 – 30',
    overlayKey: 'showCourtney',
    diagramType: 'courtney_dual_oscillator',
    summary:
      'Yalnızca tek bir göstergeye asla güvenilmez. Courtney Capital stratejisi, George Lane hızı ölçen Slow Stochastic (13, 8, 4) ile Lambert trend ve döngü sapmasını ölçen CCI (20) osilatörünü fiyat trend çizgisiyle birleştirir. Fiyat ana trend çizgisine çekildiğinde iki osilatörün aynı anda aşırı satımdan/alımdan dönmesiyle kusursuz giriş tetiklenir.',
    rules: [
      'Dual Teyit Şartı: Asla tek göstergeyle pozisyona girilmez; Slow Stoch (13, 8, 4) ve CCI (20) aynı yönde teyit üretmelidir.',
      'Trend Destek Teması: Yükseliş trendinde ana yükselen trend çizgisine (veya destek seviyesine) geri çekilme beklenir.',
      'Tetik Kesişimi: Stoch < 25 aşırı satım bölgesinde %K çizgisi %D tetik çizgisini yukarı keserken, CCI (20) aşırı satımdan (-100 veya -80 altı) yukarı kanca yapar.',
      'Giriş Zamanlaması: Fiyat, geri çekilmedeki kısa vadeli karşıt trend çizgisini (trigger line) yukarı kırdığı an işleme girilir.',
    ],
  },
  {
    id: 'courtney_stoch_13_8_4_momentum',
    sourceBook: 'Courtney Capital',
    category: 'İndikatör & Fibonacci',
    title: 'Slow Stochastic (13, 8, 4) Momentum & Hız Yasası',
    subtitle: 'George Lane Prensibi: Momentum Hızı Fiyattan Önce Yön Değiştirir',
    pdfPage: 'Courtney Capital s. 4 – 13, 18',
    overlayKey: 'showCourtney',
    diagramType: 'courtney_stoch_13_8_4',
    summary:
      'George Lane tarafından 1950’lerde geliştirilen Stokastik, fiyatın kendisini değil momentum hızını ölçer. Süratle fırlayan bir roketin yere düşmeden önce havada hız kaybetmesi gibi, piyasa dönüşlerinden önce de Stokastik hızı kesilir. Courtney Capital, 13 periyotluk aralığı önce 3 SMA, ardından 8 SMA ile yumuşatıp 4 SMA tetik çizgisi (%D) ile filtreler.',
    rules: [
      'Lane Hız Yasası: Fiyat tepesi veya dibi oluşmadan önce, Stokastik hızı yavaşlar ve yön değiştirir (Leading gösterge gücü).',
      'Parametre Kurulumu: %K = 13 lookback periyodu, yumuşatma = 8 periyot SMA, %D Tetik Çizgisi = 4 periyot SMA.',
      'Aşırı Bölgeler: 80 üzeri aşırı alım, 20 altı aşırı satım. Kesişimlerin mutlaka bu uç sınırlarda (veya <25 / >75) gerçekleşmesi aranır.',
      'Kesişim Kuralı: Slow %K çizgisi Slow %D çizgisini aşırı satım bölgesinde yukarı kestiğinde alış, aşırı alım bölgesinde aşağı kestiğinde satış uyarısı verir.',
    ],
  },
  {
    id: 'courtney_cci20_coincidental_divergence',
    sourceBook: 'Courtney Capital',
    category: 'Seviye & Trend',
    title: 'CCI (20) Hem Öncü (Leading) Hem Eşzamanlı (Coincidental) Kullanım',
    subtitle: 'Donald Lambert 1980 Formülü: 0.015 Katsayısı, Trend Başlatıcı ve Uyumsuzluklar',
    pdfPage: 'Courtney Capital s. 14 – 17, 26 – 29',
    overlayKey: 'showCourtney',
    diagramType: 'courtney_cci20_coincidental',
    summary:
      'CCI Tipik Fiyatın 20 periyotluk SMA’dan ortalama sapmasını ölçer. 0.015 katsayısı verilerin %70-80’ini ±100 bandında tutar. Neville Chester, CCI’ın çift yönlü doğasını kullanır: +100 üzerine patlama eşzamanlı olarak güçlü trend başlangıcıdır; ancak +100 üzerindeki tepelerde fiyat yeni zirve yaparken CCI daha düşük tepe yaparsa güçlü bir öncü uyumsuzluk (leading divergence) üretir.',
    rules: [
      'Eşzamanlı (Coincidental) Trend Teyidi: CCI sıfırı ve +100 seviyesini yukarı patlattığında boğa trendi hızlanır; -100 altına indiğinde ayı trendi derinleşir.',
      'Aşırı Uç Dönüşü (Leading): CCI (20) ±100 dışına çıktıktan sonra geri dönüp seviyeyi tekrar test ettiğinde düzeltme/dönüşün ilk öncü sinyalini verir.',
      'Boğa Uyumsuzluğu (Bullish Divergence): Fiyat grafiğinde daha düşük dipler (Lower Lows) oluşurken, CCI (20) daha yüksek dipler (Higher Lows) üretiyorsa kurumsal dönüş yaklaşmıştır.',
      'Ayı Uyumsuzluğu (Bearish Divergence): Fiyat yeni en yüksek zirveyi yaparken CCI tepeyi aşamaz ve alçalan tepe yaparsa sert satış uyarısıdır.',
    ],
  },
  {
    id: 'courtney_trend_ignore_overbought_filter',
    sourceBook: 'Courtney Capital',
    category: 'Price Action & Piyasa Yapısı',
    title: 'Courtney Kuralı: Güçlü Trendde Aşırı Alım/Satımı Yok Say (Ignore)',
    subtitle: 'Neville Chester Hayati İlkesi: Trend Varken Osilatör Aşırılığı Karşıt Sinyal Değildir',
    pdfPage: 'Courtney Capital s. 15, 19, 21 – 25',
    overlayKey: 'showCourtney',
    diagramType: 'courtney_trend_ignore_filter',
    summary:
      'Amatör yatırımcıların en büyük hatası, güçlü bir boğa trendinde Stokastik 80 üzerine veya CCI +100 üzerine çıktı diye açığa satış yapmaktır. Neville Chester kuralı açıktır: Güçlü bir trend varsa aşırı alım/satım bölgeleri yok sayılır! Trend sırasında osilatörler günlerce 80 üzerinde yapışık kalabilir; bu zayıflık değil, aşırı trend gücü göstergesidir.',
    rules: [
      'Ignore Kuralı (Slayt 15): Piyasa belirgin bir trend kanalında hareket ederken, osilatörün aşırı alımda olması SAT anlamına GELMEZ.',
      'Yalnızca Trend Yönünde Kullanım: Güçlü yükseliş trendinde yalnızca AŞIRI SATIM (<20) düzeltmelerindeki AL sinyalleri işleme alınır.',
      'Direnç Duvarı Kırılımı: Fiyat direnç seviyesini kırıp trend başlatırken osilatör 80 üstüne fırlar; bu aşırı alım değil trend onayıdır.',
      'Pozisyondan Çıkış Zamanlaması: Trend devam ederken aşırı alımda erken çıkılmaz; ancak belirgin tepe uyumsuzluğu ve karşıt trend çizgisi kırılımı olduğunda kar realizasyonu yapılır.',
    ],
  },
];
