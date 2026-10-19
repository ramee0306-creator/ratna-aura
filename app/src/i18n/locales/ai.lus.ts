// "AI zawt" leh zawhna credit-te Mizo ṭawngin (lus.ts-ah `ai` angin telh a ni).
import type aiEn from './ai.en';

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const ai: DeepStringRecord<typeof aiEn> = {
  ask: {
    title: 'AI zawt',
    intro: 'I kundli leh number chungchang eng pawh zawt rawh. Chhanna te hi AI-in i ṭawngin a ziak.',
    aboutWhom: 'Tu chart nge?',
    general: 'Pangngai',
    noPeople: 'I chart ngei chungchanga chhanna dawn tûrin kundli pakhat hmasa dah rawh.',
    addKundli: 'Kundli dah',
    placeholder: 'I zawhna ziak rawh…',
    send: 'Thawn',
    thinking: 'AI hian chart a chhiar mek…',
    newChat: 'Inbiakna thar',
    suggestionsTitle: 'Hetiang hi i zawt thei',
    suggestions: {
      career: 'Ka kundli hian ka hnathawh (career) chungchang eng nge a sawi?',
      marriage: 'Ka chart hian inneihna leh inlaichînna chungchang eng nge a sawi?',
      year: 'He kum hi ka tân eng ang nge a nih?',
      numbers: 'Number leh rawng eng nge ka tân a ṭha?',
    },
    you: 'Nang',
    aiName: 'Ratna Aura AI',
    freeLeft_one: 'Zawhna free {{count}} a la awm',
    freeLeft_other: 'Zawhna free {{count}} a la awm',
    credits_one: '{{count}} credit',
    credits_other: '{{count}} credit',
    noneLeft: 'I zawhna free te i hmang zo tawh. Zawhna thar tin hian credit 1 a ngai.',
    buy: 'Credit lei',
    disclaimer: 'Chhanna te hi AI-in kaihhruaina leh ngaihtuahna atân chauhin a ziak a ni. Damdawi, dan emaw sum leh pai lam thurawn a ni lo.',
    helplineTitle: 'Nangmah chauhin i tuar mai a ngai lo',
    helpline: 'Tele-MANAS hi free a ni a, i thusawi thuruk a vawng a, ni tin darkar 24 hawng reng a ni: 14416 emaw 1-800-891-4416 ah ko rawh. Emergency a nih chuan 112 ah ko rawh.',
    callHelpline: '14416 ko',
    errors: {
      failed: 'Thawn theih a ni lo. Internet connection en la, ti leh rawh. Engmah i sen lo.',
      notEnabled: 'AI zawt hi la hawng lo. Rei lo te hnuah en leh rawh.',
      busy: 'AI hi tunah a hlawh a ni. Minute khat hnuah ti leh rawh. Engmah i sen lo.',
      declined: 'AI hian he zawhna hi a chhan thei lo. Dang takin zawt leh rawh. Engmah i sen lo.',
      tooLong: 'I zawhna hi cha 1000 aia tlem tûrin ziak rawh.',
    },
    demoAnswer:
      'Demo mode: hei hi chhanna entîrna a ni. App dik takah chuan, AI hian kundli thlan (lagna, Thla rashi, planet, dasha) leh number a chhiar a, i ṭawngin i zawhna a chhan ang.',
  },
  credits: {
    title: 'Zawhna credit',
    balance: 'I nei',
    intro: '1 credit = AI zawhna 1. Credit hi a bo ngai lo.',
    testMode: 'Test mode: sum engmah lak a ni lo. Lei hian credit free-in a belh a, app test theih nân a ni. Google Play atanga dik taka sum pek chu a lo la awm ang.',
    off: 'Credit lei theih hi la awm lo.',
    pack_one: 'Zawhna {{count}}',
    pack_other: 'Zawhna {{count}}',
    price: '₹{{price}}',
    buy: 'Lei',
    bought_one: 'Credit {{count}} belh a ni.',
    bought_other: 'Credit {{count}} belh a ni.',
    limit: 'Vawiin test lei tûr chin i thleng tawh.',
    failed: 'Tihfel theih a ni lo. Ti leh rawh.',
  },
};

export default ai;
