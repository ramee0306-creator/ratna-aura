// छत्तीसगढ़ी पाठ: पर्सोना, रिपोर्ट, रिमाइंडर, प्राइवेसी, भुगतान अउ आवाज (hne.ts मं `extra` के रूप मं शामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate premium (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी ले गोठियावव',
    intro: 'हमर AI ज्योतिषी अउ अंक ज्योतिषी मन संग गोठियावव। हर एक के अपन खासियत हे। ए मन AI आंय, असली मनखे नइ हें।',
    perMessage_one: 'हर संदेस बर {{count}} क्रेडिट',
    perMessage_other: 'हर संदेस बर {{count}} क्रेडिट',
    perMinute_one: 'हर मिनट बर {{count}} क्रेडिट',
    perMinute_other: 'हर मिनट बर {{count}} क्रेडिट',
    chat: 'गोठियावव',
    aiNote: '{{name}} एक AI पर्सोना हे, मनखे नइ हे।',
    noFree: 'पर्सोना मन क्रेडिट लेथें। मुफ्त सवाल सिरिफ "AI ले पूछव" बर हें।',
    session: {
      title: 'सत्र सुरू करव',
      intro: 'समय पूरा होय तक जतका मन करय, गोठियावव।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बांचे हे',
      left_other: '{{count}} मिनट बांचे हे',
      ended: 'सत्र खतम होगे। आगू बढ़ाए बर नवा सत्र सुरू करव।',
      capReached: 'ए सत्र के संदेस के सीमा पूरा होगे। आगू बढ़ाए बर नवा सत्र सुरू करव।',
    },
    notEnough: 'क्रेडिट पूरा नइ हे।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, योग अउ दसा के समय, एक-एक कदम करके समझाए गे।' },
      anand: { role: 'अंक ज्योतिषी', text: 'मूलांक, भाग्यांक, नांव के अंक, लो शू ग्रिड, शुभ अंक अउ रंग।' },
      meera: { role: 'प्रेम अउ बिहाव', text: 'आपके चार्ट के जरिया ले रिश्ता, बिहाव अउ परिवार, मया अउ फिकर के संग।' },
      shastri: { role: 'पारंपरिक पंडित', text: 'पंचांग, मुहूर्त (सुघ्घर बखत), तिहार अउ सरल पारंपरिक उपाय।' },
      tara: { role: 'करियर अउ पढ़ई', text: 'ज्योतिष अउ अंक के जरिया ले काम, पढ़ई अउ जिनगी के रद्दा।' },
    },
  },
  report: {
    download: 'PDF रिपोर्ट डाउनलोड करव',
    preparing: 'PDF तियार होवत हे…',
    failed: 'PDF नइ बन पाइस। कृपया फेर कोसिस करव।',
    footer: '{{date}} के दिन Ratna Aura ले बने · {{engine}}',
  },
  reminder: {
    title: 'रोज के रिमाइंडर',
    toggle: 'मोला अपन राशिफल पढ़े बर सुरता कराव',
    time: 'रोज {{time}} बजे',
    earlier: 'पहिली',
    later: 'बाद मं',
    denied: 'Ratna Aura बर सूचना बंद हे। आप एला अपन फोन के सेटिंग मं चालू कर सकथव।',
    notificationTitle: 'आज के आपके राशिफल ✨',
    notificationBody: 'देखव, आज आपके दिन बर ग्रह-नक्षत्र मन का कहिथें।',
    channel: 'रोज के राशिफल',
    webOnly: 'रिमाइंडर फोन ऐप मं चलथे।',
  },
  privacy: {
    aiTitle: 'AI के जवाब',
    ai: 'AI ले पूछव, AI पर्सोना अउ रोज के राशिफल ल Claude लिखथे, जऊन Anthropic के AI हे। आपके जवाब बर, आपके सवाल अउ चुने गे चार्ट के सारांस Anthropic ल भेजे जाथे। एमन ल AI मॉडल मन ल सिखाए बर नइ बउरे जावय।',
    fullPolicy: 'पूरा प्राइवेसी पालिसी',
    terms: 'बउरे के सर्त',
  },
  store: {
    waiting: 'भुगतान मिलगे। आपके क्रेडिट जोड़त हन…',
    added: 'आपके क्रेडिट जुड़गे। धन्यवाद!',
    slow: 'भुगतान मिलगे। आपके क्रेडिट एक मिनट मं दिखही। ताजा करे बर ए स्क्रीन मं पाछू आवव।',
    cancelled: 'खरीदी रद्द होगे। आपके ले कुछु नइ कटिस।',
    failed: 'खरीदी पूरा नइ हो पाइस। आपके ले कुछु नइ कटिस।',
    androidOnly: 'क्रेडिट Google Play ले Android ऐप मं खरीदे जा सकथे।',
  },
  voice: {
    speak: 'जोर ले पढ़व',
    stop: 'पढ़ना रोकव',
    mic: 'अपन सवाल बोलव',
    listening: 'सुनत हे… अब बोलव',
    denied: 'कृपया अपन फोन के सेटिंग मं Ratna Aura बर माइक्रोफोन के इजाजत देव।',
    error: 'सुन नइ पाइस। कृपया फेर कोसिस करव या अपन सवाल लिखव।',
    conversation: 'आवाज मं गोठबात',
    conversationHint: 'अपन सवाल बोलव, जवाब जोर ले पढ़े जाही।',
  },
  premium: extraEnglish.premium, // TODO: translate
};

export default extra;
