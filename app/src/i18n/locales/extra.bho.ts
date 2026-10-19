// नया स्क्रीन (AI पर्सोना, PDF रिपोर्ट, याद दिलावे वाला, प्राइवेसी, भुगतान, आवाज) के भोजपुरी पाठ (bho.ts में `extra` के रूप में शामिल)।
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate premium (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'ज्योतिषी से बतियाईं',
    intro: 'हमनी के AI ज्योतिषी आ अंक-विद से बातचीत करीं। हर एक आपन खास हुनर वाला AI ह — कवनो असली आदमी ना।',
    perMessage_one: 'हर संदेश पर {{count}} क्रेडिट',
    perMessage_other: 'हर संदेश पर {{count}} क्रेडिट',
    perMinute_one: 'हर मिनट पर {{count}} क्रेडिट',
    perMinute_other: 'हर मिनट पर {{count}} क्रेडिट',
    chat: 'बातचीत',
    aiNote: '{{name}} एगो AI पर्सोना ह, आदमी ना।',
    noFree: 'AI पर्सोना क्रेडिट खरच करेला; मुफ्त सवाल खाली AI से पूछीं खातिर बा।',
    session: {
      title: 'सेशन शुरू करीं',
      intro: 'समय पूरा होखे तक जेतना मन करे बातचीत करीं।',
      option_one: '{{count}} मिनट · {{credits}} क्रेडिट',
      option_other: '{{count}} मिनट · {{credits}} क्रेडिट',
      left_one: '{{count}} मिनट बाकी बा',
      left_other: '{{count}} मिनट बाकी बा',
      ended: 'सेशन खतम हो गइल बा। आगे चले खातिर नया सेशन शुरू करीं।',
      capReached: 'एह सेशन में संदेश के सीमा पूरा हो गइल बा। आगे चले खातिर नया सेशन शुरू करीं।',
    },
    notEnough: 'क्रेडिट पूरा नइखे।',
    about: {
      vidya: { role: 'वैदिक ज्योतिषी', text: 'कुंडली, ग्रह, भाव, योग आ दशा के समय, एक-एक कदम समझा के।' },
      anand: { role: 'अंक-विद', text: 'मूलांक, भाग्यांक, नाम के अंक, लो शू ग्रिड, शुभ अंक आ रंग।' },
      meera: { role: 'प्रेम आ बियाह', text: 'रउरा कुंडली से रिश्ता, बियाह आ परिवार के बात, अपनापन आ फिकिर के साथ।' },
      shastri: { role: 'पारंपरिक पंडित', text: 'पंचांग, मुहूर्त (नीमन समय), तीज-तिहवार आ सीधा-सादा पारंपरिक उपाय।' },
      tara: { role: 'करियर आ पढ़ाई', text: 'ज्योतिष आ अंक से काम, पढ़ाई आ जिनिगी के राह के बारे में।' },
    },
  },
  report: {
    download: 'PDF रिपोर्ट डाउनलोड करीं',
    preparing: 'PDF तइयार हो रहल बा…',
    failed: 'PDF ना बन सकल। कृपा करके फेर से कोशिश करीं।',
    footer: '{{date}} के Ratna Aura से बनल · {{engine}}',
  },
  reminder: {
    title: 'रोज के याद',
    toggle: 'हमके राशिफल पढ़े के याद दिलाईं',
    time: 'रोज {{time}} बजे',
    earlier: 'पहिले',
    later: 'बाद में',
    denied: 'Ratna Aura खातिर नोटिफिकेशन बंद बा। रउरा आपन फोन के सेटिंग में एकरा के चालू कर सकेनी।',
    notificationTitle: 'आज के रउरा राशिफल ✨',
    notificationBody: 'देखीं कि तारा रउरा दिन खातिर का इशारा देत बाड़ें।',
    channel: 'रोज के राशिफल',
    webOnly: 'याद दिलावे वाला फोन के ऐप में काम करेला।',
  },
  privacy: {
    aiTitle: 'AI के जवाब',
    ai: 'AI से पूछीं, AI पर्सोना आ रोज के राशिफल Claude लिखेला, जे Anthropic के एगो AI ह। रउरा के जवाब देवे खातिर रउरा सवाल आ चुनल कुंडली के सारांश Anthropic के भेजल जाला। इनकर इस्तेमाल AI मॉडल के ट्रेनिंग खातिर ना होखे।',
    fullPolicy: 'पूरा प्राइवेसी नीति',
    terms: 'इस्तेमाल के शर्त',
  },
  store: {
    waiting: 'भुगतान मिल गइल। रउरा क्रेडिट जोड़ल जा रहल बा…',
    added: 'रउरा क्रेडिट जुड़ गइल बा। धन्यवाद!',
    slow: 'भुगतान मिल गइल। रउरा क्रेडिट एक मिनट में देखाई — ताजा करे खातिर एही स्क्रीन पर लौट आईं।',
    cancelled: 'खरीद रद्द हो गइल। रउरा से कुछ ना लेवल गइल।',
    failed: 'खरीद पूरा ना हो सकल। रउरा से कुछ ना लेवल गइल।',
    androidOnly: 'क्रेडिट Android ऐप में Google Play से खरीदल जा सकेला।',
  },
  voice: {
    speak: 'जोर से सुनीं',
    stop: 'पढ़ल बंद करीं',
    mic: 'आपन सवाल बोलीं',
    listening: 'सुनत बा… अब बोलीं',
    denied: 'कृपा करके आपन फोन के सेटिंग में Ratna Aura खातिर माइक्रोफोन के अनुमति दीं।',
    error: 'सुनाई ना दिहल। कृपा करके फेर से कोशिश करीं भा आपन सवाल लिख दीं।',
    conversation: 'आवाज में बातचीत',
    conversationHint: 'आपन सवाल बोलीं; जवाब जोर से सुनावल जाई।',
  },
  premium: extraEnglish.premium, // TODO: translate
};

export default extra;
