import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProgressStore } from '../progressStore.js'

// Silence fire-and-forget fetch calls (no server in unit tests)
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

beforeEach(() => {
  useProgressStore.getState().reset()
})

describe('isLevelUnlocked', () => {
  it('lv1 levels are always unlocked', () => {
    const { isLevelUnlocked } = useProgressStore.getState()
    expect(isLevelUnlocked('solar_lv1')).toBe(true)
    expect(isLevelUnlocked('explore_lv1')).toBe(true)
    expect(isLevelUnlocked('universe_lv1')).toBe(true)
  })

  it('lv2 is locked without lv1 badge', () => {
    expect(useProgressStore.getState().isLevelUnlocked('solar_lv2')).toBe(false)
    expect(useProgressStore.getState().isLevelUnlocked('explore_lv2')).toBe(false)
  })

  it('lv2 unlocks after lv1 completed', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 30, [])
    expect(useProgressStore.getState().isLevelUnlocked('solar_lv2')).toBe(true)
    expect(useProgressStore.getState().isLevelUnlocked('solar_lv3')).toBe(false)
  })

  it('lv3 unlocks only after lv2 completed', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 30, [])
    useProgressStore.getState().completeLevel('solar_lv2', 30, [])
    expect(useProgressStore.getState().isLevelUnlocked('solar_lv3')).toBe(true)
  })

  it('unlock is per-theme (solar does not unlock explore)', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 30, [])
    expect(useProgressStore.getState().isLevelUnlocked('explore_lv2')).toBe(false)
  })

  it('unknown levelId returns false', () => {
    expect(useProgressStore.getState().isLevelUnlocked('nonexistent_lv2')).toBe(false)
  })
})

describe('completeLevel', () => {
  it('adds badge and awards stars', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 25, [])
    const { badges, stars } = useProgressStore.getState()
    expect(badges).toContain('solar_lv1')
    expect(stars).toBe(25)
  })

  it('does not double-award stars on re-completion', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 25, [])
    useProgressStore.getState().completeLevel('solar_lv1', 25, [])
    expect(useProgressStore.getState().stars).toBe(25)
  })

  it('badge is not duplicated on re-completion', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 10, [])
    useProgressStore.getState().completeLevel('solar_lv1', 10, [])
    const { badges } = useProgressStore.getState()
    expect(badges.filter(b => b === 'solar_lv1').length).toBe(1)
  })

  it('adds scientists', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 10, ['galileo', 'newton'])
    const { scientists } = useProgressStore.getState()
    expect(scientists).toContain('galileo')
    expect(scientists).toContain('newton')
  })

  it('does not duplicate scientists across levels', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 10, ['galileo'])
    useProgressStore.getState().completeLevel('solar_lv2', 10, ['galileo', 'newton'])
    const { scientists } = useProgressStore.getState()
    expect(scientists.filter(s => s === 'galileo').length).toBe(1)
    expect(scientists).toContain('newton')
  })
})

describe('restoreFromDB', () => {
  it('overwrites all local state', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 50, ['galileo'])

    useProgressStore.getState().restoreFromDB({
      stars: 100,
      badges: ['solar_lv1', 'solar_lv2'],
      scientists: ['newton'],
      creativeAnswers: { solar_lv1: '我的答案' },
      novaEvaluation: 'NOVA的评语',
    })

    const state = useProgressStore.getState()
    expect(state.stars).toBe(100)
    expect(state.badges).toEqual(['solar_lv1', 'solar_lv2'])
    expect(state.scientists).toEqual(['newton'])
    expect(state.creativeAnswers).toEqual({ solar_lv1: '我的答案' })
    expect(state.novaEvaluation).toBe('NOVA的评语')
  })

  it('uses defaults for missing fields', () => {
    useProgressStore.getState().restoreFromDB({})
    const state = useProgressStore.getState()
    expect(state.stars).toBe(0)
    expect(state.badges).toEqual([])
    expect(state.scientists).toEqual([])
    expect(state.creativeAnswers).toEqual({})
    expect(state.novaEvaluation).toBe('')
  })
})

describe('saveCreativeAnswer', () => {
  it('saves and overwrites answer for a level', () => {
    useProgressStore.getState().saveCreativeAnswer('solar_lv1', '第一次答案')
    useProgressStore.getState().saveCreativeAnswer('solar_lv1', '第二次答案')
    expect(useProgressStore.getState().creativeAnswers['solar_lv1']).toBe('第二次答案')
  })

  it('preserves other levels answers', () => {
    useProgressStore.getState().saveCreativeAnswer('solar_lv1', '答案A')
    useProgressStore.getState().saveCreativeAnswer('explore_lv1', '答案B')
    const { creativeAnswers } = useProgressStore.getState()
    expect(creativeAnswers['solar_lv1']).toBe('答案A')
    expect(creativeAnswers['explore_lv1']).toBe('答案B')
  })
})

describe('reset', () => {
  it('clears all progress', () => {
    useProgressStore.getState().completeLevel('solar_lv1', 50, ['galileo'])
    useProgressStore.getState().saveCreativeAnswer('solar_lv1', '答案')
    useProgressStore.getState().reset()
    const state = useProgressStore.getState()
    expect(state.stars).toBe(0)
    expect(state.badges).toEqual([])
    expect(state.scientists).toEqual([])
    expect(state.creativeAnswers).toEqual({})
  })
})
