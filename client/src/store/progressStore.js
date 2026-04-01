import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUserStore } from './userStore.js'

function syncProgress(state) {
  const user = useUserStore.getState().user
  if (!user?.name) return
  fetch('/api/sync/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: user.name,
      school: user.school,
      grade: user.grade,
      class_name: user.class_name,
      stars: state.stars,
      badges: state.badges,
      scientists: state.scientists,
      creativeAnswers: state.creativeAnswers,
      novaEvaluation: state.novaEvaluation,
    }),
  }).catch(() => {})
}

const LV1_LEVELS = ['solar_lv1', 'explore_lv1', 'universe_lv1']

// 同主题链式解锁：完成本主题上一级即可解锁下一级
const PREREQ = {
  solar_lv2: 'solar_lv1',
  explore_lv2: 'explore_lv1',
  universe_lv2: 'universe_lv1',
  solar_lv3: 'solar_lv2',
  explore_lv3: 'explore_lv2',
  universe_lv3: 'universe_lv2',
}

function isLevelUnlocked(levelId, badges) {
  if (LV1_LEVELS.includes(levelId)) return true
  const prereq = PREREQ[levelId]
  return prereq ? badges.includes(prereq) : false
}

export const useProgressStore = create(
  persist(
    (set, get) => ({
      badges: [],
      scientists: [],
      stars: 0,
      creativeAnswers: {},
      novaEvaluation: '',

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

      saveCreativeAnswer: (levelId, answer) => {
        set((state) => ({
          creativeAnswers: {
            ...state.creativeAnswers,
            [levelId]: answer
          }
        }))
        syncProgress(get())
      },

      setNovaEvaluation: (text) => {
        set({ novaEvaluation: text })
        syncProgress(get())
      },

      // 登录找回进度时，用数据库数据覆盖本地 localStorage
      restoreFromDB: (data) => set({
        stars: data.stars || 0,
        badges: data.badges || [],
        scientists: data.scientists || [],
        creativeAnswers: data.creativeAnswers || {},
        novaEvaluation: data.novaEvaluation || '',
      }),

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
        // 同步最新进度到数据库
        syncProgress(get())
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
          creativeAnswers: {},
          novaEvaluation: ''
        })
    }),
    {
      name: 'xingYuan_progress',
      partialize: (state) => ({
        badges: state.badges,
        scientists: state.scientists,
        stars: state.stars,
        creativeAnswers: state.creativeAnswers,
        novaEvaluation: state.novaEvaluation
      })
    }
  )
)
