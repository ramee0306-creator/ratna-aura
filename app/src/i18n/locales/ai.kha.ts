// Ka ktien Khasi na ka bynta "Kylli AI" bad ki credit jingkylli (la pynlong ha kha.ts kum `ai`).
import type aiEn from './ai.en';

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const ai: DeepStringRecord<typeof aiEn> = {
  ask: {
    title: 'Kylli AI',
    intro: 'Kylli ia kaei kaei shaphang ka Kundli bad ki nambar jong phi. Ki jingpyntip ki la thoh da u AI, ha ka ktien jong phi.',
    aboutWhom: 'Chart jong ai?',
    general: 'General',
    noPeople: 'Shna mynshuwa ia kawei ka Kundli ban ïoh ki jingpyntip shaphang ka chart jong phi.',
    addKundli: 'Shna Kundli',
    placeholder: 'Thoh ia ka jingkylli jong phi…',
    send: 'Phah',
    thinking: 'U AI u pule ia ka chart…',
    newChat: 'Jingïathuh kaba kyrpad',
    suggestionsTitle: 'Phi lah ban kylli',
    suggestions: {
      career: 'Kaei ka Kundli jong nga ka ong shaphang ka kam jong nga?',
      marriage: 'Kaei ka chart jong nga ka ong shaphang ka marriage bad ki jingïasnoh?',
      year: 'Kumno ka snem kane na ka bynta nga?',
      numbers: 'Kito ki nambar bad ki rong ki ïarap ia nga?',
    },
    you: 'Phi',
    aiName: 'Ratna Aura AI',
    freeLeft_one: 'Don shuh {{count}} jingkylli free',
    freeLeft_other: 'Don shuh {{count}} jingkylli free',
    credits_one: '{{count}} credit',
    credits_other: '{{count}} credit',
    noneLeft: 'Phi la pyndonkam kyllum ia ki jingkylli free. Kawei kawei ka jingkylli kaba kyrpad ka kwah 1 credit.',
    buy: 'Ïoh credit',
    disclaimer: 'Ki jingpyntip ki la thoh da u AI tang na ka bynta jingïalam bad jingsngewthuh. Ki ym dei ka jingïalam ha ka bynta ka jingpang, ka kyntien ne ka pisa.',
    helplineTitle: 'Phi ym dei ban ïaid tang phi',
    helpline: 'Tele-MANAS ka dei free, ki jingkren ki long shyrkhei bad ka plie 24×7: Ïai sha 14416 ne 1-800-891-4416. Lada don emergency, ïai sha 112.',
    callHelpline: 'Ïai sha 14416',
    errors: {
      failed: 'Ym lah ban phah. Kumpai khmih ia ka internet bad pyrshang shuh. Ym la shim pisa na phi.',
      notEnabled: 'Kylli AI ym la plie. Kumpai khmih shuh lashai.',
      busy: 'U AI u kham bun kam kane ka por. Kumpai pyrshang shuh lashai ha shi minute. Ym la shim pisa na phi.',
      declined: 'U AI ym lah ban pyntip ia kane ka jingkylli. Kumpai pyrshang ban kylli ha kawei pat ka rukom. Ym la shim pisa na phi.',
      tooLong: 'Kumpai pynkhuid ia ka jingkylli jong phi ban ym kham 1000 ki akhor.',
    },
    demoAnswer:
      'Ka mode demo: kane ka dei ka jingpyntip kum ka dur. Ha ka app shisha, u AI u pule ia ka Kundli la kyrshan (lagna, Moon sign, planet, dasha) bad ki nambar, bad u pyntip ia ka jingkylli jong phi ha ka ktien jong phi.',
  },
  credits: {
    title: 'Credit jingkylli',
    balance: 'Phi don',
    intro: '1 credit = 1 jingkylli sha Kylli AI. Ki credit ym ju lut.',
    testMode: 'Mode test: ym don pisa ba la shim. Ka jingthied ka pynbun ia ki credit free ban test ia ka app. Ka jingthied shisha na Google Play ka wan lashai.',
    off: 'Ka jingthied credit ym don lashai.',
    pack_one: '{{count}} jingkylli',
    pack_other: '{{count}} jingkylli',
    price: '₹{{price}}',
    buy: 'Thied',
    bought_one: '{{count}} credit la pynbun.',
    bought_other: '{{count}} credit la pynbun.',
    limit: 'Phi la poi sha ka had jong ka sngi ba na ka bynta ki jingthied test.',
    failed: 'Ym lah ban pynkut. Kumpai pyrshang shuh.',
  },
};

export default ai;
