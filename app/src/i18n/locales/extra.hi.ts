// AI पर्सोना, PDF रिपोर्ट, रिमाइंडर, गोपनीयता, भुगतान और आवाज़ का हिन्दी पाठ (hi.ts में `extra` के रूप में शामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी से बात करें',
    intro: 'हमारे AI ज्योतिषियों और अंक-शास्त्रियों से बातचीत करें। हर एक अपनी खास विशेषता वाला AI है — कोई असली इंसान नहीं।',
    perMessage_one: 'हर संदेश के लिए {{count}} क्रेडिट',
    perMessage_other: 'हर संदेश के लिए {{count}} क्रेडिट',
    perMinute_one: 'हर मिनट के लिए {{count}} क्रेडिट',
    perMinute_other: 'हर मिनट के लिए {{count}} क्रेडिट',
    chat: 'बातचीत',
    aiNote: '{{name}} एक AI पर्सोना है, इंसान नहीं।',
    noFree: 'पर्सोना क्रेडिट से चलते हैं; निःशुल्क प्रश्न केवल "AI से पूछें" के लिए हैं।',
    session: {
      title: 'सत्र शुरू करें',
      intro: 'समय पूरा होने तक जितनी चाहें बातचीत करें।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बाकी',
      left_other: '{{count}} मिनट बाकी',
      ended: 'सत्र समाप्त हो गया है। जारी रखने के लिए नया सत्र शुरू करें।',
      capReached: 'इस सत्र में संदेशों की सीमा पूरी हो गई है। जारी रखने के लिए नया सत्र शुरू करें।',
    },
    notEnough: 'क्रेडिट पर्याप्त नहीं हैं।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, योग और दशा का समय — सब कुछ चरण-दर-चरण समझाया गया।' },
      anand: { role: 'अंक-शास्त्री', text: 'मूलांक, भाग्यांक, नाम के अंक, लो शू ग्रिड, शुभ अंक और रंग।' },
      meera: { role: 'प्रेम और विवाह', text: 'आपकी कुंडली के ज़रिए रिश्ते, विवाह और परिवार — अपनापन और परवाह के साथ।' },
      shastri: { role: 'पारंपरिक पंडित', text: 'पंचांग, मुहूर्त (शुभ समय), त्योहार और सरल पारंपरिक उपाय।' },
      tara: { role: 'करियर और पढ़ाई', text: 'ज्योतिष और अंकों के ज़रिए काम, पढ़ाई और जीवन की दिशा।' },
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
    download: 'PDF रिपोर्ट डाउनलोड करें',
    preparing: 'PDF तैयार हो रही है…',
    failed: 'PDF नहीं बन सकी। कृपया फिर से कोशिश करें।',
    footer: 'Ratna Aura द्वारा {{date}} को बनाई गई · {{engine}}',
  },
  reminder: {
    title: 'दैनिक रिमाइंडर',
    toggle: 'मुझे राशिफल पढ़ने की याद दिलाएँ',
    time: 'हर दिन {{time}} बजे',
    earlier: 'पहले',
    later: 'बाद में',
    denied: 'Ratna Aura के लिए सूचनाएँ बंद हैं। आप उन्हें अपने फ़ोन की सेटिंग में चालू कर सकते हैं।',
    notificationTitle: 'आज का आपका राशिफल ✨',
    notificationBody: 'देखें कि सितारे आपके दिन के लिए क्या संकेत देते हैं।',
    channel: 'दैनिक राशिफल',
    webOnly: 'रिमाइंडर फ़ोन ऐप में काम करते हैं।',
  },
  privacy: {
    aiTitle: 'AI के जवाब',
    ai: 'AI से पूछें, AI पर्सोना और दैनिक राशिफल Anthropic के AI, Claude द्वारा लिखे जाते हैं। आपको जवाब देने के लिए आपका प्रश्न और चुनी हुई कुंडली का सारांश Anthropic को भेजा जाता है। इनका उपयोग AI मॉडल को प्रशिक्षित करने के लिए नहीं किया जाता।',
    fullPolicy: 'पूरी गोपनीयता नीति',
    terms: 'उपयोग की शर्तें',
  },
  store: {
    waiting: 'भुगतान मिल गया। आपके क्रेडिट जोड़े जा रहे हैं…',
    added: 'आपके क्रेडिट जोड़ दिए गए हैं। धन्यवाद!',
    slow: 'भुगतान मिल गया। आपके क्रेडिट एक मिनट में दिखेंगे — ताज़ा करने के लिए इस स्क्रीन पर वापस आएँ।',
    cancelled: 'खरीदारी रद्द हो गई। आपसे कोई शुल्क नहीं लिया गया।',
    failed: 'खरीदारी पूरी नहीं हो सकी। आपसे कोई शुल्क नहीं लिया गया।',
    androidOnly: 'क्रेडिट Android ऐप में Google Play से खरीदे जा सकते हैं।',
  },
  voice: {
    speak: 'ज़ोर से पढ़ें',
    stop: 'पढ़ना रोकें',
    mic: 'अपना प्रश्न बोलें',
    listening: 'सुन रहा हूँ… अब बोलिए',
    denied: 'कृपया अपने फ़ोन की सेटिंग में Ratna Aura के लिए माइक्रोफ़ोन की अनुमति दें।',
    error: 'सुनाई नहीं दिया। कृपया फिर से कोशिश करें या अपना प्रश्न लिखें।',
    conversation: 'आवाज़ से बातचीत',
    conversationHint: 'अपना प्रश्न बोलें; जवाब ज़ोर से पढ़कर सुनाया जाएगा।',
  },
  premium: {
    title: 'Ratna Aura प्रीमियम',
    tagline: 'हर दिन सितारों से पूछें, बिना गिने।',
    benefits: {
      ask_one: 'AI से पूछें, प्रश्न गिने बिना (उचित उपयोग: दिन में {{count}} तक)',
      ask_other: 'AI से पूछें, प्रश्न गिने बिना (उचित उपयोग: दिन में {{count}} तक)',
      bonus: 'हर बिलिंग अवधि में AI ज्योतिषियों के लिए बोनस क्रेडिट',
      keep: 'बोनस क्रेडिट आपके वॉलेट में रहते हैं, प्रीमियम खत्म होने के बाद भी',
      cancel: 'Google Play में कभी भी रद्द करें',
    },
    plans: {
      monthly: 'मासिक',
      quarterly: '3 महीने',
      yearly: 'वार्षिक',
    },
    billed: {
      monthly: 'हर महीने {{price}} का शुल्क',
      quarterly: 'हर 3 महीने में {{price}} का शुल्क',
      yearly: 'हर साल {{price}} का शुल्क',
    },
    perMonth: '{{price}} / महीना',
    save: '{{percent}}% बचत',
    bestValue: 'सबसे फ़ायदेमंद',
    bonus_one: 'हर अवधि में +{{count}} बोनस क्रेडिट',
    bonus_other: 'हर अवधि में +{{count}} बोनस क्रेडिट',
    trial_one: '{{count}} दिन मुफ़्त',
    trial_other: '{{count}} दिन मुफ़्त',
    startTrial: 'मुफ़्त ट्रायल शुरू करें',
    subscribe: 'आगे बढ़ें',
    trialNote_one: '{{count}} दिन मुफ़्त, फिर {{price}}। ट्रायल खत्म होने से पहले रद्द कर दें, तो आपको कुछ नहीं देना होगा।',
    trialNote_other: '{{count}} दिन मुफ़्त, फिर {{price}}। ट्रायल खत्म होने से पहले रद्द कर दें, तो आपको कुछ नहीं देना होगा।',
    status: {
      title: 'आप प्रीमियम सदस्य हैं',
      plan: 'प्लान: {{plan}}',
      renews: '{{date}} को रिन्यू होगा',
      ends: '{{date}} को खत्म होगा। यह रिन्यू नहीं होगा।',
      trialEnds: '{{date}} तक मुफ़्त ट्रायल',
      grace: 'आपका पिछला भुगतान नहीं हो सका। Google Play फिर से कोशिश कर रहा है — प्रीमियम जारी रखने के लिए कृपया अपना भुगतान तरीका अपडेट करें।',
      leftToday_one: 'आज {{count}} प्रीमियम प्रश्न बाकी',
      leftToday_other: 'आज {{count}} प्रीमियम प्रश्न बाकी',
    },
    manage: 'सदस्यता प्रबंधित करें',
    updatePayment: 'भुगतान तरीका अपडेट करें',
    cancelTest: 'टेस्ट सदस्यता रद्द करें',
    cancelledTest: 'टेस्ट सदस्यता रद्द हो गई। प्रीमियम अवधि के अंत तक जारी रहेगा।',
    restore: 'खरीदारी वापस लाएँ',
    restored: 'खरीदारी वापस आ गई।',
    nothingToRestore: 'इस Google खाते के लिए कोई सक्रिय सदस्यता नहीं मिली।',
    welcome: 'प्रीमियम में आपका स्वागत है! आपके बोनस क्रेडिट जोड़ दिए गए हैं।',
    welcomeTrial: 'आपका मुफ़्त ट्रायल शुरू हो गया है। प्रीमियम का आनंद लें! बोनस क्रेडिट पहली भुगतान वाली अवधि के साथ मिलेंगे।',
    waiting: 'भुगतान मिल गया। प्रीमियम चालू किया जा रहा है…',
    slow: 'भुगतान मिल गया। प्रीमियम एक मिनट में शुरू होगा — ताज़ा करने के लिए इस स्क्रीन पर वापस आएँ।',
    cancelled: 'रद्द हो गया। आपसे कोई शुल्क नहीं लिया गया।',
    failed: 'सदस्यता शुरू नहीं हो सकी। आपसे कोई शुल्क नहीं लिया गया।',
    testMode: 'टेस्ट मोड: कोई भुगतान नहीं लिया जाता और प्रीमियम तुरंत शुरू हो जाता है।',
    off: 'प्रीमियम अभी उपलब्ध नहीं है।',
    androidOnly: 'प्रीमियम Android ऐप में Google Play से खरीदा जा सकता है।',
    fine: 'कीमतों में GST शामिल है। जब तक आप सदस्यता रद्द नहीं करते, यह उसी कीमत पर अपने-आप रिन्यू होती रहती है। रिन्यू होने की तारीख से कम से कम 24 घंटे पहले, Google Play → भुगतान और सदस्यताएँ (Payments & subscriptions) में कभी भी रद्द करें; आपने जिस अवधि का भुगतान किया है, उसके अंत तक प्रीमियम चालू रहेगा। मुफ़्त ट्रायल में, ट्रायल खत्म होने पर आपसे शुल्क लिया जाएगा, जब तक कि आप उससे पहले रद्द न कर दें।',
    banner: 'प्रीमियम लें',
    bannerHint: 'हर दिन बिना गिने AI से पूछें · {{price}} प्रति माह से',
    bannerActive: 'प्रीमियम चालू है',
    askLine_one: 'प्रीमियम · आज {{count}} प्रश्न बाकी',
    askLine_other: 'प्रीमियम · आज {{count}} प्रश्न बाकी',
    askUpsell: 'या प्रीमियम लें और हर दिन पूछें',
    usedToday: 'आपने आज के प्रीमियम प्रश्न इस्तेमाल कर लिए हैं; ये कल फिर मिलेंगे। तब तक निःशुल्क प्रश्न और क्रेडिट इस्तेमाल होंगे।',
  },
};

export default extra;
