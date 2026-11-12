const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n)

const HOURS: [number, string, string][] = [
  [4, 'Night philosopher', "Most people are asleep. You're typing."],
  [8, 'Early bird', 'Up before the alarm and already in the chats.'],
  [12, 'Morning person', 'Coffee in one hand, phone in the other.'],
  [17, 'Office hours', "Pretty sure that's work time. We won't tell."],
  [21, 'Evening talker', 'After work is when the real conversations start.'],
  [24, 'Night owl', 'Your best thoughts arrive right before bed.'],
]

export const en = {
  locale: 'en-US',
  weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  sources: { telegram: 'Telegram', instagram: 'Instagram', tiktok: 'TikTok' },

  landing: {
    badge: '100% private · open source',
    title1: 'Your year,',
    title2: 'unwrapped.',
    subtitle: 'Telegram, Instagram and TikTok stats as stories you can share. Everything happens in your browser.',
    drop: 'Drop your export here',
    dropHint: 'JSON or ZIP from Telegram, Instagram or TikTok. Several at once is fine.',
    choose: 'Choose files',
    demo: 'Try it with fake data',
    dropping: 'Drop it!',
    privacyTitle: 'Your data never leaves this tab',
    privacy: [
      ['No server', 'The site is static files. There is nowhere to upload to.'],
      ['No tracking', 'No analytics, no cookies, no third-party scripts or fonts.'],
      ['Locked down', 'A Content-Security-Policy forbids the page from making any network request at all.'],
      ['Check it yourself', 'Load the page, switch on airplane mode, drop your file. It still works.'],
    ] as [string, string][],
    readCode: 'Read the code on GitHub',
    howTitle: 'How to download your data',
    howNote: 'Exports take from a few minutes (Telegram) to a couple of days (Instagram, TikTok). Request them today.',
    how: {
      telegram: [
        'Install Telegram Desktop (the export is not available on mobile).',
        'Settings → Advanced → Export Telegram data.',
        'Tick "Personal chats" and "Private groups"; untick photos and videos to keep it small.',
        'Format: "Machine-readable JSON". Export.',
        'Drop the result.json file here.',
      ],
      instagram: [
        'Open Instagram → Settings → Accounts Center → Your information and permissions.',
        'Download your information → Download or transfer information → Some of your information.',
        'Pick Messages, Likes, Comments, Followers and following, Recent searches.',
        'Download to device, Date range "All time", Format JSON (important!).',
        "When Meta emails you, download the ZIP and drop it here as is.",
      ],
      tiktok: [
        'Open TikTok → Profile → ☰ → Settings and privacy → Account.',
        'Download your data → choose "All data" and format JSON.',
        'Request data. It can take a day or two.',
        'Download the ZIP from the "Download data" tab and drop it here.',
      ],
    },
    footer: 'Made for fun. Not affiliated with Telegram, Meta or TikTok.',
  },

  loading: {
    reading: 'Unpacking your files…',
    source: (s: string) => `Reading ${s}…`,
    note: 'All on your device. Big Telegram exports can take a minute.',
  },

  errors: {
    nothing: "We couldn't find Telegram, Instagram or TikTok data in these files. Make sure you exported in JSON format, not HTML.",
    failed: (m: string) => `Something went wrong while reading the files: ${m}`,
    back: 'Back',
  },

  ui: {
    share: 'Share',
    saving: 'Saving…',
    close: 'Close',
    again: 'Watch again',
    own: 'Try with my data',
    pickYear: 'Year',
    demoBadge: 'DEMO · fake data',
    onDevice: '🔒 made on-device',
    tapHint: 'Tap to continue',
  },

  cards: {
    introKicker: (y: number) => `${y} unwrapped`,
    introTitle: (name?: string) => (name ? `Hey, ${name.split(' ')[0]}` : 'Hey, you'),
    introCaption: (y: number) => `Let's look at what you were up to in ${y}. Ready?`,
    introSources: 'Built from',

    sentKicker: 'Messages you sent',
    sentCaption: (words: number) => {
      if (words >= 587_000) return `That's ${fmt(words / 587_000)}× "War and Peace". Tolstoy is nervous.`
      if (words >= 77_000) return `${fmt(words)} words. That's ${fmt(words / 77_000)} Harry Potter books.`
      if (words >= 17_000) return `${fmt(words)} words, or ${fmt(words / 17_000)} copies of "The Little Prince".`
      return `${fmt(words)} words. Short and sweet.`
    },

    closestKicker: 'Your person',
    closestCaption: (n: number) => `${fmt(n)} messages between you. That's basically a relationship.`,

    chatsKicker: 'Most active chats',
    chatsValue: (n: number) => n,
    chatsCaption: (n: number) => `You wrote in ${fmt(n)} different chats. Here are the loudest.`,

    wordKicker: 'Word of the year',
    wordCaption: (n: number) => `You used it ${fmt(n)} times. We get it.`,

    emojiKicker: 'Emoji of the year',
    emojiCaption: (n: number) => `Sent ${fmt(n)} times. It basically speaks for you now.`,

    hourKicker: 'Your prime time',
    hourTitle: (h: number) => HOURS.find(([max]) => h < max)![1],
    hourCaption: (h: number, day: string) => `${HOURS.find(([max]) => h < max)![2]} Busiest day: ${day}.`,

    busyDayKicker: 'Your chattiest day',
    busyDayCaption: (date: string) => `${date}. What happened? We have questions.`,

    fastKicker: 'Fastest replies',
    fastCaption: (name: string, t: string) => `${name} answers you in ${t} on average. Keep them close.`,
    fastMine: (t: string) => `You take ${t} to reply.`,

    videosKicker: 'TikToks watched',
    videosCaption: (days: string) => `Back to back, that's ${days} without a break. Your thumb deserves a vacation.`,
    videosNote: 'Assuming ~25 seconds per video',

    bingeKicker: 'Biggest binge',
    bingeCaption: (date: string) => `videos on ${date}. Are you okay?`,

    scrollKicker: 'Scroll o’clock',
    scrollCaption: (day: string) => `This is when the feed gets you. Especially on ${day}.`,

    likesKicker: 'Likes given',
    likesCaption: 'Generous. Someone out there felt very appreciated.',
    likesTop: (name: string, n: number) => `Most liked: ${name} (${fmt(n)})`,

    followsKicker: 'Follow, then unfollow',
    followsCaption: (followed: number) => `You followed ${fmt(followed)} accounts this year. Some didn't make it.`,
    followsNames: 'Gone but not forgotten',

    searchKicker: 'Most searched',
    searchCaption: (n: number) => `You looked it up ${fmt(n)} times. Did you find it?`,

    commentsKicker: 'Comments left',
    commentsCaption: 'Opinions: shared.',

    outroKicker: (y: number) => `That was your ${y}`,
    outroTitle: 'See you next year',
    outroCaption: 'Made on your device. Nothing was uploaded.',
  },

  duration: (s: number) => {
    if (s < 60) return `${Math.round(s)} sec`
    if (s < 3600) return `${Math.round(s / 60)} min`
    if (s < 86400 * 2) return `${fmt(s / 3600)} hours`
    return `${fmt(s / 86400)} days`
  },
  date: (ms: number) => new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
}
