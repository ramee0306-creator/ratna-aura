// نون اسڪرينن (AI ڪردار، PDF رپورٽ، ياد ڏياريندڙ، رازداري، ادائگي، آواز) جو سنڌي متن (sd.ts ۾ `extra` طور شامل).
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate premium (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'جوتشيءَ سان ڳالهايو',
    intro: 'اسان جي AI جوتشين ۽ انگن جي ماهرن سان ڳالهه ٻولهه ڪريو. هر هڪ پنهنجي خاص مهارت وارو AI آهي — ڪو حقيقي ماڻهو ناهي.',
    perMessage_one: 'هر پيغام لاءِ {{count}} ڪريڊٽ',
    perMessage_other: 'هر پيغام لاءِ {{count}} ڪريڊٽ',
    perMinute_one: 'هر منٽ لاءِ {{count}} ڪريڊٽ',
    perMinute_other: 'هر منٽ لاءِ {{count}} ڪريڊٽ',
    chat: 'ڳالهايو',
    aiNote: '{{name}} هڪ AI ڪردار آهي، انسان ناهي.',
    noFree: 'AI ڪردار ڪريڊٽ استعمال ڪن ٿا؛ مفت سوال صرف AI کان پڇو لاءِ آهن.',
    session: {
      title: 'سيشن شروع ڪريو',
      intro: 'وقت پورو ٿيڻ تائين جيترو چاهيو ڳالهه ٻولهه ڪريو.',
      option_one: '{{count}} منٽ · {{credits}} ڪريڊٽ',
      option_other: '{{count}} منٽ · {{credits}} ڪريڊٽ',
      left_one: '{{count}} منٽ باقي آهي',
      left_other: '{{count}} منٽ باقي آهن',
      ended: 'سيشن ختم ٿي ويو آهي. جاري رکڻ لاءِ نئون سيشن شروع ڪريو.',
      capReached: 'هن سيشن ۾ پيغامن جي حد پوري ٿي وئي آهي. جاري رکڻ لاءِ نئون سيشن شروع ڪريو.',
    },
    notEnough: 'ڪريڊٽ ڪافي ناهن.',
    about: {
      vidya: { role: 'ويدڪ جوتشي', text: 'ڪُنڊلي، گرهه، ڀاو، يوگ ۽ دشا جو وقت، قدم بقدم سمجهايل.' },
      anand: { role: 'انگن جو ماهر', text: 'مولانڪ، ڀاڳيانڪ، نالي جا انگ، لو شو گرڊ، خوش نصيب انگ ۽ رنگ.' },
      meera: { role: 'پيار ۽ شادي', text: 'اوهان جي ڪُنڊلي ذريعي رشتا، شادي ۽ ڪٽنب، پنهنجائپ ۽ خيال سان.' },
      shastri: { role: 'روايتي پنڊت', text: 'پنچانگ، مهورت (سٺا وقت)، تهوار ۽ سادا روايتي اُپاءَ.' },
      tara: { role: 'ڪيريئر ۽ تعليم', text: 'جوتش ۽ انگن ذريعي ڪم، تعليم ۽ زندگيءَ جي رخ بابت.' },
    },
  },
  report: {
    download: 'PDF رپورٽ ڊائونلوڊ ڪريو',
    preparing: 'PDF تيار ٿي رهي آهي…',
    failed: 'PDF ٺهي نه سگهي. مهرباني ڪري ٻيهر ڪوشش ڪريو.',
    footer: '{{date}} تي Ratna Aura سان ٺهيل · {{engine}}',
  },
  reminder: {
    title: 'روزانو ياد ڏياريندڙ',
    toggle: 'مون کي راشي ڦل پڙهڻ جي ياد ڏيارجو',
    time: 'هر روز {{time}} تي',
    earlier: 'اڳ',
    later: 'پوءِ',
    denied: 'Ratna Aura لاءِ نوٽيفڪيشن بند آهن. اوهان انهن کي پنهنجي فون جي سيٽنگن ۾ اجازت ڏئي سگهو ٿا.',
    notificationTitle: 'اڄ جو اوهان جو راشي ڦل ✨',
    notificationBody: 'ڏسو ته تارا اوهان جي ڏينهن لاءِ ڪهڙو اشارو ڏين ٿا.',
    channel: 'روزانو راشي ڦل',
    webOnly: 'ياد ڏياريندڙ فون ايپ ۾ ڪم ڪن ٿا.',
  },
  privacy: {
    aiTitle: 'AI جا جواب',
    ai: 'AI کان پڇو، AI ڪردار ۽ روزانو راشي ڦل Claude لکي ٿو، جيڪو Anthropic جو هڪ AI آهي. اوهان کي جواب ڏيڻ لاءِ اوهان جو سوال ۽ چونڊيل ڪُنڊلي جو خلاصو Anthropic ڏانهن موڪليو ويندو آهي. انهن کي AI ماڊلن جي تربيت لاءِ استعمال نه ڪيو ويندو آهي.',
    fullPolicy: 'رازداريءَ جي پوري پاليسي',
    terms: 'استعمال جون شرطون',
  },
  store: {
    waiting: 'ادائگي ملي وئي. اوهان جا ڪريڊٽ شامل ٿي رهيا آهن…',
    added: 'اوهان جا ڪريڊٽ شامل ڪيا ويا آهن. مهرباني!',
    slow: 'ادائگي ملي وئي. اوهان جا ڪريڊٽ هڪ منٽ ۾ نظر ايندا — تازو ڪرڻ لاءِ هن اسڪرين تي واپس اچو.',
    cancelled: 'خريداري رد ڪئي وئي. اوهان کان ڪجهه به نه ورتو ويو.',
    failed: 'خريداري پوري نه ٿي سگهي. اوهان کان ڪجهه به نه ورتو ويو.',
    androidOnly: 'ڪريڊٽ Android ايپ ۾ Google Play تان خريد ڪري سگهجن ٿا.',
  },
  voice: {
    speak: 'وڏي آواز سان ٻڌو',
    stop: 'پڙهڻ بند ڪريو',
    mic: 'پنهنجو سوال ڳالهايو',
    listening: 'ٻڌي رهيو آهي… هاڻي ڳالهايو',
    denied: 'مهرباني ڪري پنهنجي فون جي سيٽنگن ۾ Ratna Aura لاءِ مائيڪروفون جي اجازت ڏيو.',
    error: 'ٻڌي نه سگهيو. مهرباني ڪري ٻيهر ڪوشش ڪريو يا پنهنجو سوال لکو.',
    conversation: 'آواز واري ڳالهه ٻولهه',
    conversationHint: 'پنهنجو سوال ڳالهايو؛ جواب وڏي آواز سان ٻڌايو ويندو.',
  },
  premium: extraEnglish.premium, // TODO: translate
};

export default extra;
