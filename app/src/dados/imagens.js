// IMAGENS REAIS — bandeiras, fotos de equipamento militar e retratos de líderes.
// Protótipo local: as imagens vêm de CDNs públicos (flagcdn / Wikimedia / DiceBear).
// Se algum host cair, tudo tem fallback de emoji.

// ── BANDEIRAS (flagcdn: ISO-2 minúsculo) ──────────────────────────────
// O GeoJSON traz ISO_A2. Ex.: bandeira('BR') → https://flagcdn.com/w80/br.png
// ISO3 (do GeoJSON) → ISO2 (do flagcdn). Fonte ÚNICA: estava duplicado dentro do
// globo.js, o que já teria dado divergência na primeira vez que alguém editasse um só.
export const ISO2_DE = {
  USA: 'us', CHN: 'cn', RUS: 'ru', IRN: 'ir', BRA: 'br', IND: 'in', DEU: 'de', FRA: 'fr',
  GBR: 'gb', JPN: 'jp', KOR: 'kr', PRK: 'kp', ISR: 'il', SAU: 'sa', MEX: 'mx', CAN: 'ca',
  UKR: 'ua', TWN: 'tw', AUS: 'au', TUR: 'tr', ITA: 'it', SWE: 'se',
  // petroestados e anfitriões de base
  VEN: 've', IRQ: 'iq', KWT: 'kw', ARE: 'ae', QAT: 'qa', LBY: 'ly', NGA: 'ng', KAZ: 'kz',
  DZA: 'dz', NOR: 'no', AGO: 'ao', OMN: 'om', COL: 'co', EGY: 'eg', IDN: 'id', MYS: 'my',
  SGP: 'sg', YEM: 'ye', DJI: 'dj', ERI: 'er', AZE: 'az', PAN: 'pa', BHR: 'bh', ESP: 'es',
  POL: 'pl', GRC: 'gr', ROU: 'ro', PHL: 'ph', KEN: 'ke', GRL: 'gl', CHL: 'cl', PER: 'pe',
  ARG: 'ar', NLD: 'nl', BEL: 'be', CHE: 'ch', PRT: 'pt', ZAF: 'za', PAK: 'pk', VNM: 'vn',
  THA: 'th', SYR: 'sy', JOR: 'jo', LBN: 'lb', AFG: 'af', ETH: 'et', SDN: 'sd', COG: 'cg',
  GNQ: 'gq', GAB: 'ga', SSD: 'ss', BRN: 'bn', FIN: 'fi', DNK: 'dk', CZE: 'cz', HUN: 'hu',
};

export function bandeira(iso2, largura = 80) {
  if (!iso2 || iso2 === '-99') return null;
  return `https://flagcdn.com/w${largura}/${String(iso2).toLowerCase()}.png`;
}
export function bandeiraDeFeature(f, largura = 80) {
  const p = f?.properties || {};
  return bandeira(p.ISO_A2_EH || p.ISO_A2, largura);
}

