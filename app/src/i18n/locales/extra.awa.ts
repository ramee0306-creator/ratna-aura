// नए स्क्रीन (AI पर्सोना, PDF रिपोर्ट, याद दिलावै वाला, निजता, भुगतान, आवाज) कै अवधी पाठ (awa.ts मा `extra` के रूप मा सामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी से बतियावैं',
    intro: 'हमरे AI ज्योतिषी अउर अंक-ज्योतिषी से बातचीत करैं। हर एक आपन खास हुनर वाला AI अहै — कौनौ असली मनई नाहीं।',
    perMessage_one: 'हर संदेस पै {{count}} क्रेडिट',
    perMessage_other: 'हर संदेस पै {{count}} क्रेडिट',
    perMinute_one: 'हर मिनट पै {{count}} क्रेडिट',
    perMinute_other: 'हर मिनट पै {{count}} क्रेडिट',
    chat: 'बातचीत',
    aiNote: '{{name}} एक AI पर्सोना अहै, मनई नाहीं।',
    noFree: 'AI पर्सोना क्रेडिट खरच करत हैं; मुफ्त सवाल खाली AI से पूछैं खातिर अहैं।',
    session: {
      title: 'सेसन सुरू करैं',
      intro: 'समय पूरा होय तक जेतना मन करै बातचीत करैं।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बाकी अहै',
      left_other: '{{count}} मिनट बाकी अहैं',
      ended: 'सेसन खतम होइ गा अहै। आगे चलै खातिर नवा सेसन सुरू करैं।',
      capReached: 'इ सेसन मा संदेसन कै सीमा पूरी होइ गई अहै। आगे चलै खातिर नवा सेसन सुरू करैं।',
    },
    notEnough: 'क्रेडिट पूरे नाहीं अहैं।',
    about: {
      vidya: { role: 'बैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, जोग अउर दसा कै समय, एक-एक कदम समझाय के।' },
      anand: { role: 'अंक-ज्योतिषी', text: 'मूलांक, भाग्यांक, नाम के अंक, लो शू ग्रिड, सुभ अंक अउर रंग।' },
      meera: { role: 'प्रेम अउर बियाह', text: 'आपकै कुंडली से रिस्ता, बियाह अउर परिवार कै बात, अपनापन अउर फिकिर के साथ।' },
      shastri: { role: 'पारंपरिक पंडित', text: 'पतरा (पंचांग), मुहूरत (नीक समय), तीज-तिउहार अउर सीधे-सादे पारंपरिक उपाय।' },
      tara: { role: 'करियर अउर पढ़ाई', text: 'ज्योतिष अउर अंकन से काम, पढ़ाई अउर जिनगी कै राह के बारे मा।' },
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
    download: 'PDF रिपोर्ट डाउनलोड करैं',
    preparing: 'PDF तैयार होइ रही अहै…',
    failed: 'PDF नाहीं बनि सकी। कृपा करिके फिर कोसिस करैं।',
    footer: '{{date}} का Ratna Aura से बनी · {{engine}}',
  },
  reminder: {
    title: 'रोज कै याद',
    toggle: 'हमका राशिफल पढ़ै कै याद दिलावैं',
    time: 'रोज {{time}} बजे',
    earlier: 'पहिले',
    later: 'बाद मा',
    denied: 'Ratna Aura खातिर नोटिफिकेसन बंद अहैं। आप आपन फोन कै सेटिंग मा इनका चालू कै सकत हैं।',
    notificationTitle: 'आजु कै आपकै राशिफल ✨',
    notificationBody: 'देखैं कि तारा आपके दिन खातिर का इसारा देत हैं।',
    channel: 'रोज कै राशिफल',
    webOnly: 'याद दिलावै वाला फोन कै ऐप मा काम करत है।',
  },
  privacy: {
    aiTitle: 'AI के जवाब',
    ai: 'AI से पूछैं, AI पर्सोना अउर रोज कै राशिफल Claude लिखत है, जो Anthropic कै एक AI अहै। आपका जवाब देइ खातिर आपकै सवाल अउर चुनी कुंडली कै सारांस Anthropic का भेजा जात है। इनकै इस्तेमाल AI मॉडल कै ट्रेनिंग खातिर नाहीं होत।',
    fullPolicy: 'पूरी निजता नीति',
    terms: 'इस्तेमाल कै सर्त',
  },
  store: {
    waiting: 'भुगतान मिलि गा। आपके क्रेडिट जोड़े जात अहैं…',
    added: 'आपके क्रेडिट जुड़ि गे अहैं। धन्यबाद!',
    slow: 'भुगतान मिलि गा। आपके क्रेडिट एक मिनट मा देखाइहैं — ताजा करै खातिर इही स्क्रीन पै लौटि आवैं।',
    cancelled: 'खरीद रद्द होइ गई। आपसे कुछौ नाहीं लीन्ह गा।',
    failed: 'खरीद पूरी नाहीं होइ सकी। आपसे कुछौ नाहीं लीन्ह गा।',
    androidOnly: 'क्रेडिट Android ऐप मा Google Play से खरीदे जाइ सकत हैं।',
  },
  voice: {
    speak: 'जोर से सुनैं',
    stop: 'पढ़ब बंद करैं',
    mic: 'आपन सवाल बोलैं',
    listening: 'सुनत अहै… अब बोलैं',
    denied: 'कृपा करिके आपन फोन कै सेटिंग मा Ratna Aura खातिर माइक्रोफोन कै अनुमति देंय।',
    error: 'सुनाई नाहीं दीन्ह। कृपा करिके फिर कोसिस करैं या आपन सवाल लिखि देंय।',
    conversation: 'आवाज मा बातचीत',
    conversationHint: 'आपन सवाल बोलैं; जवाब जोर से सुनावा जाई।',
  },
  premium: {
    title: 'Ratna Aura प्रीमियम',
    tagline: 'रोज तारन से पूछैं, बिना गिनती के।',
    benefits: {
      ask_one: 'बिना सवाल गिने AI से पूछैं (उचित इस्तेमाल: रोज {{count}} तक)',
      ask_other: 'बिना सवाल गिने AI से पूछैं (उचित इस्तेमाल: रोज {{count}} तक)',
      bonus: 'हर बिलिंग अवधि मा AI ज्योतिषी खातिर बोनस क्रेडिट',
      keep: 'बोनस क्रेडिट आपके वॉलेट मा रहत हैं, प्रीमियम खतम होए के बादौ',
      cancel: 'Google Play मा जब मन करै रद्द करैं',
    },
    plans: {
      monthly: 'मासिक',
      quarterly: '3 महीना',
      yearly: 'सालाना',
    },
    billed: {
      monthly: 'हर महीना {{price}} कै भुगतान',
      quarterly: 'हर 3 महीना पै {{price}} कै भुगतान',
      yearly: 'हर साल {{price}} कै भुगतान',
    },
    perMonth: '{{price}} / महीना',
    save: '{{percent}}% बचत',
    bestValue: 'सबसे फायदे वाला',
    bonus_one: 'हर अवधि मा +{{count}} बोनस क्रेडिट',
    bonus_other: 'हर अवधि मा +{{count}} बोनस क्रेडिट',
    trial_one: '{{count}} दिन मुफ्त',
    trial_other: '{{count}} दिन मुफ्त',
    startTrial: 'मुफ्त ट्रायल सुरू करैं',
    subscribe: 'आगे बढ़ैं',
    trialNote_one: '{{count}} दिन मुफ्त, ओकरे बाद {{price}}। ट्रायल खतम होए से पहिले रद्द कइ देइं, तौ आपका कुछौ नाहीं देइ का परी।',
    trialNote_other: '{{count}} दिन मुफ्त, ओकरे बाद {{price}}। ट्रायल खतम होए से पहिले रद्द कइ देइं, तौ आपका कुछौ नाहीं देइ का परी।',
    status: {
      title: 'आप प्रीमियम सदस्य अहैं',
      plan: 'प्लान: {{plan}}',
      renews: '{{date}} का रिन्यू होई',
      ends: '{{date}} का खतम होई। आगे रिन्यू नाहीं होई।',
      trialEnds: '{{date}} तक मुफ्त ट्रायल',
      grace: 'आपकै पिछला भुगतान नाहीं होइ पावा। Google Play फिर से कोसिस करत अहै — प्रीमियम चालू रखै खातिर आपन भुगतान कै तरीका अपडेट करैं।',
      leftToday_one: 'आज {{count}} प्रीमियम सवाल बाकी अहै',
      leftToday_other: 'आज {{count}} प्रीमियम सवाल बाकी अहैं',
    },
    manage: 'सब्सक्रिप्शन सँभारैं',
    updatePayment: 'भुगतान कै तरीका अपडेट करैं',
    cancelTest: 'टेस्ट सब्सक्रिप्शन रद्द करैं',
    cancelledTest: 'टेस्ट सब्सक्रिप्शन रद्द होइ गा। प्रीमियम अवधि के आखिर तक चालू रही।',
    restore: 'खरीद वापस लावैं',
    restored: 'खरीद वापस आइ गई।',
    nothingToRestore: 'इ Google खाता खातिर कौनो चालू सब्सक्रिप्शन नाहीं मिला।',
    welcome: 'प्रीमियम मा आपकै स्वागत अहै! आपके बोनस क्रेडिट जुड़ि गे अहैं।',
    welcomeTrial: 'आपकै मुफ्त ट्रायल सुरू होइ गा। प्रीमियम कै मजा लेइं! बोनस क्रेडिट पहिले भुगतान वाली अवधि के साथ मिलिहैं।',
    waiting: 'भुगतान मिलि गा। प्रीमियम चालू होत अहै…',
    slow: 'भुगतान मिलि गा। प्रीमियम एक मिनट मा सुरू होई — ताजा करै खातिर इही स्क्रीन पै लौटि आवैं।',
    cancelled: 'रद्द होइ गा। आपसे कुछौ नाहीं लीन्ह गा।',
    failed: 'सब्सक्रिप्शन सुरू नाहीं होइ सका। आपसे कुछौ नाहीं लीन्ह गा।',
    testMode: 'टेस्ट मोड: कौनो भुगतान नाहीं लीन्ह जाई अउर प्रीमियम तुरंतै सुरू होइ जाई।',
    off: 'प्रीमियम अबहीं उपलब्ध नाहीं अहै।',
    androidOnly: 'प्रीमियम Android ऐप मा Google Play से खरीदा जाइ सकत है।',
    fine: 'दाम मा GST सामिल अहै। सब्सक्रिप्शन ओही दाम पै अपने आप रिन्यू होत रही, जब तक आप एका रद्द न करैं। Google Play → Payments & subscriptions मा जब मन करै रद्द करैं, रिन्यू कै तारीख से कम से कम 24 घंटा पहिले, अउर प्रीमियम ओह अवधि के आखिर तक चालू रही जेकर भुगतान आप किहे अहैं। मुफ्त ट्रायल मा, ट्रायल खतम होतै पइसा लीन्ह जाई, जब तक आप ओसे पहिले रद्द न कइ देइं।',
    banner: 'प्रीमियम लेइं',
    bannerHint: 'रोज बिना गिनती AI से पूछैं · {{price}} महीना से सुरू',
    bannerActive: 'प्रीमियम चालू अहै',
    askLine_one: 'प्रीमियम · आज {{count}} सवाल बाकी अहै',
    askLine_other: 'प्रीमियम · आज {{count}} सवाल बाकी अहैं',
    askUpsell: 'या प्रीमियम लइके रोज पूछैं',
    usedToday: 'आप आज के प्रीमियम सवाल पूरे कइ लिहे अहैं; इ काल्हि फिर मिलिहैं। तब तक मुफ्त सवाल अउर क्रेडिट इस्तेमाल होइहैं।',
  },
};

export default extra;
