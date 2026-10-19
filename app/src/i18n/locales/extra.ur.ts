// نئی اسکرینوں (AI کردار، PDF رپورٹ، یاد دہانی، رازداری، ادائیگی، آواز) کا اردو متن (ur.ts میں `extra` کے طور پر شامل)۔
import type extraEn from './extra.en';
import extraEnglish from './extra.en'; // TODO: translate premium (remove this line when done)

type DeepStringRecord<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]> };

const extra: DeepStringRecord<typeof extraEn> = {
  personas: {
    title: 'نجومی سے بات کریں',
    intro: 'ہمارے AI نجومیوں اور ماہرینِ اعداد سے گفتگو کریں۔ ہر ایک اپنی خاص مہارت والا AI ہے — کوئی حقیقی انسان نہیں۔',
    perMessage_one: 'فی پیغام {{count}} کریڈٹ',
    perMessage_other: 'فی پیغام {{count}} کریڈٹ',
    perMinute_one: 'فی منٹ {{count}} کریڈٹ',
    perMinute_other: 'فی منٹ {{count}} کریڈٹ',
    chat: 'گفتگو',
    aiNote: '{{name}} ایک AI کردار ہے، انسان نہیں۔',
    noFree: 'AI کردار کریڈٹ استعمال کرتے ہیں؛ مفت سوال صرف AI سے پوچھیں کے لیے ہیں۔',
    session: {
      title: 'سیشن شروع کریں',
      intro: 'وقت ختم ہونے تک جتنی چاہیں گفتگو کریں۔',
      option_one: '{{count}} منٹ · {{credits}} کریڈٹ',
      option_other: '{{count}} منٹ · {{credits}} کریڈٹ',
      left_one: '{{count}} منٹ باقی ہے',
      left_other: '{{count}} منٹ باقی ہیں',
      ended: 'سیشن ختم ہو گیا ہے۔ جاری رکھنے کے لیے نیا سیشن شروع کریں۔',
      capReached: 'اس سیشن میں پیغامات کی حد پوری ہو گئی ہے۔ جاری رکھنے کے لیے نیا سیشن شروع کریں۔',
    },
    notEnough: 'کریڈٹ کافی نہیں ہیں۔',
    about: {
      vidya: { role: 'ویدک نجومی', text: 'کنڈلی، سیارے، بھاو، یوگ اور دشا کا وقت، قدم بہ قدم سمجھایا گیا۔' },
      anand: { role: 'ماہرِ اعداد', text: 'مول انک، بھاگیانک، نام کے اعداد، لو شو گرڈ، خوش قسمت اعداد اور رنگ۔' },
      meera: { role: 'محبت اور شادی', text: 'آپ کی کنڈلی کے ذریعے رشتے، شادی اور خاندان، اپنائیت اور فکر کے ساتھ۔' },
      shastri: { role: 'روایتی پنڈت', text: 'پنچانگ، مہورت (اچھے اوقات)، تہوار اور سادہ روایتی تدابیر۔' },
      tara: { role: 'کیریئر اور تعلیم', text: 'نجوم اور اعداد کے ذریعے کام، تعلیم اور زندگی کی سمت۔' },
    },
  },
  report: {
    download: 'PDF رپورٹ ڈاؤن لوڈ کریں',
    preparing: 'PDF تیار ہو رہی ہے…',
    failed: 'PDF نہیں بن سکی۔ براہِ کرم دوبارہ کوشش کریں۔',
    footer: '{{date}} کو Ratna Aura کے ساتھ تیار کردہ · {{engine}}',
  },
  reminder: {
    title: 'روزانہ یاد دہانی',
    toggle: 'مجھے راشی پھل پڑھنے کی یاد دلائیں',
    time: 'ہر روز {{time}} بجے',
    earlier: 'پہلے',
    later: 'بعد میں',
    denied: 'Ratna Aura کے لیے نوٹیفیکیشن بند ہیں۔ آپ انہیں اپنے فون کی سیٹنگز میں اجازت دے سکتے ہیں۔',
    notificationTitle: 'آج کا آپ کا راشی پھل ✨',
    notificationBody: 'دیکھیں کہ ستارے آپ کے دن کے لیے کیا اشارہ دیتے ہیں۔',
    channel: 'روزانہ راشی پھل',
    webOnly: 'یاد دہانیاں فون ایپ میں کام کرتی ہیں۔',
  },
  privacy: {
    aiTitle: 'AI کے جوابات',
    ai: 'AI سے پوچھیں، AI کردار اور روزانہ راشی پھل Claude لکھتا ہے، جو Anthropic کا ایک AI ہے۔ آپ کو جواب دینے کے لیے آپ کا سوال اور منتخب کنڈلی کا خلاصہ Anthropic کو بھیجا جاتا ہے۔ انہیں AI ماڈلز کی تربیت کے لیے استعمال نہیں کیا جاتا۔',
    fullPolicy: 'رازداری کی مکمل پالیسی',
    terms: 'استعمال کی شرائط',
  },
  store: {
    waiting: 'ادائیگی موصول ہو گئی۔ آپ کے کریڈٹ شامل کیے جا رہے ہیں…',
    added: 'آپ کے کریڈٹ شامل کر دیے گئے ہیں۔ شکریہ!',
    slow: 'ادائیگی موصول ہو گئی۔ آپ کے کریڈٹ ایک منٹ میں نظر آ جائیں گے — تازہ کرنے کے لیے اس اسکرین پر واپس آئیں۔',
    cancelled: 'خریداری منسوخ ہو گئی۔ آپ سے کچھ نہیں لیا گیا۔',
    failed: 'خریداری مکمل نہیں ہو سکی۔ آپ سے کچھ نہیں لیا گیا۔',
    androidOnly: 'کریڈٹ Android ایپ میں Google Play سے خریدے جا سکتے ہیں۔',
  },
  voice: {
    speak: 'بلند آواز میں سنیں',
    stop: 'پڑھنا روکیں',
    mic: 'اپنا سوال بولیں',
    listening: 'سن رہا ہے… اب بولیں',
    denied: 'براہِ کرم اپنے فون کی سیٹنگز میں Ratna Aura کے لیے مائیکروفون کی اجازت دیں۔',
    error: 'سنائی نہیں دیا۔ براہِ کرم دوبارہ کوشش کریں یا اپنا سوال لکھ دیں۔',
    conversation: 'صوتی گفتگو',
    conversationHint: 'اپنا سوال بولیں؛ جواب بلند آواز میں سنایا جائے گا۔',
  },
  premium: extraEnglish.premium, // TODO: translate
};

export default extra;
