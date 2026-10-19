// नूंवी स्क्रीनां रो राजस्थानी पाठ: AI पर्सोना, PDF रिपोर्ट, याद दिरावण, निजता, भुगतान, आवाज (raj.ts में `extra` रै रूप में सामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी सूं बात करो',
    intro: 'म्हारै AI ज्योतिषियां अर अंकसास्त्रियां सूं बातचीत करो। हर कोई एक AI है, जिको आपरी खासियत राखै — कोई असली मिनख कोनी।',
    perMessage_one: 'हर संदेसै रा {{count}} क्रेडिट',
    perMessage_other: 'हर संदेसै रा {{count}} क्रेडिट',
    perMinute_one: 'हर मिनट रो {{count}} क्रेडिट',
    perMinute_other: 'हर मिनट रा {{count}} क्रेडिट',
    chat: 'बातचीत',
    aiNote: '{{name}} एक AI पर्सोना है, मिनख कोनी।',
    noFree: 'पर्सोना सारू क्रेडिट लागै; मुफत सवाल फगत AI सूं पूछो सारू है।',
    session: {
      title: 'सेसन सरू करो',
      intro: 'टैम पूरो होवण तांई जित्ती मरजी बातचीत करो।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बाकी',
      left_other: '{{count}} मिनट बाकी',
      ended: 'सेसन पूरो होयग्यो। आगै चालू राखण सारू नूंवो सेसन सरू करो।',
      capReached: 'इण सेसन री संदेसां री सीमा पूरी होयगी। आगै चालू राखण सारू नूंवो सेसन सरू करो।',
    },
    notEnough: 'क्रेडिट पूरा कोनी।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, जोग अर दसा रो टैम, पगोथियै-पगोथियै समझायोड़ो।' },
      anand: { role: 'अंकसास्त्री', text: 'मूलांक, भाग्यांक, नांव अंक, लो शु ग्रिड, सुभ अंक अर रंग।' },
      meera: { role: 'प्रेम अर ब्याव', text: 'आपरी कुंडली सूं रिस्ता, ब्याव अर परिवार रै बारै में, हेत अर संभाळ साथै।' },
      shastri: { role: 'परंपरागत पंडित', text: 'पंचांग, मुहूरत (सुभ टैम), तिंवार अर सरल परंपरागत उपाय।' },
      tara: { role: 'कैरियर अर पढ़ाई', text: 'ज्योतिष अर अंकां सूं काम, पढ़ाई अर जीवण री दिसा।' },
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
    download: 'PDF रिपोर्ट डाउनलोड करो',
    preparing: 'PDF त्यार होय रैयी है…',
    failed: 'PDF कोनी बण सकी। कृपा करर फेर कोसीस करो।',
    footer: 'Ratna Aura सूं {{date}} नै बणायोड़ी · {{engine}}',
  },
  reminder: {
    title: 'रोजीना याद दिरावण',
    toggle: 'म्हनै म्हारो राशिफळ बांचण री याद दिरावो',
    time: 'हर दिन {{time}} बजे',
    earlier: 'पैली',
    later: 'पछै',
    denied: 'Ratna Aura सारू नोटिफिकेसन बंद है। आप आपरै फोन री सेटिंग्स में इणां नै इजाजत दे सको।',
    notificationTitle: 'आज रो आपरो राशिफळ ✨',
    notificationBody: 'देखो, तारा आपरै दिन सारू कांई सुझावै।',
    channel: 'रोजीना राशिफळ',
    webOnly: 'याद दिरावण फोन री ऐप में चालै।',
  },
  privacy: {
    aiTitle: 'AI रा जवाब',
    ai: 'AI सूं पूछो, AI पर्सोना अर रोजीना राशिफळ Claude लिखै, जिको Anthropic रो एक AI है। आपनै जवाब देवण सारू आपरो सवाल अर चुणी होयोड़ी कुंडली रो सार Anthropic नै भेज्यो जावै। इणां नै AI मॉडल सिखावण सारू काम में कोनी लियो जावै।',
    fullPolicy: 'पूरी निजता नीति',
    terms: 'काम में लेवण री सर्तां',
  },
  store: {
    waiting: 'भुगतान मिलग्यो। आपरा क्रेडिट जोड़्या जा रैया है…',
    added: 'आपरा क्रेडिट जुड़ग्या है। धन्यवाद!',
    slow: 'भुगतान मिलग्यो। आपरा क्रेडिट एक मिनट में दीखैला — ताजा करण सारू इण स्क्रीन माथै पाछा आओ।',
    cancelled: 'खरीद रद्द होयगी। आपसूं कीं कोनी लियो गयो।',
    failed: 'खरीद पूरी कोनी होय सकी। आपसूं कीं कोनी लियो गयो।',
    androidOnly: 'क्रेडिट Android ऐप में Google Play सूं खरीदीज सकै।',
  },
  voice: {
    speak: 'ऊंचै सुर में बांचो',
    stop: 'बांचणो बंद करो',
    mic: 'आपरो सवाल बोलो',
    listening: 'सुण रैयो है… इब बोलो',
    denied: 'कृपा करर आपरै फोन री सेटिंग्स में Ratna Aura सारू माइक्रोफोन री इजाजत देवो।',
    error: 'सुणीज कोनी सक्यो। कृपा करर फेर कोसीस करो या आपरो सवाल लिखो।',
    conversation: 'आवाज सूं बातचीत',
    conversationHint: 'आपरो सवाल बोलो; जवाब ऊंचै सुर में बांच्यो जावैलो।',
  },
  premium: {
    title: 'Ratna Aura प्रीमियम',
    tagline: 'रोजीना तारां सूं पूछो, बिना गिणती रै।',
    benefits: {
      ask_one: 'बिना सवाल गिण्यां AI सूं पूछो (उचित उपयोग: रोजीना {{count}} तांई)',
      ask_other: 'बिना सवाल गिण्यां AI सूं पूछो (उचित उपयोग: रोजीना {{count}} तांई)',
      bonus: 'हर बिलिंग अवधि में AI ज्योतिषियां सारू बोनस क्रेडिट',
      keep: 'बोनस क्रेडिट आपरै वॉलेट में रैवै, प्रीमियम खतम होयां पछै भी',
      cancel: 'Google Play में कदैई भी रद्द करो',
    },
    plans: {
      monthly: 'मासिक',
      quarterly: '3 महीना',
      yearly: 'सालाना',
    },
    billed: {
      monthly: 'हर महीनै {{price}} रो भुगतान',
      quarterly: 'हर 3 महीनां में {{price}} रो भुगतान',
      yearly: 'हर बरस {{price}} रो भुगतान',
    },
    perMonth: '{{price}} / महीनो',
    save: '{{percent}}% बचत',
    bestValue: 'सबसूं फायदै रो',
    bonus_one: 'हर अवधि में +{{count}} बोनस क्रेडिट',
    bonus_other: 'हर अवधि में +{{count}} बोनस क्रेडिट',
    trial_one: '{{count}} दिन मुफत',
    trial_other: '{{count}} दिन मुफत',
    startTrial: 'मुफत ट्रायल सरू करो',
    subscribe: 'आगै बधो',
    trialNote_one: '{{count}} दिन मुफत, पछै {{price}}। ट्रायल खतम होवण सूं पैली रद्द कर दो, तो आपनै कीं कोनी देवणो पड़ैला।',
    trialNote_other: '{{count}} दिन मुफत, पछै {{price}}। ट्रायल खतम होवण सूं पैली रद्द कर दो, तो आपनै कीं कोनी देवणो पड़ैला।',
    status: {
      title: 'आप प्रीमियम सदस्य हो',
      plan: 'प्लान: {{plan}}',
      renews: '{{date}} नै रिन्यू होवैला',
      ends: '{{date}} नै खतम होवैला। आगै रिन्यू कोनी होवैला।',
      trialEnds: '{{date}} तांई मुफत ट्रायल',
      grace: 'आपरो पाछलो भुगतान कोनी होयो। Google Play पाछो कोसीस कर रैयो है — प्रीमियम चालू राखण सारू आपरो भुगतान रो तरीको अपडेट करो।',
      leftToday_one: 'आज {{count}} प्रीमियम सवाल बाकी',
      leftToday_other: 'आज {{count}} प्रीमियम सवाल बाकी',
    },
    manage: 'सब्सक्रिप्शन संभाळो',
    updatePayment: 'भुगतान रो तरीको अपडेट करो',
    cancelTest: 'टेस्ट सब्सक्रिप्शन रद्द करो',
    cancelledTest: 'टेस्ट सब्सक्रिप्शन रद्द होयग्यो। प्रीमियम अवधि रै आखिर तांई चालू रैवैला।',
    restore: 'खरीद पाछी लावो',
    restored: 'खरीद पाछी आयगी।',
    nothingToRestore: 'इण Google खातै सारू कोई चालू सब्सक्रिप्शन कोनी मिल्यो।',
    welcome: 'प्रीमियम में आपरो स्वागत है! आपरा बोनस क्रेडिट जुड़ग्या है।',
    welcomeTrial: 'आपरो मुफत ट्रायल सरू होयग्यो। प्रीमियम रो आणंद लो! बोनस क्रेडिट पैली भुगतान वाळी अवधि रै साथै मिलैला।',
    waiting: 'भुगतान मिलग्यो। प्रीमियम चालू होय रैयो है…',
    slow: 'भुगतान मिलग्यो। प्रीमियम एक मिनट में सरू होवैला — ताजा करण सारू इण स्क्रीन माथै पाछा आओ।',
    cancelled: 'रद्द होयग्यो। आपसूं कीं कोनी लियो गयो।',
    failed: 'सब्सक्रिप्शन सरू कोनी होय सक्यो। आपसूं कीं कोनी लियो गयो।',
    testMode: 'टेस्ट मोड: कोई भुगतान कोनी लियो जावैला अर प्रीमियम तुरत सरू होय जावैला।',
    off: 'प्रीमियम हाल उपलब्ध कोनी।',
    androidOnly: 'प्रीमियम Android ऐप में Google Play सूं खरीदीज सकै।',
    fine: 'दाम में GST सामिल है। सब्सक्रिप्शन उणी दाम माथै आपो-आप रिन्यू होवतो रैवैला, जद तांई आप इणनै रद्द कोनी करो। Google Play → Payments & subscriptions में कदैई भी रद्द करो, रिन्यू री तारीख सूं कम सूं कम 24 घंटा पैली, अर प्रीमियम उण अवधि रै आखिर तांई चालू रैवैला जिणरो भुगतान आप कर्यो है। मुफत ट्रायल में, ट्रायल खतम होवतां ई पइसा लिया जावैला, जद तांई आप उणसूं पैली रद्द कोनी कर दो।',
    banner: 'प्रीमियम लो',
    bannerHint: 'रोजीना बिना गिणती AI सूं पूछो · {{price}} महीनै सूं सरू',
    bannerActive: 'प्रीमियम चालू है',
    askLine_one: 'प्रीमियम · आज {{count}} सवाल बाकी',
    askLine_other: 'प्रीमियम · आज {{count}} सवाल बाकी',
    askUpsell: 'या प्रीमियम लेय नै रोजीना पूछो',
    usedToday: 'आप आज रा प्रीमियम सवाल पूरा कर लिया है; ऐ काल पाछा मिलैला। तद तांई मुफत सवाल अर क्रेडिट काम में लिया जावैला।',
  },
};

export default extra;
