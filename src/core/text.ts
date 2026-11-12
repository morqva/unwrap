/* Word and emoji counting. Supports any language; stop-words cover EN / RU / UK. */

const STOP = new Set(
  `
the and you that this for are with have not but what was all can just your they his her she him its our out get got
like from about there their them then than will would could should when where which who why how yes yeah yep okay
also too very really been were has had did does doing done one two some any more most much many only own same into
over after before because while here now well even still back come came going gonna want know think see say said
let lol haha hahaha ahah xd omg tho thx thanks pls please sure good great nice cool way thing things time day today
tomorrow yesterday week year people make made take took give gave tell told need look feel right maybe okay www http https com
это как что так все всё вот она они оно мне меня мой моя моё мои тебе тебя твой твоя твоё твои его ему она её ней нам нас наш
вам вас ваш них ним были был была было быть есть нет еще ещё уже тоже также только когда тогда потом где куда там тут здесь
если чтобы чтоб или либо но да ну ага угу ок окей хорошо ладно просто очень может можно нужно надо будет буду будешь будем
кто чем чего чём кого кому себя себе свой своя свои сам сама сами этот эта эти этого этой этих тот той тех том такой такая
такое такие который которая которое которые какой какая какое какие для без под над при про через после перед между из
от до по за на во со об обо же бы ли ни не раз два три день сегодня завтра вчера сейчас всегда никогда очень прям вообще
блин короче типа щас сорян спасибо пожалуйста привет пока давай хочу хочешь знаю знаешь думаю могу можешь сказал говорю
ахах ахаха ахахах хах хаха хахаха хех лол ору
це що як все вже теж також тільки коли тоді потім де куди там тут якщо щоб або але так ну ага ок добре можна треба буде
мені мене тобі тебе його йому вона вони нас вас них був була було бути немає ще який яка яке які для без під над при про
через після перед між від до по за на зі дякую будь ласка привіт бувай
`
    .split(/\s+/)
    .filter(Boolean),
)

const URL_RE = /(https?:\/\/|www\.)\S+/gi
const WORD_RE = /\p{L}[\p{L}\p{M}'’-]*/gu

export function countWords(text: string, into: Map<string, number>): number {
  const cleaned = text.replace(URL_RE, ' ')
  let total = 0
  for (const m of cleaned.matchAll(WORD_RE)) {
    total++
    const w = m[0].toLowerCase().replace(/['’-]+$/, '')
    if (w.length < 3 || STOP.has(w)) continue
    into.set(w, (into.get(w) ?? 0) + 1)
  }
  return total
}

export function countAllWords(text: string): number {
  let n = 0
  for (const _ of text.replace(URL_RE, ' ').matchAll(WORD_RE)) n++
  return n
}

const PICTO = /\p{Extended_Pictographic}/u
const SKIN = /[\u{1F3FB}-\u{1F3FF}]/gu
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null

export function countEmoji(text: string, into: Map<string, number>): void {
  if (!PICTO.test(text)) return
  if (segmenter) {
    for (const { segment } of segmenter.segment(text)) {
      if (PICTO.test(segment)) {
        const e = segment.replace(SKIN, '')
        into.set(e, (into.get(e) ?? 0) + 1)
      }
    }
  } else {
    for (const m of text.matchAll(/\p{Extended_Pictographic}/gu)) into.set(m[0], (into.get(m[0]) ?? 0) + 1)
  }
}

export function topN<K>(map: Map<K, number>, n: number): [K, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}
