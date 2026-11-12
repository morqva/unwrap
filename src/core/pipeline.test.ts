import { describe, expect, it } from 'vitest'
import { generateDemo } from '../demo/generate'
import { parseAll } from '../parsers'
import { availableYears, computeStats, defaultYear } from './stats'
import { emptyData } from './types'
import { vfsFromText } from './vfs'
import { fixMojibake } from './util'

describe('source detection', () => {
  it('detects all three sources in the demo export', async () => {
    const data = await parseAll(generateDemo('en'))
    expect(data.map((d) => d.source).sort()).toEqual(['instagram', 'telegram', 'tiktok'])
  })

  it('detects a single-chat Telegram export without result.json name', async () => {
    const fs = vfsFromText({
      'chat.json': JSON.stringify({
        name: 'Bob',
        type: 'personal_chat',
        messages: [
          { id: 1, type: 'message', date_unixtime: '1767261600', from: 'Bob', from_id: 'user2', text: 'hi' },
          { id: 2, type: 'message', date_unixtime: '1767261660', from: 'Me', from_id: 'user1', text: ['hey ', { type: 'bold', text: 'there' }] },
        ],
      }),
    })
    const [tg] = await parseAll(fs)
    expect(tg.source).toBe('telegram')
    expect(tg.messages[1]).toMatchObject({ fromMe: true, text: 'hey there' })
    expect(tg.messages[0].fromMe).toBe(false)
  })
})

describe('stats engine', () => {
  it('computes the headline numbers from the demo', async () => {
    const data = await parseAll(generateDemo('ru'))
    const stats = computeStats(data, defaultYear(data))
    expect(stats.messages!.sent).toBeGreaterThan(1000)
    expect(stats.messages!.topWords[0].word).toBe('вайб')
    expect(stats.messages!.topEmoji[0].emoji).toBe('😂')
    expect(stats.messages!.fastest[0].name).toBe('Мама')
    expect(stats.videos!.watched).toBeGreaterThan(10000)
    expect(stats.follows!.flings.length).toBeGreaterThan(0)
    expect(stats.ownerName).toBe('Саша')
  })
})

describe('years', () => {
  const msgs = (year: number, n: number) =>
    Array.from({ length: n }, (_, i) => ({ ts: new Date(year, 3, 1 + (i % 25), 12).getTime(), chat: 'A', chatType: 'personal' as const, fromMe: true, sender: 'me', text: 'hi' }))
  const data = (...lists: ReturnType<typeof msgs>[]) => [{ ...emptyData('telegram'), messages: lists.flat() }]

  it('lists every year of a multi-year export', () => {
    expect(availableYears(data(msgs(2022, 300), msgs(2023, 400), msgs(2024, 500)))).toEqual([2024, 2023, 2022])
  })

  it('shows only one year for a one-year export, ignoring stray events', () => {
    expect(availableYears(data(msgs(2026, 5000), msgs(2019, 3)))).toEqual([2026])
  })

  it('demo covers a single calendar year', async () => {
    expect(availableYears(await parseAll(generateDemo('en')))).toHaveLength(1)
  })
})

it('repairs Meta mojibake', () => {
  const broken = String.fromCharCode(...new TextEncoder().encode('Привет 😂'))
  expect(fixMojibake(broken)).toBe('Привет 😂')
  expect(fixMojibake('café')).toBe('café')
})
