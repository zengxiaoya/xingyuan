import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const LV1_LEVELS = ['solar_lv1', 'explore_lv1', 'universe_lv1']
const LV2_LEVELS = ['solar_lv2', 'explore_lv2', 'universe_lv2']
const LV3_LEVELS = ['solar_lv3', 'explore_lv3', 'universe_lv3']

function isLevelUnlocked(levelId, badges) {
  // Lv1 全部默认解锁
  if (LV1_LEVELS.includes(levelId)) return true

  // Lv2：三个 Lv1 全部通关后解锁
  if (LV2_LEVELS.includes(levelId)) {
    return LV1_LEVELS.every((id) => badges.includes(id))
  }

  // Lv3：三个 Lv2 全部通关后解锁
  if (LV3_LEVELS.includes(levelId)) {
    return LV2_LEVELS.every((id) => badges.includes(id))
  }

  return false
}

export const useProgressStore = create(
  persist(
    (set, get) => ({
      badges: [],
      scientists: [],
      stars: 0,
      creativeAnswers: {},

      addBadge: (levelId) =>
        set((state) => ({
          badges: state.badges.includes(levelId)
            ? state.badges
            : [...state.badges, levelId]
        })),

      addScientist: (ids) =>
        set((state) => {
          const toAdd = Array.isArray(ids) ? ids : [ids]
          const newScientists = toAdd.filter(
            (id) => !state.scientists.includes(id)
          )
          if (newScientists.length === 0) return {}
          return { scientists: [...state.scientists, ...newScientists] }
        }),

      addStars: (n) =>
        set((state) => ({
          stars: state.stars + n
        })),

      saveCreativeAnswer: (levelId, answer) =>
        set((state) => ({
          creativeAnswers: {
            ...state.creativeAnswers,
            [levelId]: answer
          }
        })),

      completeLevel: (levelId, starsEarned, scientistIds) => {
        const state = get()
        const alreadyCompleted = state.badges.includes(levelId)

        set((s) => {
          const newBadges = s.badges.includes(levelId)
            ? s.badges
            : [...s.badges, levelId]

          const toAdd = Array.isArray(scientistIds) ? scientistIds : []
          const newScientists = toAdd.filter((id) => !s.scientists.includes(id))

          return {
            badges: newBadges,
            scientists: [...s.scientists, ...newScientists],
            stars: alreadyCompleted ? s.stars : s.stars + (starsEarned || 0)
          }
        })
      },

      isLevelUnlocked: (levelId) => {
        const { badges } = get()
        return isLevelUnlocked(levelId, badges)
      },

      isLevelCompleted: (levelId) => {
        const { badges } = get()
        return badges.includes(levelId)
      },

      reset: () =>
        set({
          badges: [],
          scientists: [],
          stars: 0,
          creativeAnswers: {}
        })
    }),
    {
      name: 'xingYuan_progress',
      partialize: (state) => ({
        badges: state.badges,
        scientists: state.scientists,
        stars: state.stars,
        creativeAnswers: state.creativeAnswers
      })
    }
  )
)