// ── FOTOS REAIS DE EQUIPAMENTO (Wikimedia Commons) ────────────────────
export const FOTO_UNIDADE = {
  infantaria:   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg/330px-Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg',
  blindados:    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/M1A2_SEP_v3.jpg/330px-M1A2_SEP_v3.jpg',
  artilharia:   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg/330px-Kings_of_battle_keep_the_fire%3B_1-9_FA_fires_its_last_rounds_140910-A-CW513-046.jpg',
  helicopteros: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/AH-64D_Apache_Longbow.jpg/330px-AH-64D_Apache_Longbow.jpg',
  cacas:        'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/F-35A_flight_%28cropped%29.jpg/330px-F-35A_flight_%28cropped%29.jpg',
  bombardeiros: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/B-1B_air_refueling.jpg/330px-B-1B_air_refueling.jpg',
  drones:       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/MQ-9_Reaper_UAV_%28cropped%29.jpg/330px-MQ-9_Reaper_UAV_%28cropped%29.jpg',
  navios:       'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/US_Navy_080906-N-1082Z-067_The_guided-missile_destroyer_USS_Roosevelt_%28DDG_80%29_transits_the_Atlantic_Ocean.jpg/330px-US_Navy_080906-N-1082Z-067_The_guided-missile_destroyer_USS_Roosevelt_%28DDG_80%29_transits_the_Atlantic_Ocean.jpg',
  submarinos:   'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg/330px-US_Navy_040730-N-1234E-002_PCU_Virginia_%28SSN_774%29_returns_to_the_General_Dynamics_Electric_Boat_shipyard.jpg',
  porta_avioes: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG/330px-Bow_view_of_USS_Gerald_R._Ford_%28CVN-78%29_underway_on_8_April_2017.JPG',
  misseis:      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tomahawk_Block_IV_cruise_missile_-crop.jpg/330px-Tomahawk_Block_IV_cruise_missile_-crop.jpg',
  ogivas:       'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/LGM-30-Minuteman-II.jpg/330px-LGM-30-Minuteman-II.jpg',
  defesa_aerea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flickr_-_Government_Press_Office_%28GPO%29_-_Patriot_missiles_being_launched_to_intercept_an_Iraqi_Scud_missile.jpg/330px-Flickr_-_Government_Press_Office_%28GPO%29_-_Patriot_missiles_being_launched_to_intercept_an_Iraqi_Scud_missile.jpg',
};

// Recursos (não-unidades) que aparecem no espólio da guerra — petróleo tem foto própria.
export const FOTO_RECURSO = {
  petroleo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Oil_well.jpg/330px-Oil_well.jpg',
};

// Fotos para as AÇÕES do catálogo (mesma biblioteca, por id de ação).
export const FOTO_ACAO = {
  inf: FOTO_UNIDADE.infantaria,
  blindados: FOTO_UNIDADE.blindados,
  helis: FOTO_UNIDADE.helicopteros,
  cacas: FOTO_UNIDADE.cacas,
  porta_avioes: FOTO_UNIDADE.porta_avioes,
  submarino: FOTO_UNIDADE.submarinos,
  hipersonico: FOTO_UNIDADE.misseis,
  ogiva: FOTO_UNIDADE.ogivas,
  ia_militar: FOTO_UNIDADE.drones,
  aviao_espiao: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/MQ-9_Reaper_UAV_%28cropped%29.jpg/330px-MQ-9_Reaper_UAV_%28cropped%29.jpg',
  mobilizar: FOTO_UNIDADE.infantaria,
};

