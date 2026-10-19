// Mizo ṭawng: persona, report, reminder, privacy, sum pek leh aw chungchang (lus.ts-ah `extra` angin telh a ni).
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'Astrologer nen Sawi',
    intro: 'Kan AI astrologer leh numerologist te nen inbia rawh. An tinte hian a ṭhat zawng an nei a, AI an ni a — mihring dik tak an ni lo.',
    perMessage_one: 'Thuthawn khat tinah credit {{count}}',
    perMessage_other: 'Thuthawn khat tinah credit {{count}}',
    perMinute_one: 'Minute khat tinah credit {{count}}',
    perMinute_other: 'Minute khat tinah credit {{count}}',
    chat: 'Inbiak',
    aiNote: '{{name}} hi AI persona a ni a, mihring a ni lo.',
    noFree: 'Persona te hian credit an hmang. Zawhna free te hi "AI zawt" atân chauh a ni.',
    session: {
      title: 'Session intan',
      intro: 'Hun a tawp hma loh chuan i duh ang zat inbiak rawh.',
      option_one: 'Minute {{count}} · credit {{credits}}',
      option_other: 'Minute {{count}} · credit {{credits}}',
      left_one: 'Minute {{count}} a la awm',
      left_other: 'Minute {{count}} a la awm',
      ended: 'Session a tawp tawh. Chhunzawm nan session thar intan rawh.',
      capReached: 'He session hian thuthawn chin a thleng tawh. Chhunzawm nan session thar intan rawh.',
    },
    notEnough: 'Credit a tling lo.',
    about: {
      vidya: { role: 'Vedic astrologer', text: 'Kundli, planet, bhava, yoga leh dasha hun, pawl zel zelin hrilhfiah.' },
      anand: { role: 'Numerologist', text: 'Mulank, Bhagyank, hming number, Lo Shu grid, number leh rawng ṭha.' },
      meera: { role: 'Hmangaihna leh inneihna', text: 'I chart hmangin inlaichînna, inneihna leh chhungkua chungchang, ngilneihna leh fimkhurna nen.' },
      shastri: { role: 'Hnam dan pandit', text: 'Panchang, muhurta (hun ṭha), kuthnghah leh hnam dan anga tihdan ngaihnawm.' },
      tara: { role: 'Hnathawh leh zirna', text: 'Astrology leh number hmangin hnathawh, zirna leh nunphung kawng.' },
      devraj: extraEnglish.personas.about.devraj, // TODO: translate
      kavya: extraEnglish.personas.about.kavya, // TODO: translate
      gopal: extraEnglish.personas.about.gopal, // TODO: translate
      lakshmi: extraEnglish.personas.about.lakshmi, // TODO: translate
      arjun: extraEnglish.personas.about.arjun, // TODO: translate
      savitri: extraEnglish.personas.about.savitri, // TODO: translate
      rudra: extraEnglish.personas.about.rudra, // TODO: translate
    },
  },
  report: {
    download: 'PDF report la rawh',
    preparing: 'PDF buatsaih mek…',
    failed: 'PDF siam theih a ni lo. Ti leh rawh.',
    footer: '{{date}} khân Ratna Aura hmangin siam a ni · {{engine}}',
  },
  reminder: {
    title: 'Ni tin hriattirna',
    toggle: 'Ka rashifal chhiar tûrin min hriat nawn rawh',
    time: 'Ni tin {{time}} ah',
    earlier: 'Hma zawk',
    later: 'Hnua zawk',
    denied: 'Ratna Aura atân notification chu khap a ni. I phone setting-ah i phal thei.',
    notificationTitle: 'Vawiin i rashifal ✨',
    notificationBody: 'Vawiin i ni tân arsi te hian eng nge an sawi en rawh.',
    channel: 'Ni tin rashifal',
    webOnly: 'Hriattirna hi phone app-ah chauh a hman theih.',
  },
  privacy: {
    aiTitle: 'AI chhanna',
    ai: 'AI zawt, AI persona te leh ni tin rashifal te hi Claude, Anthropic AI-in a ziak a ni. I chhan nân i zawhna leh chart thlan summary chu Anthropic-ah thawn a ni. AI model zirtîr nân hman a ni lo.',
    fullPolicy: 'Privacy policy zawng zawng',
    terms: 'Hman dan',
  },
  store: {
    waiting: 'Sum pek dawn a ni. I credit belh mek…',
    added: 'I credit belh a ni tawh. Ka lawm e!',
    slow: 'Sum pek dawn a ni. I credit chu minute khat chhunga a lang ang — he screen-ah lo kir leh la, thar rawh.',
    cancelled: 'Lei chu tihtawp a ni. Engmah i sen lo.',
    failed: 'Lei hi tihfel theih a ni lo. Engmah i sen lo.',
    androidOnly: 'Credit hi Google Play atanga Android app-ah lei theih a ni.',
  },
  voice: {
    speak: 'Aw chhuahin chhiar',
    stop: 'Chhiar tawp',
    mic: 'I zawhna sawi rawh',
    listening: 'Ngaithla mek… sawi rawh',
    denied: 'I phone setting-ah Ratna Aura atân microphone phalsak rawh.',
    error: 'Hre thei lo. Ti leh rawh emaw i zawhna ziak rawh.',
    conversation: 'Aw hmanga inbiakna',
    conversationHint: 'I zawhna sawi rawh; chhanna chu aw chhuahin chhiar a ni ang.',
  },
  premium: {
    title: 'Ratna Aura Premium',
    tagline: 'Ni tin arsi te zawt rawh, chhiar lovin.',
    benefits: {
      ask_one: 'Zawhna chhiar lovin AI zawt rawh (hman dan fel: ni khatah {{count}} thleng)',
      ask_other: 'Zawhna chhiar lovin AI zawt rawh (hman dan fel: ni khatah {{count}} thleng)',
      bonus: 'Bill hun tinah bonus credit, AI astrologer te tân',
      keep: 'Premium a tawp hnu pawhin bonus credit chu i wallet-ah a awm reng',
      cancel: 'Google Play-ah engtik lai pawhin tihtawp theih',
    },
    plans: {
      monthly: 'Thla khat',
      quarterly: 'Thla 3',
      yearly: 'Kum khat',
    },
    billed: {
      monthly: 'Thla tin {{price}} lak a ni',
      quarterly: 'Thla 3 dan tinah {{price}} lak a ni',
      yearly: 'Kum tin {{price}} lak a ni',
    },
    perMonth: '{{price}} / thla',
    save: '{{percent}}% tlawm zawk',
    bestValue: 'Hlawk ber',
    bonus_one: 'Hun tinah bonus credit +{{count}}',
    bonus_other: 'Hun tinah bonus credit +{{count}}',
    trial_one: 'Ni {{count}} free',
    trial_other: 'Ni {{count}} free',
    startTrial: 'Free trial ṭan rawh',
    subscribe: 'Kal zel rawh',
    trialNote_one: 'Ni {{count}} chhung free, chumi hnuah {{price}}. Trial a tawp hmaa i tihtawp chuan engmah i pe lo vang.',
    trialNote_other: 'Ni {{count}} chhung free, chumi hnuah {{price}}. Trial a tawp hmaa i tihtawp chuan engmah i pe lo vang.',
    status: {
      title: 'Premium i ni',
      plan: 'Plan: {{plan}}',
      renews: '{{date}} ah a thar leh ang',
      ends: '{{date}} ah a tawp ang. A thar leh tawh lo vang.',
      trialEnds: '{{date}} thleng free trial',
      grace: 'I sum pek hnuhnung ber a kal thei lo. Google Play-in a ti leh mek — Premium vawng reng tûrin i sum pek dan thlak (update) rawh.',
      leftToday_one: 'Vawiin Premium zawhna {{count}} a la awm',
      leftToday_other: 'Vawiin Premium zawhna {{count}} a la awm',
    },
    manage: 'Subscription enkawl',
    updatePayment: 'Sum pek dan thlak',
    cancelTest: 'Test subscription tihtawp',
    cancelledTest: 'Test subscription tihtawp a ni. Hun tawp thlengin Premium a awm reng ang.',
    restore: 'Lei tawh te lak kir',
    restored: 'Lei tawh te lak kir a ni.',
    nothingToRestore: 'He Google account-ah hian subscription hman mek hmuh a ni lo.',
    welcome: 'Premium-ah kan lo lawm a che! I bonus credit belh a ni tawh.',
    welcomeTrial: 'I free trial a ṭan tawh. Premium hmang nuam rawh! Bonus credit chu sum i pek hmasak ber hun nen a lo awm ang.',
    waiting: 'Sum pek dawn a ni. Premium hawn mek…',
    slow: 'Sum pek dawn a ni. Minute khat chhungin Premium a ṭan ang — he screen-ah lo kir leh la, thar rawh.',
    cancelled: 'Tihtawp a ni. Engmah i sen lo.',
    failed: 'Subscription ṭan theih a ni lo. Engmah i sen lo.',
    testMode: 'Test mode: sum engmah lak a ni lo va, Premium chu a ṭan nghal.',
    off: 'Premium hi la hman theih a ni lo.',
    androidOnly: 'Premium hi Google Play atanga Android app-ah lei theih a ni.',
    fine: 'Man ah hian GST a tel. I tihtawp thlengin subscription hi man inang chiahin amah-in a thar leh ziah ang. A thar leh ni hma darkar 24 tal ah Google Play → Payments & subscriptions-ah engtik lai pawhin i tihtawp thei a, sum i pek hun chhung tawp thlengin Premium a awm reng ang. Free trial i neih chuan, trial a tawp hmaa i tihtawp loh chuan trial a tawp hunah sum lak i ni ang.',
    banner: 'Premium la rawh',
    bannerHint: 'Ni tin AI zawt rawh, chhiar lovin · thla khatah {{price}} aṭangin',
    bannerActive: 'Premium hawn a ni',
    askLine_one: 'Premium · vawiin zawhna {{count}} a la awm',
    askLine_other: 'Premium · vawiin zawhna {{count}} a la awm',
    askUpsell: 'Emaw Premium la la, ni tin zawt rawh',
    usedToday: 'Vawiin Premium zawhna te i hmang zo tawh; naktukah an lo awm leh ang. Chu chen chu zawhna free leh credit te hman a ni ang.',
  },
};

export default extra;
