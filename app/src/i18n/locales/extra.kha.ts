// Ka ktien Khasi: persona, report, reminder, privacy, jingpaw pisa bad ka jingkren (la pynlong ha kha.ts kum `extra`).
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'Ïakren bad u Nongtip Astrology',
    intro: 'Ïakren bad ki AI astrologer bad numerologist jong ngi. Kawei kawei ka don ka jingkhia jong ka. Ki dei AI, ym dei ki briew shisha.',
    perMessage_one: '{{count}} credit na ka bynta kawei ka jingpaw',
    perMessage_other: '{{count}} credit na ka bynta kawei ka jingpaw',
    perMinute_one: '{{count}} credit na ka bynta kawei ka minute',
    perMinute_other: '{{count}} credit na ka bynta kawei ka minute',
    chat: 'Ïakren',
    aiNote: 'U {{name}} u dei u AI persona, ym dei u briew.',
    noFree: 'Ki persona ki pyndonkam ia ki credit. Ki jingkylli free ki long tang na ka bynta Kylli AI.',
    session: {
      title: 'Sdang ka session',
      intro: 'Ïakren kum ba phi kwah haduh ban ka por ka khreh.',
      option_one: '{{count}} minute · {{credits}} credit',
      option_other: '{{count}} minute · {{credits}} credit',
      left_one: 'Don shuh {{count}} minute',
      left_other: 'Don shuh {{count}} minute',
      ended: 'Ka session ka la khreh. Sdang ia ka session kaba kyrpad ban ïaid shuh.',
      capReached: 'Kane ka session ka la poi sha ka had jong ki jingpaw. Sdang ia ka session kaba kyrpad ban ïaid shuh.',
    },
    notEnough: 'Ki credit ym lah.',
    about: {
      vidya: { role: 'Nongtip astrology Vedic', text: 'Kundli, ki planet, ki ïing, ki yoga bad ka por dasha, la pynsngewthuh kawei kawei ka kam.' },
      anand: { role: 'Nongtip numerology', text: 'Mulank, Bhagyank, ki nambar jong ka kyrteng, Lo Shu grid, ki nambar bad ki rong ba bha.' },
      meera: { role: 'Ka jingieit bad marriage', text: 'Ki jingïasnoh, marriage bad ka kur ka khat da ka chart jong phi, bad ka jingieit bad ka jingkyrmen.' },
      shastri: { role: 'Pandit ka dustur', text: 'Panchang, muhurta (ki por ba bha), ki festival bad ki jingïarap ba sngew ka dustur.' },
      tara: { role: 'Ka kam bad ka jingpule', text: 'Ka kam, ka jingpule bad ka lynti ka jingim da astrology bad ki nambar.' },
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
    download: 'Download ia ka PDF report',
    preparing: 'Ka shna ia ka PDF…',
    failed: 'Ym lah ban shna ia ka PDF. Kumpai pyrshang shuh.',
    footer: 'La shna da Ratna Aura ha {{date}} · {{engine}}',
  },
  reminder: {
    title: 'Jingpynkynmaw sngi-sngi',
    toggle: 'Pynkynmaw ia nga ban pule ia ka rashifal jong nga',
    time: 'Kawei kawei ka sngi ha {{time}}',
    earlier: 'Kham mynshuwa',
    later: 'Kham lashai',
    denied: 'Ki notification na ka bynta Ratna Aura ki la khang. Phi lah ban pyllait ia ki ha ki setting ka phone jong phi.',
    notificationTitle: 'Ka rashifal jong phi na ka bynta mynta ka sngi ✨',
    notificationBody: 'Khmih kaei ki khlur ki ong na ka bynta ka sngi jong phi.',
    channel: 'Rashifal sngi-sngi',
    webOnly: 'Ki jingpynkynmaw ki kam ha ka app phone.',
  },
  privacy: {
    aiTitle: 'Ki jingpyntip AI',
    ai: 'Kylli AI, ki AI persona bad ka rashifal sngi-sngi ki la thoh da u Claude, u AI na u Anthropic. Ban pyntip ia phi, ka jingkylli jong phi bad ka bynta ba kyllum shaphang ka chart la kyrshan ki la phah sha u Anthropic. Ki ym pyndonkam ban pule ia ki model AI.',
    fullPolicy: 'Ka privacy policy kaba kut',
    terms: 'Ki jingpyndonkam',
  },
  store: {
    waiting: 'La ïoh ia ka jingthied. Ka pynbun ia ki credit jong phi…',
    added: 'Ki credit jong phi la pynbun. Khublei!',
    slow: 'La ïoh ia ka jingthied. Ki credit jong phi ki dei ban pynlong ha shi minute — kylla shuh sha kane ka screen ban pynkylla.',
    cancelled: 'Ka jingthied la pynkut. Ym la shim pisa na phi.',
    failed: 'Ka jingthied ym lah ban pynkut. Ym la shim pisa na phi.',
    androidOnly: 'Ki credit ki lah ban thied ha ka app Android na Google Play.',
  },
  voice: {
    speak: 'Pule da ka jingkren',
    stop: 'Ym pule shuh',
    mic: 'Kren ia ka jingkylli jong phi',
    listening: 'Ka sngap… kren mynta',
    denied: 'Kumpai pyllait ia ka microphone na ka bynta Ratna Aura ha ki setting ka phone jong phi.',
    error: 'Ym lah ban sngap. Kumpai pyrshang shuh ne thoh ia ka jingkylli jong phi.',
    conversation: 'Jingïakren da ka jingkren',
    conversationHint: 'Kren ia ka jingkylli jong phi; ka jingpyntip ka pule da ka jingkren.',
  },
  premium: {
    title: 'Ratna Aura Premium',
    tagline: 'Kylli ia ki khlur man la ka sngi, khlem da pyrkhat katno.',
    benefits: {
      ask_one: 'Kylli AI khlem da pyrkhat katno ki jingkylli (pyndonkam kaba biang: haduh {{count}} ha ka sngi)',
      ask_other: 'Kylli AI khlem da pyrkhat katno ki jingkylli (pyndonkam kaba biang: haduh {{count}} ha ka sngi)',
      bonus: 'Ki credit bonus man la ka por billing, na ka bynta ki AI astrologer',
      keep: 'Ki credit bonus ki sah ha ka wallet jong phi, wat haba ka Premium ka la kut',
      cancel: 'Cancel ha Google Play ha kano kano ka por',
    },
    plans: {
      monthly: 'Shi bnai',
      quarterly: '3 bnai',
      yearly: 'Shi snem',
    },
    billed: {
      monthly: 'Siew {{price}} man la u bnai',
      quarterly: 'Siew {{price}} man la 3 bnai',
      yearly: 'Siew {{price}} man la u snem',
    },
    perMonth: '{{price}} / bnai',
    save: 'Pynsah {{percent}}%',
    bestValue: 'Kaba kham bha tam',
    bonus_one: '+{{count}} credit bonus man la ka por',
    bonus_other: '+{{count}} credit bonus man la ka por',
    trial_one: '{{count}} sngi free',
    trial_other: '{{count}} sngi free',
    startTrial: 'Sdang ia ka trial free',
    subscribe: 'Ïaid shaphrang',
    trialNote_one: 'Free ha {{count}} sngi, nadien {{price}}. Lada phi cancel shuwa ba ka trial ka kut, phi ym siew ei ei.',
    trialNote_other: 'Free ha {{count}} sngi, nadien {{price}}. Lada phi cancel shuwa ba ka trial ka kut, phi ym siew ei ei.',
    status: {
      title: 'Phi dei Premium',
      plan: 'Plan: {{plan}}',
      renews: 'Ka pynthymmai ia lade ha {{date}}',
      ends: 'Ka kut ha {{date}}. Kan ym pynthymmai shuh.',
      trialEnds: 'Trial free haduh {{date}}',
      grace: 'Ka jingsiew kaba kut jong phi ka ym lah ban leit. Google Play ka pyrshang shuh — kumpai pynkylla ia ka rukom siew jong phi ban sah ia ka Premium.',
      leftToday_one: 'Don shuh {{count}} jingkylli Premium mynta ka sngi',
      leftToday_other: 'Don shuh {{count}} jingkylli Premium mynta ka sngi',
    },
    manage: 'Pynbeit ia ka subscription',
    updatePayment: 'Pynkylla ia ka rukom siew',
    cancelTest: 'Cancel ia ka subscription test',
    cancelledTest: 'Ka subscription test la cancel. Ka Premium ka sah haduh ba kut ka por.',
    restore: 'Pynwan biang ia ki jingthied',
    restored: 'Ki jingthied la pynwan biang.',
    nothingToRestore: 'Ym shem ei ei ka subscription kaba dang kam na ka bynta kane ka Google account.',
    welcome: 'Pdiang sngewbha sha Premium! Ki credit bonus jong phi la pynbun.',
    welcomeTrial: 'Ka trial free jong phi ka la sdang. Kmen bad ka Premium! Ki credit bonus ki wan lem bad ka por kaba nyngkong ba phi siew.',
    waiting: 'La ïoh ia ka jingsiew. Ka plie ia ka Premium…',
    slow: 'La ïoh ia ka jingsiew. Ka Premium kan sdang ha shi minute — kylla shuh sha kane ka screen ban pynkylla.',
    cancelled: 'La cancel. Ym la shim pisa na phi.',
    failed: 'Ym lah ban sdang ia ka subscription. Ym la shim pisa na phi.',
    testMode: 'Mode test: ym shim pisa bad ka Premium ka sdang mynta hi.',
    off: 'Ka Premium kam pat don.',
    androidOnly: 'Ka Premium ka lah ban thied ha ka app Android na Google Play.',
    fine: 'Ki dor ki ïadon lem ka GST. Ka subscription ka pynthymmai da lade hi ha kajuh ka dor haduh ba phi cancel ia ka. Phi lah ban cancel ha kano kano ka por ha Google Play → Payments & subscriptions, ym duna ban 24 kynta shuwa ka sngi ba kan pynthymmai, bad ka Premium kan sah haduh ba kut ka por ba phi la siew. Lada phi don ka trial free, yn shim pisa na phi haba ka trial ka kut, lada phi ym cancel shuwa kata.',
    banner: 'Long Premium',
    bannerHint: 'Kylli AI man la ka sngi khlem da pyrkhat katno · na {{price}} shi bnai',
    bannerActive: 'Ka Premium ka la plie',
    askLine_one: 'Premium · don shuh {{count}} jingkylli mynta ka sngi',
    askLine_other: 'Premium · don shuh {{count}} jingkylli mynta ka sngi',
    askUpsell: 'Ne long Premium bad kylli man la ka sngi',
    usedToday: 'Phi la pyndonkam kyllum ia ki jingkylli Premium jong mynta ka sngi; ki wan biang lashai. Haduh kata, yn pyndonkam ia ki jingkylli free bad ki credit.',
  },
};

export default extra;
