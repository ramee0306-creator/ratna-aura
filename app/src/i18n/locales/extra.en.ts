// English text added in Milestones 6–10 (personas, reports, reminders, admin, voice), included in en.ts as `extra`.
const extra = {
  personas: {
    title: 'Talk to an Astrologer',
    intro: 'Chat with our AI astrologers and numerologists. Each one is an AI with its own specialty — not a real person.',
    perMessage_one: '{{count}} credit per message',
    perMessage_other: '{{count}} credits per message',
    perMinute_one: '{{count}} credit per minute',
    perMinute_other: '{{count}} credits per minute',
    chat: 'Chat',
    aiNote: '{{name}} is an AI persona, not a human.',
    noFree: 'Personas use credits; the free questions are for Ask AI.',
    session: {
      title: 'Start a session',
      intro: 'Chat as much as you like until the time is up.',
      option_one: '{{count}} minute · {{credits}} credits',
      option_other: '{{count}} minutes · {{credits}} credits',
      left_one: '{{count}} minute left',
      left_other: '{{count}} minutes left',
      ended: 'The session has ended. Start a new one to continue.',
      capReached: 'This session has reached its message limit. Start a new session to continue.',
    },
    notEnough: 'Not enough credits.',
    about: {
      vidya: { role: 'Vedic astrologer', text: 'Kundli, planets, houses, yogas and dasha timing, explained step by step.' },
      anand: { role: 'Numerologist', text: 'Mulank, Bhagyank, name numbers, Lo Shu grid, lucky numbers and colours.' },
      meera: { role: 'Love & marriage', text: 'Relationships, marriage and family through your chart, with warmth and care.' },
      shastri: { role: 'Traditional pandit', text: 'Panchang, muhurta (good timings), festivals and simple traditional remedies.' },
      tara: { role: 'Career & studies', text: 'Work, studies and life direction through astrology and numbers.' },
    },
  },
};

export default extra;