// ── LOGOS DA IMPRENSA ──────────────────────────────────────────────────
// O buraco que isto tapa: a imprensa por país tem 90+ jornais (NYT, O Globo, RT,
// Le Monde…), mas só 4 tinham logo cadastrado à mão. O resto caía num quadradinho
// de 2 letras — nada de CNN, Globo, Fox com a marca de verdade que o jogo pedia.
//
// A virada: todo veículo tem `dominio`. O logo REAL de qualquer marca sai do domínio
// pelo serviço de ícones do DuckDuckGo (favicon de alta resolução, sem chave, sem
// rastreio). Um jornal novo em imprensa.js já nasce com logo, sem cadastro. O mapa
// abaixo é o override de qualidade: wordmark/logo do Wikimedia (vetorial rasterizado
// ~250px, bem mais nítido que favicon), validado um a um com HTTP 200. A chave é o
// `nome` EXATO de imprensa.js/veiculos.js (inclusive o apóstrofo curvo de
// People’s Daily). A maioria vem do Commons; alguns são fair-use hotlinkados de
// /wikipedia/en|fa — mesmo esquema que o Al Jazeera já usava. Cada arquivo foi
// conferido contra o artigo do veículo na Wikipédia (nada de logo errado: o
// "The Wire logo.svg" do Commons, por exemplo, é a série da HBO — rejeitado).
// Ficaram SEM override (caem no favicon do domínio): Yonhap (só existe a marca da
// subsidiária Yonhap News TV — marca errada é pior que nenhuma), Egypt Independent
// e CartaCapital (nenhum logo no Commons nem nas Wikipédias).
const LOGO_MANUAL = {
  // ── internacionais ──────────────────────────────────────────────────
  'CNN':        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/CNN_Logo_%282014%29.svg/1280px-CNN_Logo_%282014%29.svg.png',
  'Fox News':   'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fox_News_Channel_logo.svg/960px-Fox_News_Channel_logo.svg.png',
  'Al Jazeera': 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Al_Jazeera_Media_Network_Logo.svg/250px-Al_Jazeera_Media_Network_Logo.svg.png',
  'Reuters':            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Reuters_logo_2024.svg/250px-Reuters_logo_2024.svg.png',
  'Associated Press':   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Associated_Press_logo_2012.svg/250px-Associated_Press_logo_2012.svg.png',
  'Bloomberg':          'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Bloomberg_News_logo.svg/250px-Bloomberg_News_logo.svg.png',

  // ── EUA ─────────────────────────────────────────────────────────────
  'The New York Times':      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/NewYorkTimes.svg/250px-NewYorkTimes.svg.png',
  'The Washington Post':     'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/The_Logo_of_The_Washington_Post_Newspaper.svg/250px-The_Logo_of_The_Washington_Post_Newspaper.svg.png',
  'The Wall Street Journal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/The_Wall_Street_Journal_Logo.svg/250px-The_Wall_Street_Journal_Logo.svg.png',
  'MSNBC':                   'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/MSNBC_2023.svg/250px-MSNBC_2023.svg.png',
  'The New York Post':       'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/New_York_Post.svg/250px-New_York_Post.svg.png',

  // ── China ───────────────────────────────────────────────────────────
  'Xinhua':                   'https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Xinhua_Logo.png/250px-Xinhua_Logo.png',
  'Global Times':             'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/GlobalTimesLogo.svg/250px-GlobalTimesLogo.svg.png',
  'People’s Daily':           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/People%27s_Daily_logo.svg/250px-People%27s_Daily_logo.svg.png',
  'Caixin':                   'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Caixin_logo.svg/250px-Caixin_logo.svg.png',
  'South China Morning Post': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/SCMP_logo.svg/250px-SCMP_logo.svg.png',

  // ── Rússia ──────────────────────────────────────────────────────────
  'RT':            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Russia-Today-Logo.svg/250px-Russia-Today-Logo.svg.png',
  'TASS':          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/TASS_Logo_%28Latin%29_2022.svg/250px-TASS_Logo_%28Latin%29_2022.svg.png',
  'Novaya Gazeta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Novaya_gazeta_logo.svg/250px-Novaya_gazeta_logo.svg.png',
  'Kommersant':    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Logo_Kommersant.svg/250px-Logo_Kommersant.svg.png',
  'Meduza':        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Meduza_logo.svg/250px-Meduza_logo.svg.png',

  // ── Índia ───────────────────────────────────────────────────────────
  'The Times of India': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/The_times_of_india.svg/250px-The_times_of_india.svg.png',
  'The Hindu':          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/The_Hindu_logo.svg/250px-The_Hindu_logo.svg.png',
  'NDTV':               'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/NDTV_logo.svg/250px-NDTV_logo.svg.png',
  'Republic TV':        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Republic_TV.svg/250px-Republic_TV.svg.png',
  'The Wire':           'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Wirelogo.svg/250px-Wirelogo.svg.png',

  // ── Brasil (CartaCapital ficou no favicon) ──────────────────────────
  'O Globo':              'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/O_Globo_2025.svg/250px-O_Globo_2025.svg.png',
  'Folha de S.Paulo':     'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Folha_de_S.Paulo_logo.svg/250px-Folha_de_S.Paulo_logo.svg.png',
  'Veja':                 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Veja.svg/250px-Veja.svg.png',
  'O Estado de S. Paulo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/O_Estado_de_S._Paulo_Logo.svg/250px-O_Estado_de_S._Paulo_Logo.svg.png',
  'Brasil 247':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Logo_Brasil_247_2024.png/250px-Logo_Brasil_247_2024.png',

  // ── Alemanha ────────────────────────────────────────────────────────
  'Der Spiegel':                  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Der_Spiegel_logo.svg/250px-Der_Spiegel_logo.svg.png',
  'Frankfurter Allgemeine (FAZ)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Frankfurter_Allgemeine_Logo_2019.svg/250px-Frankfurter_Allgemeine_Logo_2019.svg.png',
  'Bild':                         'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Logo_BILD.svg/250px-Logo_BILD.svg.png',
  'Süddeutsche Zeitung':          'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/S%C3%BCddeutsche_Zeitung_Logo.svg/250px-S%C3%BCddeutsche_Zeitung_Logo.svg.png',
  // sim, o arquivo chama "-Bremen": o brasão de Bremen faz parte do cabeçalho do Die Zeit
  'Die Zeit':                     'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Die_Zeit-Logo-Bremen.svg/250px-Die_Zeit-Logo-Bremen.svg.png',

  // ── França ──────────────────────────────────────────────────────────
  'Le Monde':   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Le_Monde.svg/250px-Le_Monde.svg.png',
  'Le Figaro':  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Le_Figaro_logo.svg/250px-Le_Figaro_logo.svg.png',
  'Libération': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Lib%C3%A9ration.svg/250px-Lib%C3%A9ration.svg.png',
  'Mediapart':  'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mediapart_wordmark.svg/250px-Mediapart_wordmark.svg.png',
  'France 24':  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/France_24_logo_%282013%29.svg/250px-France_24_logo_%282013%29.svg.png',

  // ── Reino Unido ─────────────────────────────────────────────────────
  'BBC News':        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BBC_News_2022_%28Alt%29.svg/960px-BBC_News_2022_%28Alt%29.svg.png',
  'The Guardian':    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/The_Guardian_2018.svg/250px-The_Guardian_2018.svg.png',
  'The Times':       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/The_Times_masthead.svg/250px-The_Times_masthead.svg.png',
  'Daily Mail':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Daily_Mail_masthead.svg/250px-Daily_Mail_masthead.svg.png',
  'Financial Times': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Financial_Times_corporate_logo.svg/250px-Financial_Times_corporate_logo.svg.png',

  // ── Japão ───────────────────────────────────────────────────────────
  'NHK':              'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/NHK_logo_2020.svg/250px-NHK_logo_2020.svg.png',
  'Asahi Shimbun':    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/The_Asahi_Shimbun_logo.svg/250px-The_Asahi_Shimbun_logo.svg.png',
  'Yomiuri Shimbun':  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/The_Yomiuri_Shimbun_logo.svg/250px-The_Yomiuri_Shimbun_logo.svg.png',
  'Nikkei':           'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Nikkei_Logo.svg/250px-Nikkei_Logo.svg.png',
  'Mainichi Shimbun': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Mainichi_Shimbun_logo.svg/250px-Mainichi_Shimbun_logo.svg.png',

  // ── Coreia do Sul (Yonhap ficou no favicon) ─────────────────────────
  'Chosun Ilbo':   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Chosun_IIbo_Logo.svg/250px-Chosun_IIbo_Logo.svg.png',
  'The Hankyoreh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hankyoreh.svg/250px-Hankyoreh.svg.png',
  'JoongAng Ilbo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/The_JoongAng_logo.svg/250px-The_JoongAng_logo.svg.png',
  'KBS':           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/KBS_logo_2023.svg/250px-KBS_logo_2023.svg.png',

  // ── Israel ──────────────────────────────────────────────────────────
  'Haaretz':            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Logo_Haaretz_en_2023_wordmark.svg/250px-Logo_Haaretz_en_2023_wordmark.svg.png',
  'The Jerusalem Post': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Jerusalem_Post_Logo.svg/250px-Jerusalem_Post_Logo.svg.png',
  'Channel 12 (N12)':   'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Keshet12_2018.svg/250px-Keshet12_2018.svg.png',
  'Yedioth Ahronoth':   'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Yedioth_Ahronot_logo.svg/250px-Yedioth_Ahronot_logo.svg.png',
  'Israel Hayom':       'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Israel_Hayom.svg/250px-Israel_Hayom.svg.png',

  // ── Irã ─────────────────────────────────────────────────────────────
  'IRNA':               'https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/Islamic_Republic_News_Agency_logo.svg/250px-Islamic_Republic_News_Agency_logo.svg.png',
  'Press TV':           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Press_TV_logo.svg/250px-Press_TV_logo.svg.png',
  'Fars News':          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Fars_News_Agency_logo_%28until_2021%29.svg/250px-Fars_News_Agency_logo_%28until_2021%29.svg.png',
  'Etemad':             'https://upload.wikimedia.org/wikipedia/fa/thumb/8/8b/Etemad.gif/250px-Etemad.gif',
  'Iran International': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Iran_International_logo_2021_en.svg/250px-Iran_International_logo_2021_en.svg.png',

  // ── Turquia ─────────────────────────────────────────────────────────
  'Anadolu Agency': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Anadolu_Agency_logo_2023_%282%29.svg/250px-Anadolu_Agency_logo_2023_%282%29.svg.png',
  'Daily Sabah':    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Daily_Sabah_logo.svg/250px-Daily_Sabah_logo.svg.png',
  'Hürriyet':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hurriyet.svg/250px-Hurriyet.svg.png',
  'Cumhuriyet':     'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Cumhuriyet_logo.svg/250px-Cumhuriyet_logo.svg.png',
  'Sözcü':          'https://upload.wikimedia.org/wikipedia/en/1/14/Sozculogo248x90.png',

  // ── Arábia Saudita ──────────────────────────────────────────────────
  'Al Arabiya':               'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Al-Arabiya_new_logo.svg/250px-Al-Arabiya_new_logo.svg.png',
  'Saudi Press Agency (SPA)': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Saudi_Press_Agency_Logo.svg/250px-Saudi_Press_Agency_Logo.svg.png',
  'Arab News':                'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Arab_news_Logo_L_Apr_2018.png/250px-Arab_news_Logo_L_Apr_2018.png',
  'Asharq Al-Awsat':          'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Asharq_Al_Awsat_Logo.svg/250px-Asharq_Al_Awsat_Logo.svg.png',

  // ── Egito (Egypt Independent ficou no favicon) ──────────────────────
  'Al-Ahram':         'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Al-Ahram_logo.png/250px-Al-Ahram_logo.png',
  'Mada Masr':        'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Mada_Masr_Logo.svg/250px-Mada_Masr_Logo.svg.png',
  'Al-Masry Al-Youm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Almasry_Alyoum_logo.svg/250px-Almasry_Alyoum_logo.svg.png',

  // ── Ucrânia ─────────────────────────────────────────────────────────
  'Ukrainska Pravda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Ukrainska_Pravda_EN_logo.svg/250px-Ukrainska_Pravda_EN_logo.svg.png',
  'Kyiv Independent': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/The_Kyiv_Independent_logo.svg/250px-The_Kyiv_Independent_logo.svg.png',
  'Suspilne':         'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Suspilne_logo.svg/250px-Suspilne_logo.svg.png',
  'RBC-Ukraine':      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/RBK-Ukraine_logo.svg/250px-RBK-Ukraine_logo.svg.png',

  // ── Coreia do Norte ─────────────────────────────────────────────────
  'KCNA':              'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Logo_of_the_Korean_Central_News_Agency.svg/250px-Logo_of_the_Korean_Central_News_Agency.svg.png',
  'Rodong Sinmun':     'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Rodong_Sinmun_logo.svg/250px-Rodong_Sinmun_logo.svg.png',
  'Korean Central TV': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/KCTV_title.svg/250px-KCTV_title.svg.png',
  'Daily NK':          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Logo_of_the_DailyNK.png/250px-Logo_of_the_DailyNK.png',

  // ── Paquistão ───────────────────────────────────────────────────────
  'Dawn':                'https://upload.wikimedia.org/wikipedia/commons/e/e6/Dawn_Newspaper_logo.png',
  'The Express Tribune': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/The_Express_Tribune_logo.png/250px-The_Express_Tribune_logo.png',
  'Geo News':            'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/GEO_News_logo_in_Urdu.png/250px-GEO_News_logo_in_Urdu.png',
  'ARY News':            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Arynews.jpg/250px-Arynews.jpg',

  // ── Venezuela ───────────────────────────────────────────────────────
  'Telesur':          'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/TeleSUR-Logo.svg/250px-TeleSUR-Logo.svg.png',
  'VTV':              'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Venezolana_de_Televisi%C3%B3n_2018.svg/250px-Venezolana_de_Televisi%C3%B3n_2018.svg.png',
  'El Nacional':      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/El-Nacional-Logo.svg/250px-El-Nacional-Logo.svg.png',
  'Efecto Cocuyo':    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_Efecto_Cocuyo_%28Venezuela%29_2025.png/250px-Logo_Efecto_Cocuyo_%28Venezuela%29_2025.png',
  // a es.wiki usa a marca atual "UN24" no infobox do jornal — é o logo vigente
  'Últimas Noticias': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/UN24_logo.png/250px-UN24_logo.png',

  // ── Indonésia ───────────────────────────────────────────────────────
  'Kompas':           'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Kompas.svg/250px-Kompas.svg.png',
  'Tempo':            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Tempo_Magazine.svg/250px-Tempo_Magazine.svg.png',
  'The Jakarta Post': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/The_Jakarta_Post_logo.svg/250px-The_Jakarta_Post_logo.svg.png',
  'Republika':        'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Logo_Republika.png/250px-Logo_Republika.png',
  'Detik':            'https://upload.wikimedia.org/wikipedia/commons/7/7f/Logodetikcom.png',
};

