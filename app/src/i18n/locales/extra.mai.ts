// AI पर्सोना, PDF रिपोर्ट, स्मरण, गोपनीयता, भुगतान आ आवाजक मैथिली पाठ (mai.ts मे `extra` रूप मे शामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate premium (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी सँ गप करू',
    intro: 'हमर AI ज्योतिषी आ अंकशास्त्री सभ सँ गपशप करू। प्रत्येक अपन विशेषता बला AI छथि — कोनो असली लोक नहि।',
    perMessage_one: 'प्रत्येक संदेश लेल {{count}} क्रेडिट',
    perMessage_other: 'प्रत्येक संदेश लेल {{count}} क्रेडिट',
    perMinute_one: 'प्रत्येक मिनट लेल {{count}} क्रेडिट',
    perMinute_other: 'प्रत्येक मिनट लेल {{count}} क्रेडिट',
    chat: 'गपशप',
    aiNote: '{{name}} एकटा AI पर्सोना छथि, मनुष्य नहि।',
    noFree: 'पर्सोना लेल क्रेडिट लगैत अछि; निःशुल्क प्रश्न केवल "AI सँ पूछू" लेल अछि।',
    session: {
      title: 'सत्र शुरू करू',
      intro: 'समय पूरा होमय धरि जतेक मोन हो ततेक गप करू।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बाँकी',
      left_other: '{{count}} मिनट बाँकी',
      ended: 'सत्र समाप्त भऽ गेल अछि। आगाँ बढ़बाक लेल नव सत्र शुरू करू।',
      capReached: 'एहि सत्रक संदेश सीमा पूरा भऽ गेल अछि। आगाँ बढ़बाक लेल नव सत्र शुरू करू।',
    },
    notEnough: 'पर्याप्त क्रेडिट नहि अछि।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, योग आ दशाक समय — सभटा चरण-दर-चरण बुझाओल गेल।' },
      anand: { role: 'अंकशास्त्री', text: 'मूलांक, भाग्यांक, नामक अंक, लो शू ग्रिड, शुभ अंक आ रंग।' },
      meera: { role: 'प्रेम आ विवाह', text: 'अहाँक कुंडली द्वारा संबंध, विवाह आ परिवार — स्नेह आ चिंताक संग।' },
      shastri: { role: 'पारंपरिक पंडित', text: 'पंचांग, मुहूर्त (शुभ समय), पाबनि-तिहार आ सरल पारंपरिक उपाय।' },
      tara: { role: 'करियर आ पढ़ाइ', text: 'ज्योतिष आ अंक द्वारा काज, पढ़ाइ आ जीवनक दिशा।' },
    },
  },
  report: {
    download: 'PDF रिपोर्ट डाउनलोड करू',
    preparing: 'PDF तैयार भऽ रहल अछि…',
    failed: 'PDF नहि बनि सकल। कृपया फेर सँ प्रयास करू।',
    footer: 'Ratna Aura द्वारा {{date}} केँ बनाओल गेल · {{engine}}',
  },
  reminder: {
    title: 'दैनिक स्मरण',
    toggle: 'हमरा राशिफल पढ़बाक याद दियाउ',
    time: 'हर दिन {{time}} बजे',
    earlier: 'पहिने',
    later: 'बाद मे',
    denied: 'Ratna Aura लेल सूचना बंद अछि। अहाँ ओकरा अपन फोनक सेटिंग मे चालू कऽ सकैत छी।',
    notificationTitle: 'आइ अहाँक राशिफल ✨',
    notificationBody: 'देखू जे तारा अहाँक दिन लेल की संकेत दैत अछि।',
    channel: 'दैनिक राशिफल',
    webOnly: 'स्मरण फोनक ऐप मे काज करैत अछि।',
  },
  privacy: {
    aiTitle: 'AI क जवाब',
    ai: 'AI सँ पूछू, AI पर्सोना आ दैनिक राशिफल Anthropic क AI, Claude द्वारा लिखल जाइत अछि। अहाँ केँ जवाब देबाक लेल अहाँक प्रश्न आ चुनल कुंडलीक सारांश Anthropic केँ पठाओल जाइत अछि। एकर उपयोग AI मॉडल केँ प्रशिक्षित करबाक लेल नहि कएल जाइत अछि।',
    fullPolicy: 'पूरा गोपनीयता नीति',
    terms: 'उपयोगक शर्त',
  },
  store: {
    waiting: 'भुगतान भेटि गेल। अहाँक क्रेडिट जोड़ल जा रहल अछि…',
    added: 'अहाँक क्रेडिट जोड़ि देल गेल अछि। धन्यवाद!',
    slow: 'भुगतान भेटि गेल। अहाँक क्रेडिट एक मिनट मे देखाएत — रिफ्रेश करबाक लेल एहि स्क्रीन पर घुरि आउ।',
    cancelled: 'खरीद रद्द भऽ गेल। अहाँ सँ कोनो शुल्क नहि लेल गेल।',
    failed: 'खरीद पूरा नहि भऽ सकल। अहाँ सँ कोनो शुल्क नहि लेल गेल।',
    androidOnly: 'क्रेडिट Android ऐप मे Google Play सँ कीनल जा सकैत अछि।',
  },
  voice: {
    speak: 'जोर सँ पढ़ू',
    stop: 'पढ़ब रोकू',
    mic: 'अपन प्रश्न बाजू',
    listening: 'सुनि रहल अछि… आब बाजू',
    denied: 'कृपया अपन फोनक सेटिंग मे Ratna Aura लेल माइक्रोफोनक अनुमति दिअ।',
    error: 'सुनाइ नहि देलक। कृपया फेर सँ प्रयास करू वा अपन प्रश्न लिखू।',
    conversation: 'आवाज सँ गपशप',
    conversationHint: 'अपन प्रश्न बाजू; जवाब जोर सँ पढ़ि कऽ सुनाओल जाएत।',
  },
  premium: extraEnglish.premium, // TODO: translate
};

export default extra;
