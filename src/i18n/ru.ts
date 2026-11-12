import type { Dict } from '.'

const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n)

/** plural(5, ['раз', 'раза', 'раз']) */
const plural = (n: number, [one, few, many]: [string, string, string]) => {
  const m10 = Math.floor(n) % 10
  const m100 = Math.floor(n) % 100
  if (!Number.isInteger(n)) return few
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

const HOURS: [number, string, string][] = [
  [4, 'Ночной философ', 'Все спят. А ты печатаешь.'],
  [8, 'Ранняя пташка', 'Встаёшь раньше будильника и сразу в чаты.'],
  [12, 'Утренний человек', 'В одной руке кофе, в другой телефон.'],
  [17, 'Рабочее время', 'Вообще-то это рабочие часы. Мы никому не скажем.'],
  [21, 'Вечерний болтун', 'Самые душевные разговоры начинаются после работы.'],
  [24, 'Ночная сова', 'Лучшие мысли приходят прямо перед сном.'],
]

const times = (n: number) => plural(n, ['раз', 'раза', 'раз'])

export const ru: Dict = {
  locale: 'ru-RU',
  weekdays: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'],
  sources: { telegram: 'Telegram', instagram: 'Instagram', tiktok: 'TikTok' },

  landing: {
    badge: '100% приватно · открытый код',
    title1: 'Твой год,',
    title2: 'распакован.',
    subtitle: 'Итоги года по Telegram, Instagram и TikTok в виде сторис, которыми не стыдно поделиться. Всё считается прямо в браузере.',
    drop: 'Перетащи выгрузку сюда',
    dropHint: 'JSON или ZIP из Telegram, Instagram или TikTok. Можно несколько сразу.',
    choose: 'Выбрать файлы',
    demo: 'Посмотреть на фейковых данных',
    dropping: 'Отпускай!',
    privacyTitle: 'Твои данные не покидают эту вкладку',
    privacy: [
      ['Нет сервера', 'Сайт — это просто статические файлы. Загружать данные физически некуда.'],
      ['Нет слежки', 'Никакой аналитики, cookies, сторонних скриптов и шрифтов.'],
      ['Под замком', 'Content-Security-Policy запрещает странице делать вообще любые сетевые запросы.'],
      ['Проверь сам', 'Открой страницу, включи режим полёта, перетащи файл. Всё работает.'],
    ],
    readCode: 'Код на GitHub',
    howTitle: 'Как скачать свои данные',
    howNote: 'Выгрузка готовится от пары минут (Telegram) до пары дней (Instagram, TikTok). Запроси сегодня.',
    how: {
      telegram: [
        'Поставь Telegram Desktop (с телефона выгрузка недоступна).',
        'Настройки → Продвинутые настройки → Экспорт данных из Telegram.',
        'Отметь «Личные чаты» и «Частные группы»; фото и видео сними, чтобы файл был меньше.',
        'Формат: «Машиночитаемый JSON». Экспортировать.',
        'Перетащи сюда файл result.json.',
      ],
      instagram: [
        'Instagram → Настройки → Центр аккаунтов → Ваша информация и разрешения.',
        'Скачать информацию → Скачать или перенести информацию → Часть информации.',
        'Выбери: Сообщения, Отметки «Нравится», Комментарии, Подписчики и подписки, Недавние поиски.',
        'Скачать на устройство, период «За всё время», формат JSON (важно!).',
        'Когда придёт письмо от Meta, скачай ZIP и перетащи сюда как есть.',
      ],
      tiktok: [
        'TikTok → Профиль → ☰ → Настройки и конфиденциальность → Аккаунт.',
        'Скачать свои данные → «Все данные», формат JSON.',
        'Запросить данные. Подготовка занимает день-два.',
        'Скачай ZIP на вкладке «Скачать данные» и перетащи сюда.',
      ],
    },
    footer: 'Сделано ради фана. Не связано с Telegram, Meta или TikTok.',
  },

  loading: {
    reading: 'Распаковываю файлы…',
    source: (s: string) => `Читаю ${s}…`,
    note: 'Всё на твоём устройстве. Большой экспорт Telegram может занять минуту.',
  },

  errors: {
    nothing: 'Не нашли в этих файлах данных Telegram, Instagram или TikTok. Проверь, что выгрузка в формате JSON, а не HTML.',
    failed: (m: string) => `Что-то пошло не так при чтении файлов: ${m}`,
    back: 'Назад',
  },

  ui: {
    share: 'Поделиться',
    saving: 'Сохраняю…',
    close: 'Закрыть',
    again: 'Ещё раз',
    own: 'Попробовать со своими данными',
    pickYear: 'Год',
    demoBadge: 'ДЕМО · фейк',
    onDevice: '🔒 посчитано локально',
    tapHint: 'Тапни, чтобы продолжить',
  },

  cards: {
    introKicker: (y: number) => `Итоги ${y}`,
    introTitle: (name?: string) => (name ? `Привет, ${name.split(' ')[0]}` : 'Привет'),
    introCaption: (y: number) => `Давай посмотрим, чем ты жил(а) в ${y}. Готов(а)?`,
    introSources: 'Собрано из',

    sentKicker: 'Сообщений отправлено',
    sentCaption: (words: number) => {
      if (words >= 450_000) return `Это ${fmt(words / 450_000)} × «Война и мир». Толстой нервно курит.`
      if (words >= 77_000) return `${fmt(words)} слов — это ${fmt(words / 77_000)} книг про Гарри Поттера.`
      if (words >= 15_000) return `${fmt(words)} слов, или ${fmt(words / 15_000)} «Маленьких принцев».`
      return `${fmt(words)} слов. Кратко и по делу.`
    },

    closestKicker: 'Твой человек',
    closestCaption: (n: number) => `${fmt(n)} сообщений на двоих. Это уже почти отношения.`,

    chatsKicker: 'Самые активные чаты',
    chatsValue: (n: number) => n,
    chatsCaption: (n: number) => `Ты писал(а) в ${fmt(n)} чатах. Вот самые громкие.`,

    wordKicker: 'Слово года',
    wordCaption: (n: number) => `Ты написал(а) его ${fmt(n)} ${times(n)}. Мы поняли.`,

    emojiKicker: 'Эмодзи года',
    emojiCaption: (n: number) => `${fmt(n)} ${times(n)}. Он уже говорит за тебя.`,

    hourKicker: 'Твой прайм-тайм',
    hourTitle: (h: number) => HOURS.find(([max]) => h < max)![1],
    hourCaption: (h: number, day: string) => `${HOURS.find(([max]) => h < max)![2]} Самый активный день: ${day}.`,

    busyDayKicker: 'Самый болтливый день',
    busyDayCaption: (date: string) => `${date}. Что тогда случилось? У нас вопросы.`,

    fastKicker: 'Быстрее всех отвечает',
    fastCaption: (name: string, t: string) => `${name} отвечает тебе в среднем за ${t}. Береги этого человека.`,
    fastMine: (t: string) => `А ты отвечаешь за ${t}.`,

    videosKicker: 'Видео в TikTok',
    videosCaption: (days: string) => `Подряд это ${days} без перерыва. Большому пальцу нужен отпуск.`,
    videosNote: 'Если в среднем ~25 секунд на видео',

    bingeKicker: 'Главный запой',
    bingeCaption: (date: string) => `видео за ${date}. Ты в порядке?`,

    scrollKicker: 'Час залипания',
    scrollCaption: (day: string) => `Именно в это время лента тебя засасывает. Особенно в ${day === 'среда' ? 'среду' : day === 'пятница' ? 'пятницу' : day === 'суббота' ? 'субботу' : day}.`,

    likesKicker: 'Лайков раздано',
    likesCaption: 'Щедро. Кто-то там почувствовал себя очень ценным.',
    likesTop: (name: string, n: number) => `Больше всех: ${name} (${fmt(n)})`,

    followsKicker: 'Подписался и отписался',
    followsCaption: (followed: number) => `За год ты подписался(лась) на ${fmt(followed)} аккаунтов. Не все дожили до конца.`,
    followsNames: 'Ушли, но не забыты',

    searchKicker: 'Чаще всего искал(а)',
    searchCaption: (n: number) => `Ты искал(а) это ${fmt(n)} ${times(n)}. Нашёл(ла)?`,

    commentsKicker: 'Комментариев оставлено',
    commentsCaption: 'Мнение высказано.',

    outroKicker: (y: number) => `Таким был твой ${y}`,
    outroTitle: 'Увидимся в следующем году',
    outroCaption: 'Посчитано на твоём устройстве. Ничего никуда не загружалось.',
  },

  duration: (s: number) => {
    if (s < 60) return `${Math.round(s)} сек`
    if (s < 3600) return `${Math.round(s / 60)} мин`
    if (s < 86400 * 2) {
      const h = s / 3600
      return `${fmt(h)} ${plural(h, ['час', 'часа', 'часов'])}`
    }
    const d = s / 86400
    return `${fmt(d)} ${plural(d, ['день', 'дня', 'дней'])}`
  },
  date: (ms: number) => new Date(ms).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' }),
}