// Logo real de um veículo: override manual de alta qualidade, ou o favicon do domínio.
// Recebe {nome, dominio} — a UI passa o objeto do veículo direto.
export function logoDe(veiculo) {
  if (!veiculo) return null;
  if (LOGO_MANUAL[veiculo.nome]) return LOGO_MANUAL[veiculo.nome];
  const dom = String(veiculo.dominio || '').replace(/^www\./, '');
  return dom ? `https://icons.duckduckgo.com/ip3/${dom}.ico` : null;
}

// Compat para quem importa LOGO_VEICULO[nome]. ATENÇÃO: isto é o mapa MANUAL puro —
// os ~99 logos do Wikimedia acima. Quem quiser garantia de logo para QUALQUER
// veículo (inclusive Yonhap, Egypt Independent e CartaCapital, que não têm entrada)
// tem de chamar `logoDe(veiculo)`, que cai no favicon pelo DOMÍNIO e por isso não
// cabe num lookup por nome. Um comentário anterior aqui prometia um Proxy que
// resolvia pelo domínio; não existia — e a promessa falsa esconderia justamente o
// bug que estávamos consertando (o post do jornal sem logo).
export const LOGO_VEICULO = LOGO_MANUAL;

// ── RETRATOS DE LÍDERES (DiceBear — avatares GERADOS, pessoas fictícias) ──
// Nunca usamos fotos de políticos reais: os líderes do jogo são personagens fictícios.
export function retrato(seed, estilo = 'notionists') {
  return `https://api.dicebear.com/9.x/${estilo}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a1626`;
}
