// AI पर्सोना, PDF रिपोर्ट, रिमाइन्डर, गोपनीयता, भुक्तानी र आवाजको नेपाली पाठ (ne.ts मा `extra` को रूपमा समावेश)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate new personas (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषीसँग कुरा गर्नुहोस्',
    intro: 'हाम्रा AI ज्योतिषी र अङ्कशास्त्रीहरूसँग कुराकानी गर्नुहोस्। हरेक जना आ-आफ्नै विशेषता भएका AI हुन् — वास्तविक मान्छे होइनन्।',
    perMessage_one: 'प्रत्येक सन्देशको {{count}} क्रेडिट',
    perMessage_other: 'प्रत्येक सन्देशको {{count}} क्रेडिट',
    perMinute_one: 'प्रति मिनेट {{count}} क्रेडिट',
    perMinute_other: 'प्रति मिनेट {{count}} क्रेडिट',
    chat: 'कुराकानी',
    aiNote: '{{name}} एक AI पर्सोना हो, मान्छे होइन।',
    noFree: 'पर्सोनाका लागि क्रेडिट लाग्छ; निःशुल्क प्रश्न "AI लाई सोध्नुहोस्" का लागि मात्र हुन्।',
    session: {
      title: 'सत्र सुरु गर्नुहोस्',
      intro: 'समय नसकिँदासम्म जति मन लाग्छ कुराकानी गर्नुहोस्।',
      option_one: '{{count}} मिनेट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनेट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनेट बाँकी',
      left_other: '{{count}} मिनेट बाँकी',
      ended: 'सत्र सकियो। जारी राख्न नयाँ सत्र सुरु गर्नुहोस्।',
      capReached: 'यो सत्रको सन्देश सीमा पुग्यो। जारी राख्न नयाँ सत्र सुरु गर्नुहोस्।',
    },
    notEnough: 'पर्याप्त क्रेडिट छैन।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुण्डली, ग्रह, भाव, योग र दशाको समय — सबै कुरा चरणबद्ध रूपमा बुझाइएको।' },
      anand: { role: 'अङ्कशास्त्री', text: 'मूलांक, भाग्यांक, नामका अङ्क, लो शू ग्रिड, शुभ अङ्क र रङ।' },
      meera: { role: 'प्रेम र विवाह', text: 'तपाईंको कुण्डलीमार्फत सम्बन्ध, विवाह र परिवार — माया र हेरचाहका साथ।' },
      shastri: { role: 'परम्परागत पण्डित', text: 'पात्रो, मुहूर्त (शुभ समय), चाडपर्व र सरल परम्परागत उपाय।' },
      tara: { role: 'करियर र अध्ययन', text: 'ज्योतिष र अङ्कमार्फत काम, अध्ययन र जीवनको दिशा।' },
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
    download: 'PDF रिपोर्ट डाउनलोड गर्नुहोस्',
    preparing: 'PDF तयार हुँदैछ…',
    failed: 'PDF बनाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।',
    footer: 'Ratna Aura द्वारा {{date}} मा बनाइएको · {{engine}}',
  },
  reminder: {
    title: 'दैनिक रिमाइन्डर',
    toggle: 'मलाई राशिफल पढ्न सम्झाउनुहोस्',
    time: 'हरेक दिन {{time}} बजे',
    earlier: 'अगाडि',
    later: 'पछाडि',
    denied: 'Ratna Aura का लागि सूचनाहरू बन्द छन्। तपाईं तिनलाई आफ्नो फोनको सेटिङमा खोल्न सक्नुहुन्छ।',
    notificationTitle: 'आजको तपाईंको राशिफल ✨',
    notificationBody: 'तपाईंको दिनका लागि ताराहरूले के सङ्केत गर्छन्, हेर्नुहोस्।',
    channel: 'दैनिक राशिफल',
    webOnly: 'रिमाइन्डर फोन एपमा मात्र चल्छ।',
  },
  privacy: {
    aiTitle: 'AI का जवाफ',
    ai: 'AI लाई सोध्नुहोस्, AI पर्सोना र दैनिक राशिफल Anthropic को AI, Claude ले लेखेको हो। तपाईंलाई जवाफ दिन तपाईंको प्रश्न र छानिएको कुण्डलीको सारांश Anthropic लाई पठाइन्छ। तिनलाई AI मोडल तालिम दिन प्रयोग गरिँदैन।',
    fullPolicy: 'पूरा गोपनीयता नीति',
    terms: 'प्रयोगका सर्तहरू',
  },
  store: {
    waiting: 'भुक्तानी प्राप्त भयो। तपाईंको क्रेडिट थपिँदैछ…',
    added: 'तपाईंको क्रेडिट थपियो। धन्यवाद!',
    slow: 'भुक्तानी प्राप्त भयो। तपाईंको क्रेडिट एक मिनेटमा देखिनेछ — रिफ्रेस गर्न यही स्क्रिनमा फर्कनुहोस्।',
    cancelled: 'खरिद रद्द भयो। तपाईंबाट कुनै शुल्क लिइएन।',
    failed: 'खरिद पूरा हुन सकेन। तपाईंबाट कुनै शुल्क लिइएन।',
    androidOnly: 'क्रेडिट Android एपमा Google Play बाट किन्न सकिन्छ।',
  },
  voice: {
    speak: 'ठूलो स्वरमा पढ्नुहोस्',
    stop: 'पढ्न रोक्नुहोस्',
    mic: 'आफ्नो प्रश्न बोल्नुहोस्',
    listening: 'सुन्दैछ… अब बोल्नुहोस्',
    denied: 'कृपया आफ्नो फोनको सेटिङमा Ratna Aura का लागि माइक्रोफोनको अनुमति दिनुहोस्।',
    error: 'सुनिएन। कृपया फेरि प्रयास गर्नुहोस् वा आफ्नो प्रश्न लेख्नुहोस्।',
    conversation: 'आवाजमा कुराकानी',
    conversationHint: 'आफ्नो प्रश्न बोल्नुहोस्; जवाफ ठूलो स्वरमा पढेर सुनाइन्छ।',
  },
  premium: {
    title: 'Ratna Aura Premium',
    tagline: 'हरेक दिन ताराहरूलाई सोध्नुहोस्, गन्ती नगरी।',
    benefits: {
      ask_one: 'प्रश्न गन्ती नगरी AI लाई सोध्नुहोस् (उचित प्रयोग: दिनमा {{count}} सम्म)',
      ask_other: 'प्रश्न गन्ती नगरी AI लाई सोध्नुहोस् (उचित प्रयोग: दिनमा {{count}} सम्म)',
      bonus: 'हरेक बिलिङ अवधिमा AI ज्योतिषीहरूका लागि बोनस क्रेडिट',
      keep: 'Premium सकिएपछि पनि बोनस क्रेडिट तपाईंको वालेटमै रहन्छ',
      cancel: 'Google Play मा जुनसुकै बेला रद्द गर्नुहोस्',
    },
    plans: {
      monthly: 'मासिक',
      quarterly: '3 महिना',
      yearly: 'वार्षिक',
    },
    billed: {
      monthly: 'हरेक महिना {{price}} बिल हुन्छ',
      quarterly: 'हरेक 3 महिनामा {{price}} बिल हुन्छ',
      yearly: 'हरेक वर्ष {{price}} बिल हुन्छ',
    },
    perMonth: '{{price}} / महिना',
    save: '{{percent}}% बचत',
    bestValue: 'सबैभन्दा फाइदाजनक',
    bonus_one: 'हरेक अवधिमा +{{count}} बोनस क्रेडिट',
    bonus_other: 'हरेक अवधिमा +{{count}} बोनस क्रेडिट',
    trial_one: '{{count}} दिन निःशुल्क',
    trial_other: '{{count}} दिन निःशुल्क',
    startTrial: 'निःशुल्क परीक्षण सुरु गर्नुहोस्',
    subscribe: 'जारी राख्नुहोस्',
    trialNote_one: '{{count}} दिन निःशुल्क, त्यसपछि {{price}}। परीक्षण सकिनुअघि रद्द गर्नुभयो भने तपाईंले केही तिर्नु पर्दैन।',
    trialNote_other: '{{count}} दिन निःशुल्क, त्यसपछि {{price}}। परीक्षण सकिनुअघि रद्द गर्नुभयो भने तपाईंले केही तिर्नु पर्दैन।',
    status: {
      title: 'तपाईं Premium सदस्य हुनुहुन्छ',
      plan: 'योजना: {{plan}}',
      renews: '{{date}} मा नवीकरण हुन्छ',
      ends: '{{date}} मा सकिन्छ। यो नवीकरण हुने छैन।',
      trialEnds: '{{date}} सम्म निःशुल्क परीक्षण',
      grace: 'तपाईंको पछिल्लो भुक्तानी हुन सकेन। Google Play फेरि प्रयास गर्दैछ — Premium कायम राख्न कृपया आफ्नो भुक्तानी विधि अपडेट गर्नुहोस्।',
      leftToday_one: 'आज {{count}} Premium प्रश्न बाँकी छ',
      leftToday_other: 'आज {{count}} Premium प्रश्न बाँकी छन्',
    },
    manage: 'सदस्यता व्यवस्थापन गर्नुहोस्',
    updatePayment: 'भुक्तानी विधि अपडेट गर्नुहोस्',
    cancelTest: 'टेस्ट सदस्यता रद्द गर्नुहोस्',
    cancelledTest: 'टेस्ट सदस्यता रद्द भयो। अवधिको अन्त्यसम्म Premium जारी रहन्छ।',
    restore: 'खरिदहरू पुनर्स्थापित गर्नुहोस्',
    restored: 'खरिदहरू पुनर्स्थापित भए।',
    nothingToRestore: 'यो Google खाताका लागि कुनै सक्रिय सदस्यता भेटिएन।',
    welcome: 'Premium मा स्वागत छ! तपाईंको बोनस क्रेडिट थपियो।',
    welcomeTrial: 'तपाईंको निःशुल्क परीक्षण सुरु भयो। Premium को आनन्द लिनुहोस्! बोनस क्रेडिट पहिलो भुक्तानी गरिएको अवधिसँगै आउँछ।',
    waiting: 'भुक्तानी प्राप्त भयो। Premium सुरु गरिँदैछ…',
    slow: 'भुक्तानी प्राप्त भयो। Premium एक मिनेटमा सुरु हुनेछ — रिफ्रेस गर्न यही स्क्रिनमा फर्कनुहोस्।',
    cancelled: 'रद्द भयो। तपाईंबाट कुनै शुल्क लिइएन।',
    failed: 'सदस्यता सुरु हुन सकेन। तपाईंबाट कुनै शुल्क लिइएन।',
    testMode: 'टेस्ट मोड: कुनै भुक्तानी लिइँदैन र Premium तुरुन्तै सुरु हुन्छ।',
    off: 'Premium अहिले उपलब्ध छैन।',
    androidOnly: 'Premium Android एपमा Google Play बाट किन्न सकिन्छ।',
    fine: 'मूल्यमा GST समावेश छ। तपाईंले रद्द नगरेसम्म सदस्यता उही मूल्यमा स्वतः नवीकरण भइरहन्छ। नवीकरण मितिभन्दा कम्तीमा 24 घण्टाअघि Google Play → भुक्तानी र सदस्यताहरू मा जुनसुकै बेला रद्द गर्नुहोस्, र तपाईंले भुक्तानी गरेको अवधिको अन्त्यसम्म Premium चालु रहन्छ। निःशुल्क परीक्षणमा, त्यसअघि रद्द नगरेसम्म परीक्षण सकिँदा तपाईंबाट शुल्क लिइन्छ।',
    banner: 'Premium लिनुहोस्',
    bannerHint: 'हरेक दिन गन्ती नगरी AI लाई सोध्नुहोस् · {{price}} प्रति महिनादेखि',
    bannerActive: 'Premium चालु छ',
    askLine_one: 'Premium · आज {{count}} प्रश्न बाँकी छ',
    askLine_other: 'Premium · आज {{count}} प्रश्न बाँकी छन्',
    askUpsell: 'वा Premium लिनुहोस् र हरेक दिन सोध्नुहोस्',
    usedToday: 'तपाईंले आजका Premium प्रश्न प्रयोग गरिसक्नुभयो; ती भोलि फेरि आउँछन्। त्यतिन्जेलसम्म निःशुल्क प्रश्न र क्रेडिट प्रयोग हुन्छन्।',
  },
};

export default extra;
